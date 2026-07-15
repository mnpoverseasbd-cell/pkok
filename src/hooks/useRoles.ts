import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services";
import type { Role } from "@/core/constants";

export function useCurrentAppUser() {
  return useQuery({
    queryKey: ["auth", "app-user"],
    queryFn: () => authService.getCurrentUser(),
    staleTime: 60_000,
  });
}

export function useHasRole(role: Role) {
  const { data: user } = useCurrentAppUser();
  return authService.hasRole(user ?? null, role);
}
