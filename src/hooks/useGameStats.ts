import { useCallback, useEffect, useState } from "react";

export type GameId =
  | "dice" | "crash" | "mines" | "coinflip" | "plinko" | "wheel" | "limbo"
  | "chicken-road" | "tower" | "lucky-card" | "shell-game" | "scratch-card" | "keno" | "hi-lo" | "color-prediction"
  | "andar-bahar" | "dragon-tiger" | "teen-patti" | "seven-up-down" | "baccarat" | "sic-bo" | "roulette" | "blackjack" | "32-cards" | "video-poker" | "slots" | "bingo" | "matka" | "fish-shooter" | "megaways" | "aviatrix" | "dragon-fishing" | "penalty" | "cricket" | "ludo" | "carrom" | "fan-tan" | "balloon" | "dragon-phoenix";

export type GameStats = {
  wins: number;
  losses: number;
  pnl: number;
  bestMultiplier: number;
  rounds: number;
};

const EMPTY: GameStats = { wins: 0, losses: 0, pnl: 0, bestMultiplier: 0, rounds: 0 };
const KEY = (id: GameId) => `asik_game_stats_v1:${id}`;
const EVT = "demo-game-stats-change";

function read(id: GameId): GameStats {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY(id));
    if (!raw) return EMPTY;
    return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    return EMPTY;
  }
}

function write(id: GameId, s: GameStats) {
  window.localStorage.setItem(KEY(id), JSON.stringify(s));
  window.dispatchEvent(new CustomEvent(EVT, { detail: id }));
}

export function useGameStats(id: GameId) {
  const [stats, setStats] = useState<GameStats>(EMPTY);

  useEffect(() => {
    setStats(read(id));
    const on = () => setStats(read(id));
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => {
      window.removeEventListener(EVT, on);
      window.removeEventListener("storage", on);
    };
  }, [id]);

  const record = useCallback(
    ({ pnl, multiplier }: { pnl: number; multiplier: number }) => {
      const cur = read(id);
      const won = pnl > 0;
      const next: GameStats = {
        wins: cur.wins + (won ? 1 : 0),
        losses: cur.losses + (won ? 0 : 1),
        pnl: cur.pnl + pnl,
        bestMultiplier: Math.max(cur.bestMultiplier, multiplier),
        rounds: cur.rounds + 1,
      };
      write(id, next);
    },
    [id],
  );

  const reset = useCallback(() => write(id, EMPTY), [id]);

  return { stats, record, reset };
}
