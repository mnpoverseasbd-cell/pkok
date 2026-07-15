import { useQuery } from "@tanstack/react-query";
import { walletService } from "@/services";

export function useWalletBalances(userId: string | undefined) {
  return useQuery({
    queryKey: ["wallet", "balances", userId],
    queryFn: () => walletService.getBalances(userId!),
    enabled: !!userId,
  });
}

export function useWalletHistory(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["wallet", "history", userId, limit],
    queryFn: () => walletService.history(userId!, limit),
    enabled: !!userId,
  });
}
