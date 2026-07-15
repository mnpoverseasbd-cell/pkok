import { NotImplementedError } from "@/core/errors";
import type { Tournament } from "@/core/types";

export const tournamentService = {
  async listUpcoming(): Promise<Tournament[]> {
    throw new NotImplementedError("tournamentService.listUpcoming");
  },
  async enroll(_userId: string, _tournamentId: string): Promise<void> {
    throw new NotImplementedError("tournamentService.enroll");
  },
};
