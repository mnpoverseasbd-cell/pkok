export const GAME_CATEGORIES = [
  "slots",
  "live",
  "table",
  "fishing",
  "crash",
  "sports",
  "esports",
  "lottery",
  "poker",
  "hot",
] as const;
export type GameCategory = (typeof GAME_CATEGORIES)[number];

export const TRANSACTION_TYPES = [
  "deposit",
  "withdraw",
  "bet",
  "win",
  "refund",
  "bonus",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const ROLES = ["admin", "user"] as const;
export type Role = (typeof ROLES)[number];

export const GAME_MODES = ["demo", "real"] as const;
export type GameMode = (typeof GAME_MODES)[number];
