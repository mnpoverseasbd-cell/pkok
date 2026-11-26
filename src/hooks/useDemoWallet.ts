import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getActiveGameConfig } from "@/hooks/useGameConfig";

/**
 * Real-money wallet backed by profiles.wallet_balance via the atomic
 * `wallet_mutate` Postgres RPC. Every bet/win writes a `transactions`
 * ledger row (type=bet|win) tagged with game_id + round_id so admin
 * Reports and Bet History reflect true activity.
 *
 * UI stays optimistic — bet() / credit() update local balance synchronously,
 * then reconcile against the RPC result. On failure we revert.
 *
 * A "wallet:balance" window event keeps every mount (GameShell counter,
 * site header) in sync without a manual refresh.
 */

const EVT = "wallet:balance";

function broadcast(next: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
}

function currentGameId(): string {
  if (typeof window === "undefined") return "internal";
  const m = window.location.pathname.match(/\/games\/([^/?#]+)/);
  return m ? m[1] : "internal";
}

function newRoundId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function rpcMutate(
  type: "bet" | "win" | "refund",
  amount: number,
  gameId: string,
  roundId: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("wallet_mutate", {
    _type: type,
    _amount: amount,
    _game_id: gameId,
    _round_id: roundId,
    _note: undefined,
  });
  if (error) {
    console.error("[wallet_mutate]", type, error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : (data as any);
  const nb = Number(row?.new_balance);
  return Number.isFinite(nb) ? nb : null;
}

export function useDemoWallet() {
  const [userId, setUserId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const balanceRef = useRef(0);
  const roundIdRef = useRef<string | null>(null);
  const lastBetRef = useRef<number>(0);

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
      const cur = balanceRef.current;
      if (amount <= 0 || amount > cur) return false;
      const gameId = currentGameId();
      const cfg = getActiveGameConfig(gameId);
      if (cfg) {
        if (!cfg.is_enabled) {
          toast.error("এই গেমটি বর্তমানে বন্ধ আছে");
          return false;
        }
        if (amount < cfg.min_bet) {
          toast.error(`সর্বনিম্ন বাজি ৳${cfg.min_bet}`);
          return false;
        }
        if (amount > cfg.max_bet) {
          toast.error(`সর্বোচ্চ বাজি ৳${cfg.max_bet}`);
          return false;
        }
      }
      lastBetRef.current = amount;
      // Optimistic
      const optimistic = cur - amount;
      setBalance(optimistic);
      broadcast(optimistic);
      const roundId = newRoundId();
      roundIdRef.current = roundId;
      // Ledger write (background)
      void rpcMutate("bet", amount, gameId, roundId).then((nb) => {
        if (nb == null) {
          // Revert on failure
          setBalance(cur);
          broadcast(cur);
          toast.error("বাজি ব্যর্থ — ব্যালেন্স পুনরুদ্ধার হয়েছে");
          roundIdRef.current = null;
        } else if (nb !== balanceRef.current) {
          // Reconcile against server truth
          setBalance(nb);
          broadcast(nb);
        }
      });
      return true;
    },
    [userId],
  );

  const credit = useCallback(
    (amount: number) => {
      if (!userId || amount <= 0) return;
      const gameId = currentGameId();
      const cfg = getActiveGameConfig(gameId);
      let finalAmount = amount;
      const multScale = Number(cfg?.config?.payout_multiplier ?? 1);
      if (Number.isFinite(multScale) && multScale > 0 && multScale !== 1) {
        finalAmount = Math.max(1, Math.floor(finalAmount * multScale));
      }
      const maxCapMult = Number(cfg?.config?.max_payout_mult ?? 0);
      if (Number.isFinite(maxCapMult) && maxCapMult > 0 && lastBetRef.current > 0) {
        finalAmount = Math.min(finalAmount, Math.floor(lastBetRef.current * maxCapMult));
      }
      const cur = balanceRef.current;
      const optimistic = cur + finalAmount;
      setBalance(optimistic);
      broadcast(optimistic);
      const roundId = roundIdRef.current ?? newRoundId();
      void rpcMutate("win", finalAmount, gameId, roundId).then((nb) => {
        if (nb == null) {
          setBalance(cur);
          broadcast(cur);
          toast.error("জয় ক্রেডিট ব্যর্থ — refresh করুন");
        } else if (nb !== balanceRef.current) {
          setBalance(nb);
          broadcast(nb);
        }
        roundIdRef.current = null;
      });
    },
    [userId],
  );

  const refresh = useCallback(() => {
    if (userId) load(userId);
  }, [userId, load]);

  return { balance, bet, credit, reset: refresh, refresh, userId, ready: !!userId && balance > 0, loading };
}
