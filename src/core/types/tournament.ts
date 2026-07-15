export interface Tournament {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  prizePool: number;
  status: "upcoming" | "live" | "ended";
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string | null;
  score: number;
  rank: number;
}
