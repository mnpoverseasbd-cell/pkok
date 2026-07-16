import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/keno")({
  head: () => ({ meta: [
    { title: "Keno — Asik Game" },
    { name: "description", content: "Pick your numbers, watch 10 get drawn from 40." },
  ]}),
  component: KenoGame,
});

const POOL = 40;
const DRAWS = 10;
const PICK_MAX = 8;

// Payout table by (picks, hits) → multiplier
const TABLE: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 7 },
  3: { 2: 2, 3: 15 },
  4: { 3: 3, 4: 30 },
  5: { 3: 2, 4: 8, 5: 50 },
  6: { 4: 5, 5: 20, 6: 100 },
  7: { 4: 3, 5: 10, 6: 40, 7: 200 },
  8: { 5: 5, 6: 25, 7: 80, 8: 500 },
};

function KenoGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("keno");
  const { data: cfg } = useGameConfig("keno");
  const edge = cfg?.house_edge ?? 0.05;
  const [bet, setBet] = useState(50);
  const [picks, setPicks] = useState<Set<number>>(new Set());
  const [draws, setDraws] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const toggle = (n: number) => {
    if (busy) return;
    setPicks((p) => {
      const next = new Set(p);
      if (next.has(n)) next.delete(n);
      else if (next.size < PICK_MAX) next.add(n);
      return next;
    });
  };

  const play = useCallback(async () => {
    if (busy) return;
    if (picks.size === 0) { setMsg("অন্তত ১টি সংখ্যা বাছুন"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setDraws(new Set());
    const remaining = Array.from({ length: POOL }, (_, i) => i + 1);
    const drawn = new Set<number>();
    for (let i = 0; i < DRAWS; i++) {
      const idx = Math.floor(Math.random() * remaining.length);
      drawn.add(remaining[idx]); remaining.splice(idx, 1);
      // reveal incrementally
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 80));
      setDraws(new Set(drawn));
    }
    let hits = 0;
    for (const n of picks) if (drawn.has(n)) hits++;
    const raw = TABLE[picks.size]?.[hits] ?? 0;
    const mult = +(raw * (1 - edge)).toFixed(3);
    if (mult > 0) {
      const w = Math.floor(bet * mult); credit(w);
      const pnl = w - bet;
      setMsg(`🎉 জয় +${pnl} · ${mult}× (${hits}/${picks.size})`);
      record({ pnl, multiplier: mult });
      pushMultiplierHistory("keno", mult);
      recordMyBet({ game: "keno", bet, multiplier: mult, payout: w });
      try { sfxWin(mult); } catch {}
    } else {
      const pnl = -bet;
      setMsg(`💥 হার ${pnl} (${hits}/${picks.size})`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("keno", 0);
      recordMyBet({ game: "keno", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
    setBusy(false);
  }, [busy, picks, bet, edge, placeBet, credit, record]);

  return (
    <GameShell title="Keno" emoji="🎱" gameKey="keno">
      <GameFrame>
        <div className="relative flex flex-1 flex-col gap-3 overflow-hidden rounded-2xl border border-[#0a2a3a] bg-gradient-to-b from-[#04121a] via-[#020a10] to-[#010508] p-4 min-h-[340px]">
          <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
            {Array.from({ length: POOL }, (_, i) => i + 1).map((n) => {
              const picked = picks.has(n); const drawn = draws.has(n);
              const hit = picked && drawn;
              return (
                <button key={n} onClick={() => toggle(n)} disabled={busy}
                  className={`aspect-square rounded-md text-sm font-black transition ${
                    hit ? "bg-emerald-500 text-black" :
                    drawn ? "bg-yellow-500 text-black" :
                    picked ? "bg-fuchsia-500 text-white" :
                    "bg-white/10 text-white/80 hover:bg-white/20"
                  } disabled:cursor-default`}
                >{n}</button>
              );
            })}
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="বাছাই" value={`${picks.size}/${PICK_MAX}`} sub={<>সর্বোচ্চ: 500× (8/8)</>} />
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={play} disabled={busy}>{busy ? "ড্র চলছে..." : "প্লে"}</PrimaryButton>
          <button disabled={busy} onClick={() => setPicks(new Set())}
            className="rounded-lg bg-white/10 py-2 text-xs font-bold text-white hover:bg-white/20 disabled:opacity-50">
            ক্লিয়ার
          </button>
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="keno" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
