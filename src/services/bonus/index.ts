import { NotImplementedError } from "@/core/errors";
import type { Bonus } from "@/core/types";

export const bonusService = {
  async listForUser(_userId: string): Promise<Bonus[]> {
    return [];
  },
  async claim(_userId: string, _bonusId: string): Promise<Bonus> {
    throw new NotImplementedError("bonusService.claim");
  },
};
