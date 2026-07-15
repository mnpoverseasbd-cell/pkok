import { supabase } from "@/integrations/supabase/client";
import { profileRepo } from "@/repositories";
import type { AppUser } from "@/core/types";
import type { Role } from "@/core/constants";

export const authService = {
  async getCurrentUser(): Promise<AppUser | null> {
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) return null;
    const [profile, roles] = await Promise.all([
      profileRepo.getById(user.id),
      profileRepo.getRoles(user.id),
    ]);
    return {
      id: user.id,
      email: profile?.email ?? user.email ?? null,
      phone: profile?.phone ?? null,
      username: profile?.username ?? null,
      displayName: profile?.display_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      referralCode: profile?.referral_code ?? "",
      vipTier: profile?.vip_tier ?? "bronze",
      roles: roles as Role[],
      createdAt: profile?.created_at ?? user.created_at,
    };
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  hasRole(user: AppUser | null, role: Role) {
    return !!user?.roles.includes(role);
  },
};
