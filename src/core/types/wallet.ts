import type { TransactionType } from "../constants";

export interface WalletBalances {
  main: number;
  bonus: number;
  total: number;
  currency: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: "pending" | "approved" | "rejected" | "cancelled";
  amount: number;
  reference: string | null;
  note: string | null;
  createdAt: string;
  approvedAt: string | null;
  meta?: Record<string, unknown>;
}

export interface WalletMutationResult {
  txnId: string;
  balances: WalletBalances;
}
