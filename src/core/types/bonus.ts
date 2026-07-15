export interface Bonus {
  id: string;
  userId: string;
  type: "welcome" | "deposit" | "cashback" | "freebet" | "custom";
  amount: number;
  wagerRequirement: number;
  wagerCompleted: number;
  status: "active" | "expired" | "used" | "forfeited";
  expiresAt: string | null;
  createdAt: string;
}

export interface Promotion {
  id: string;
  slug: string;
  title: string;
  description: string;
  image?: string;
  startsAt: string;
  endsAt: string | null;
  active: boolean;
}
