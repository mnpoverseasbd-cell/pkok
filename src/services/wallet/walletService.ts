import { walletRepo } from "@/repositories";
import { NotImplementedError, WalletError } from "@/core/errors";
import type { WalletBalances, WalletMutationResult, WalletTransaction } from "@/core/types";

/**
 * Unified wallet service. Every game (internal or external) must go through
 * this service — never touch supabase.transactions directly from a game.
 *
 * Persistence for bet/win/refund requires a future migration extending the
 * `txn_type` enum with those values. Until then those calls throw
 * NotImplementedError so no ghost balances are produced.
 */
export const walletService = {
  async getBalances(userId: string): Promise<WalletBalances> {
    const main = await walletRepo.getBalance(userId);
    return { main, bonus: 0, total: main, currency: "BDT" };
  },

  async history(userId: string, limit = 50): Promise<WalletTransaction[]> {
    const rows = await walletRepo.listTransactions(userId, limit);
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type as WalletTransaction["type"],
      status: r.status,
      amount: Number(r.amount),
      reference: r.txn_reference,
      note: r.user_note ?? r.admin_note,
      createdAt: r.created_at,
      approvedAt: r.approved_at,
    }));
  },

  // Mutations. Deposits/withdraws already run through the wallet route UI
  // against the transactions table. These wrappers exist so future callers
  // have a single funnel. Wire real implementations in the follow-up pass.
  async deposit(_userId: string, _amount: number): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.deposit — use /wallet UI or add server function");
  },
  async withdraw(_userId: string, _amount: number): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.withdraw — use /wallet UI or add server function");
  },
  async bet(_userId: string, _amount: number, _ref: { gameId: string; roundId: string }): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.bet — requires bet/win/refund migration");
  },
  async win(_userId: string, _amount: number, _ref: { gameId: string; roundId: string }): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.win — requires bet/win/refund migration");
  },
  async refund(_userId: string, _amount: number, _ref: { gameId: string; roundId: string }): Promise<WalletMutationResult> {
    throw new NotImplementedError("walletService.refund — requires bet/win/refund migration");
  },

  assertSufficient(balances: WalletBalances, amount: number) {
    if (balances.total < amount) throw new WalletError("Insufficient balance", "INSUFFICIENT_FUNDS");
  },
};
