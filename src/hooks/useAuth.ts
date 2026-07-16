import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  referral_code: string;
  wallet_balance: number;
  vip_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: existing, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, phone, email, referral_code, wallet_balance, vip_tier")
        .eq("id", userId)
        .maybeSingle();
      if (error) console.error("[useProfile] fetch error:", error);
      if (existing) {
        if (!cancelled) {
          setProfile(existing as Profile);
          setLoading(false);
        }
        return;
      }
      // Auto-create missing profile row (older accounts predating the trigger)
      const { data: userData } = await supabase.auth.getUser();
      const u = userData.user;
      if (!u) {
        if (!cancelled) setLoading(false);
        return;
      }
      const meta = (u.user_metadata ?? {}) as Record<string, string | undefined>;
      const username = meta.username || u.email || u.id;
      const { data: created, error: insertErr } = await supabase
        .from("profiles")
        .insert({
          id: u.id,
          username,
          display_name: meta.display_name || username,
          email: u.email ?? null,
          phone: meta.phone ?? null,
          referral_code: (globalThis.crypto?.randomUUID?.() ?? `${u.id}-${Date.now()}`),
        })
        .select("id, username, display_name, avatar_url, phone, email, referral_code, wallet_balance, vip_tier")
        .maybeSingle();
      if (insertErr) console.error("[useProfile] auto-create error:", insertErr);
      if (!cancelled) {
        setProfile((created as Profile) ?? null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, reloadKey]);

  // Live-sync wallet balance from game hooks (see useDemoWallet broadcast).
  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (typeof next !== "number" || !Number.isFinite(next)) return;
      setProfile((p) => (p ? { ...p, wallet_balance: next } : p));
    };
    window.addEventListener("wallet:balance", handler);
    return () => window.removeEventListener("wallet:balance", handler);
  }, []);

  return { profile, loading, refetch: () => setReloadKey((k) => k + 1) };
}

export function useIsAdmin(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setIsAdmin(!!data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isAdmin, loading };
}

export async function signOut() {
  await supabase.auth.signOut();
}
