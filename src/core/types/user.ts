import type { Role } from "../constants";

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  referralCode: string;
  vipTier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  roles: Role[];
  createdAt: string;
}
