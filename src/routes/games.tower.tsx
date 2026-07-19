import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairFloats } from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/tower")({
  head: () => ({ meta: [
    { title: "Tower — Royal Step — Asik Game" },
    { name: "description", content: "Climb the tower one floor at a time. Higher = bigger payout." },
  ]}),
  component: TowerGame,
});

const FLOORS = 8;
const TILES = 3;
const SURVIVE = 1 / TILES; // 1 of 3 safe

function TowerGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("tower");
  const { data: cfg } = useGameConfig("tower");
  const edge = cfg?.house_edge ?? 0.03;
  const [bet, setBet] = useState(50);
  const [floor, setFloor] = useState(0);
  const [safeTiles, setSafeTiles] = useState<number[]>([]);
  const [reveals, setReveals] = useState<{ floor: number; pick: number; safe: number }[]>([]);
  const [active, setActive] = useState(false);
  const [msg, setMsg] = useState("");

  const mult = useMemo(
    () => +((1 / SURVIVE) ** floor * (1 - edge)).toFixed(3),
    [floor, edge],
  );
  const nextMult = +((1 / SURVIVE) ** (floor + 1) * (1 - edge)).toFixed(3);

  const start = useCallback(() => {
    if (active) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    const st: number[] = [];
    for (let i = 0; i < FLOORS; i++) st.push(Math.floor(Math.random() * TILES));
    setSafeTiles(st); setFloor(0); setReveals([]); setActive(true); setMsg("");
  }, [active, bet, placeBet]);

  const pick = useCallback((tile: number) => {
    if (!active) return;
    const safe = safeTiles[floor];
    setReveals((r) => [...r, { floor, pick: tile, safe }]);
    if (tile === safe) {
      const nextFloor = floor + 1;
      if (nextFloor >= FLOORS) {
        const win = Math.floor(bet * nextMult);
        credit(win);
        const pnl = win - bet;
        setActive(false);
        setMsg(`👑 টপ! +${pnl} · ${nextMult}×`);
        record({ pnl, multiplier: nextMult });
        pushMultiplierHistory("tower", nextMult);
        recordMyBet({ game: "tower", bet, multiplier: nextMult, payout: win });
        try { sfxWin(nextMult); } catch {}
      } else {
        setFloor(nextFloor);
      }
    } else {
      setActive(false);
      const pnl = -bet;
      setMsg(`💥 হার ${pnl}`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("tower", 0);
      recordMyBet({ game: "tower", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
  }, [active, safeTiles, floor, bet, nextMult, credit, record]);

  const cashout = useCallback(() => {
    if (!active || floor === 0) return;
    const win = Math.floor(bet * mult);
    credit(win);
    const pnl = win - bet;
    setActive(false);
    setMsg(`🎉 জয় +${pnl} · ${mult}×`);
    record({ pnl, multiplier: mult });
    pushMultiplierHistory("tower", mult);
    recordMyBet({ game: "tower", bet, multiplier: mult, payout: win });
    try { sfxWin(mult); } catch {}
  }, [active, floor, bet, mult, credit, record]);

  return (
    <GameShell title="Tower · Royal Step" emoji="🗼" gameKey="tower">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#2a1050] bg-gradient-to-b from-[#0e0625] via-[#050110] to-[#020008] p-6 min-h-[340px]">
          {Array.from({ length: FLOORS }).map((_, i) => {
            const f = FLOORS - 1 - i;
            const isCurrent = active && f === floor;
            const rev = reveals.find((r) => r.floor === f);
            return (
              <div key={f} className="flex w-full max-w-md items-center gap-2">
                <span className="w-6 text-right text-[10px] font-bold text-violet-300/60">{f + 1}</span>
                <div className="grid flex-1 grid-cols-3 gap-2">
                  {Array.from({ length: TILES }).map((_, t) => {
                    const state = rev
                      ? (t === rev.safe ? "safe" : t === rev.pick ? "wrong" : "hidden")
                      : "hidden";
                    return (
                      <button
                        key={t} disabled={!isCurrent}
                        onClick={() => pick(t)}
                        className={`h-10 rounded-md border text-lg font-black transition ${
                          state === "safe" ? "border-emerald-400 bg-emerald-500/40 text-white" :
                          state === "wrong" ? "border-rose-500 bg-rose-500/40 text-white" :
                          isCurrent ? "border-yellow-400/70 bg-yellow-500/10 hover:bg-yellow-500/25 text-white/90" :
                          "border-white/10 bg-white/5 text-white/40"
                        } disabled:cursor-default`}
                      >{state === "safe" ? "✓" : state === "wrong" ? "✗" : "?"}</button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="বর্তমান" value={`${mult.toFixed(2)}×`} sub={<>পরবর্তী: <span className="text-cyan-300">{nextMult.toFixed(2)}×</span></>} />
          <BetControls bet={bet} setBet={setBet} disabled={active} />
          {!active ? (
            <PrimaryButton onClick={start}>স্টার্ট</PrimaryButton>
          ) : (
            <PrimaryButton onClick={cashout} tone="gold" disabled={floor === 0}>ক্যাশআউট · {Math.floor(bet * mult)}</PrimaryButton>
          )}
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="tower" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
