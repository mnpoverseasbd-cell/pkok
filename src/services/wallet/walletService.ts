import { walletRepo } from "@/repositories";
import { supabase } from "@/integrations/supabase/client";
import { NotImplementedError, WalletError } from "@/core/errors";
import type { WalletBalances, WalletMutationResult, WalletTransaction } from "@/core/types";

type RoundRef = { gameId: string; roundId: string; note?: string };

async function mutate(
  _type: "bet" | "win" | "refund",
  amount: number,
  _ref: RoundRef,
): Promise<WalletMutationResult> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletError("Amount must be > 0", "INVALID_AMOUNT");
  }
  throw new WalletError("Game wagering and payouts are paused until outcomes are verified", "MUTATE_FAILED");
}

/**
 * Unified wallet service. Every game (internal or external) must go through
 * this service — never touch supabase.transactions directly from a game.
 *
 * bet/win/refund remain unavailable until their outcomes can be verified server-side.
 */
export const walletService = {
  async getBalances(userId: string): Promise<WalletBalances> {
    const main = await walletRepo.getBalance(userId);
    return { main, bonus: 0, total: main, currency: "BDT" };
  },

  async history(userId: string, limit = 50): Promise<WalletTransaction[]> {
    const rows = await walletRepo.listTransactions(userId, limit);
    return rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type as WalletTransaction["type"],
      status: r.status,
      amount: Number(r.amount),
      reference: r.txn_reference,
      note: r.user_note ?? r.admin_note,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
      meta: { gameId: r.game_id ?? undefined, roundId: r.round_id ?? undefined },
    }));
  },

  async historyByType(
    userId: string,
    types: WalletTransaction["type"][],
    limit = 50,
  ): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .in("type", types)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      status: r.status,
      amount: Number(r.amount),
      reference: r.txn_reference,
      note: r.user_note ?? r.admin_note,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
      meta: { gameId: r.game_id ?? undefined, roundId: r.round_id ?? undefined },
    }));
  },

  // Deposit / withdraw still funnel through the existing wallet UI which
  // writes pending transactions for admin review. Those flows will be
  // migrated to server functions in a follow-up pass.
  async deposit(_userId: string, _amount: number): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.deposit — use /wallet UI");
  },
  async withdraw(_userId: string, _amount: number): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.withdraw — use /wallet UI");
  },

  bet(_userId: string, amount: number, ref: RoundRef) {
    return mutate("bet", amount, ref);
  },
  win(_userId: string, amount: number, ref: RoundRef) {
    return mutate("win", amount, ref);
  },
  refund(_userId: string, amount: number, ref: RoundRef) {
    return mutate("refund", amount, ref);
  },

  assertSufficient(balances: WalletBalances, amount: number) {
    if (balances.total < amount) throw new WalletError("Insufficient balance", "INSUFFICIENT_FUNDS");
  },
};
