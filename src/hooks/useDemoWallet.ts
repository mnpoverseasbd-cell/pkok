import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Coin wallet backed by profiles.wallet_balance in Supabase.
 * Requires the user to be logged in. Games check `ready` before allowing bets.
 *
 * NOTE: Every mount of this hook stays in sync via a shared window event
 * ("wallet:balance"), so GameShell's coin counter reflects bets/wins
 * placed by the game component without waiting for a manual refresh.
 */

const EVT = "wallet:balance";

function broadcast(next: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
}

export function useDemoWallet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const balanceRef = useRef(0);

  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

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

  // Listen for balance updates from other mounts of this hook.
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

  const persist = useCallback(async (uid: string, next: number) => {
    await supabase.from("profiles").update({ wallet_balance: next }).eq("id", uid);
  }, []);

  const bet = useCallback(
    (amount: number) => {
      if (!userId) return false;
      const cur = balanceRef.current;
      if (amount <= 0 || amount > cur) return false;
      const next = cur - amount;
      setBalance(next);
      broadcast(next);
      void persist(userId, next);
      return true;
    },
    [userId, persist],
  );

  const credit = useCallback(
    (amount: number) => {
      if (!userId || amount <= 0) return;
      const next = balanceRef.current + amount;
      setBalance(next);
      broadcast(next);
      void persist(userId, next);
    },
    [userId, persist],
  );

  const refresh = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { balance, bet, credit, reset: refresh, refresh, userId, ready: !!userId && balance > 0, loading };
}
