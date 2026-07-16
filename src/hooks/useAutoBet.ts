import { useCallback, useRef, useState } from "react";

export type AutoBetConfig = {
  numberOfBets: number;   // 0 = infinite
  onWinPct: number;       // % change on win (0 = reset to base)
  onLossPct: number;      // % change on loss (0 = reset to base)
  stopOnProfit: number;   // 0 = disabled
  stopOnLoss: number;     // 0 = disabled (positive value; stop when profit ≤ -this)
};

export const DEFAULT_AUTO_BET: AutoBetConfig = {
  numberOfBets: 10,
  onWinPct: 0,
  onLossPct: 0,
  stopOnProfit: 0,
  stopOnLoss: 0,
};

export type RoundResult = { pnl: number };

export function useAutoBet(opts: {
  runRound: (bet: number) => Promise<RoundResult>;
  baseBet: number;
  delayMs?: number;
}) {
  const { runRound, baseBet, delayMs = 400 } = opts;
  const [cfg, setCfg] = useState<AutoBetConfig>(DEFAULT_AUTO_BET);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, profit: 0 });
  const stopRef = useRef(false);

  const stop = useCallback(() => { stopRef.current = true; }, []);

  const start = useCallback(async () => {
    if (running) return;
    stopRef.current = false;
    setRunning(true);
    const total = cfg.numberOfBets;
    let done = 0;
    let profit = 0;
    let currentBet = baseBet;

    while (!stopRef.current && (total === 0 || done < total)) {
      const { pnl } = await runRound(currentBet);
      done++;
      profit += pnl;
      setProgress({ done, total, profit });

      // Adjust next bet
      if (pnl > 0) {
        currentBet = cfg.onWinPct === 0
          ? baseBet
          : Math.max(1, Math.round(currentBet * (1 + cfg.onWinPct / 100)));
      } else {
        currentBet = cfg.onLossPct === 0
          ? baseBet
          : Math.max(1, Math.round(currentBet * (1 + cfg.onLossPct / 100)));
      }

      // Stop conditions
      if (cfg.stopOnProfit > 0 && profit >= cfg.stopOnProfit) break;
      if (cfg.stopOnLoss > 0 && profit <= -cfg.stopOnLoss) break;

      if (!stopRef.current) await new Promise((r) => setTimeout(r, delayMs));
    }

    setRunning(false);
  }, [running, cfg, baseBet, runRound, delayMs]);

  return { cfg, setCfg, running, progress, start, stop };
}
