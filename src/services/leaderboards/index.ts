import { NotImplementedError } from "@/core/errors";
import type { LeaderboardEntry } from "@/core/types";

export const leaderboardService = {
  async top(_scope: string, _limit = 100): Promise<LeaderboardEntry[]> {
    throw new NotImplementedError("leaderboardService.top");
  },
};
