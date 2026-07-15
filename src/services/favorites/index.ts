import { NotImplementedError } from "@/core/errors";

export const favoritesService = {
  async list(_userId: string): Promise<string[]> {
    return [];
  },
  async add(_userId: string, _gameId: string): Promise<void> {
    throw new NotImplementedError("favoritesService.add — requires favorites table");
  },
  async remove(_userId: string, _gameId: string): Promise<void> {
    throw new NotImplementedError("favoritesService.remove — requires favorites table");
  },
};
