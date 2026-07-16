import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/limbo")({
  head: () => ({
    meta: [
      { title: "Limbo — Asik Game" },
      { name: "description", content: "Pick a target multiplier. If the round result is at or above your target, you win." },
    ],
  }),
  component: LimboGame,
});

function LimboGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("limbo");
  const { data: cfg } = useGameConfig("limbo");
  const edge = cfg?.house_edge ?? 0;
  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(2.0);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const winChance = Math.min(99, +(99 / target).toFixed(2));
  const payout = target;

  const play = async () => {
    if (rolling) return;
    if (target < 1.01) { setMsg("টার্গেট ≥ 1.01× হতে হবে"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setRolling(true); setMsg("");
    for (let i = 0; i < 14; i++) {
      setResult(+(1 + Math.random() * (target * 2)).toFixed(2));
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 55));
    }
    const u = Math.random();
    const final = +Math.max(1, 0.99 / u).toFixed(2);
    setResult(final);
    if (final >= target) {
      const won = Math.floor(bet * payout * (1 - edge)); credit(won);
      setMsg(`🎉 জয় +${won - bet}`);
      record({ pnl: won - bet, multiplier: won / bet });
    } else {
      setMsg(`💥 হার -${bet}`);
      record({ pnl: -bet, multiplier: 0 });
    }
    setRolling(false);
  };

  const win = result !== null && result >= target;

  return (
    <GameShell title="Limbo" emoji="🚀" gameKey="limbo">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className={`grid min-h-[220px] w-full max-w-md place-items-center rounded-3xl border-2 bg-gradient-to-br text-7xl font-black tabular-nums shadow-2xl transition-colors ${
              win ? "border-[#00ff88] from-[#00ff88]/15 to-[#004d2a] text-[#00ff88] shadow-[0_0_40px_rgba(0,255,136,0.4)]"
                  : result !== null ? "border-[#ff4444]/50 from-[#4d0000]/30 to-[#0a120b] text-white"
                  : "border-[#1a3321] from-[#112216] to-[#0a120b] text-white"
            } ${rolling ? "animate-pulse" : ""}`}
          >
            {result?.toFixed(2) ?? "0.00"}×
          </div>
          {msg && <div className="animate-fade-in text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay
            label="টার্গেট"
            value={`${target.toFixed(2)}×`}
            sub={<>সম্ভাবনা: <span className="text-[#00ff88]">{winChance}%</span> · জয়: <span className="text-[var(--neon-gold)]">{Math.floor(bet * payout)}</span></>}
          />
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">টার্গেট মাল্টিপ্লায়ার</label>
            <input
              type="number" step="0.01" min={1.01} max={1000} value={target} disabled={rolling}
              onChange={(e) => setTarget(Math.max(1.01, Number(e.target.value) || 1.01))}
              className="w-full rounded-lg border border-[#1a3321] bg-[#112216] p-3 font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
            />
            <div className="flex gap-1">
              {[1.5, 2, 5, 10, 100].map((t) => (
                <button
                  key={t} onClick={() => setTarget(t)} disabled={rolling}
                  className={`flex-1 rounded px-2 py-1.5 text-xs font-bold transition ${
                    target === t ? "bg-[#00ff88]/15 text-[#00ff88] ring-1 ring-[#00ff88]" : "bg-[#1a3321] text-white/80 hover:bg-[#254a30]"
                  } disabled:opacity-40`}
                >
                  {t}×
                </button>
              ))}
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={rolling} />
          <PrimaryButton onClick={play} disabled={rolling}>
            {rolling ? "রোলিং..." : `প্লে · ${Math.floor(bet * payout)}`}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}
