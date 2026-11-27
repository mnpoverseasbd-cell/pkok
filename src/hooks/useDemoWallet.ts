import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Reads the current wallet balance; game wagers and credits stay paused until server verification is available. */

const EVT = "wallet:balance";

function broadcast(next: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
}

export function useDemoWallet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", uid)
      .maybeSingle();
    const n = Number(data?.wallet_balance ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    setBalance(safe);
    broadcast(safe);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) load(uid);
      else setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) load(uid);
      else {
        setBalance(0);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent).detail;
      if (typeof next === "number" && Number.isFinite(next)) {
        setBalance(next);
      }
    };
    window.addEventListener(EVT, handler);
    return () => window.removeEventListener(EVT, handler);
  }, []);

  const bet = useCallback(
    (amount: number) => {
      if (!userId) return false;
      if (!Number.isFinite(amount) || amount <= 0) return false;
      toast.info("গেমে বাজি সাময়িকভাবে বন্ধ আছে; সার্ভার যাচাই চালু হলে আবার শুরু হবে");
      return false;
    },
    [userId],
  );

  const credit = useCallback(
    (amount: number) => {
      if (!userId || !Number.isFinite(amount) || amount <= 0) return;
      toast.info("জয়ের টাকা সাময়িকভাবে বন্ধ আছে; যাচাইকৃত ফল চালু হলে আবার শুরু হবে");
    },
    [userId],
  );

  const refresh = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  const syncBalance = useCallback((next: number) => {
    if (!Number.isFinite(next) || next < 0) return;
    setBalance(next);
    broadcast(next);
  }, []);

  return { balance, bet, credit, reset: refresh, refresh, syncBalance, userId, ready: !!userId && balance > 0, loading };
}
