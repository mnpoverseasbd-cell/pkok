import { NotImplementedError } from "@/core/errors";

export const recentlyPlayedService = {
  async list(_userId: string, _limit = 20): Promise<string[]> {
    return [];
  },
  async record(_userId: string, _gameId: string): Promise<void> {
    throw new NotImplementedError("recentlyPlayedService.record — requires recently_played table");
  },
};
