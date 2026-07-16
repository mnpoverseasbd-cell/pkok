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

export function useBetHistory(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["wallet", "bets", userId, limit],
    queryFn: () => walletService.historyByType(userId!, ["bet"], limit),
    enabled: !!userId,
  });
}

export function useWinHistory(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["wallet", "wins", userId, limit],
    queryFn: () => walletService.historyByType(userId!, ["win"], limit),
    enabled: !!userId,
  });
}

export function useRefundHistory(userId: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["wallet", "refunds", userId, limit],
    queryFn: () => walletService.historyByType(userId!, ["refund"], limit),
    enabled: !!userId,
  });
}
