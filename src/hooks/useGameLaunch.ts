import { useMutation } from "@tanstack/react-query";
import { gameRegistry } from "@/game-engine";
import type { LaunchContext } from "@/game-engine/Game";

export function useGameLaunch() {
  return useMutation({
    mutationFn: async ({ gameId, ctx }: { gameId: string; ctx: LaunchContext }) => {
      const game = gameRegistry.get(gameId);
      if (!game) throw new Error(`Game not found: ${gameId}`);
      if (ctx.mode === "demo" && !game.supportsDemo()) throw new Error("Demo mode not supported");
      if (ctx.mode === "real" && !game.supportsReal()) throw new Error("Real-money mode not supported");
      return game.launch(ctx);
    },
  });
}
