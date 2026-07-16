import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/wheel")({
  head: () => ({ meta: [{ title: "Wheel of Fortune — Asik Game" }, { name: "description", content: "Spin the wheel." }] }),
  component: Wheel,
});

const SEGMENTS = [0, 1.5, 0, 2, 0, 1.2, 5, 0, 1.5, 0, 2, 10];
const COLORS = ["#0a120b", "#00884a", "#0a120b", "#00ff88", "#0a120b", "#00884a", "#ffd700", "#0a120b", "#00884a", "#0a120b", "#00ff88", "#ff4444"];

function Wheel() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("wheel");
  const { data: cfg } = useGameConfig("wheel");
  const edge = cfg?.house_edge ?? 0;
  const [bet, setBet] = useState(50);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [msg, setMsg] = useState("");
  const [lastMult, setLastMult] = useState<number | null>(null);

  const spin = () => {
    if (spinning) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    const idx = Math.floor(Math.random() * SEGMENTS.length);
    const segAngle = 360 / SEGMENTS.length;
    const target = 360 * 6 + (360 - idx * segAngle - segAngle / 2);
    setSpinning(true); setMsg(""); setLastMult(null);
    setAngle(target);
    setTimeout(() => {
      const m = SEGMENTS[idx];
      setLastMult(m);
      const won = Math.floor(bet * m * (1 - edge));
      if (won > 0) credit(won);
      const pnl = won - bet;
      record({ pnl, multiplier: won / bet });
      setMsg(m > 0 ? `🎉 ${m}× · ${pnl >= 0 ? "+" : ""}${pnl}` : `💥 শূন্য · -${bet}`);
      setSpinning(false);
    }, 4200);
  };

  const seg = 360 / SEGMENTS.length;
  const gradient = SEGMENTS.map((_, i) => {
    const from = i * seg; const to = (i + 1) * seg;
    return `${COLORS[i]} ${from}deg ${to}deg`;
  }).join(", ");

  return (
    <GameShell title="Wheel of Fortune" emoji="🎡" gameKey="wheel">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className="relative mx-auto flex flex-1 items-center justify-center py-6">
          <div className="relative flex h-80 w-80 items-center justify-center">
            <div
              className="h-72 w-72 rounded-full ring-4 ring-[#00ff88]/50 shadow-[0_0_50px_rgba(0,255,136,0.35)]"
              style={{
                background: `conic-gradient(${gradient})`,
                transform: `rotate(${angle}deg)`,
                transition: spinning ? "transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none",
              }}
            />
            <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none" }}>
              {SEGMENTS.map((m, i) => {
                const a = i * seg + seg / 2;
                return (
                  <div key={i} className="absolute left-1/2 top-1/2 text-sm font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
                    style={{ transform: `rotate(${a}deg) translateY(-115px) rotate(90deg)` }}>
                    {m}×
                  </div>
                );
              })}
            </div>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-4xl text-[var(--neon-gold)] drop-shadow-[0_0_8px_var(--neon-gold)]">▼</div>
            <div className="absolute grid h-16 w-16 place-items-center rounded-full bg-[#050a06] text-2xl ring-4 ring-[var(--neon-gold)] shadow-[0_0_20px_rgba(255,215,0,0.5)]">🎰</div>
          </div>
        </div>
        <ControlsPanel>
          <MultDisplay
            label="শেষ স্পিন"
            value={lastMult !== null ? `${lastMult}×` : "—"}
            sub="সেগমেন্ট: 0× · 1.2× · 1.5× · 2× · 5× · 10×"
          />
          <BetControls bet={bet} setBet={setBet} disabled={spinning} />
          <PrimaryButton onClick={spin} disabled={spinning}>
            {spinning ? "স্পিনিং..." : `স্পিন · ${bet}`}
          </PrimaryButton>
          {msg && <div className="animate-fade-in text-center text-sm font-bold text-[var(--neon-gold)]">{msg}</div>}
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}
