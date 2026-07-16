import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/wheel")({
  head: () => ({ meta: [{ title: "Wheel of Fortune — Asik Game" }, { name: "description", content: "Spin the wheel." }] }),
  component: Wheel,
});

// 12 segments — mix of multipliers
const SEGMENTS = [0, 1.5, 0, 2, 0, 1.2, 5, 0, 1.5, 0, 2, 10];
const COLORS = ["#0f5a34", "#c81e5b", "#0f5a34", "#f1c40f", "#0f5a34", "#c81e5b", "#f1c40f", "#0f5a34", "#c81e5b", "#0f5a34", "#f1c40f", "#e74c3c"];

function Wheel() {
  const { bet: placeBet, credit } = useDemoWallet();
  const [bet, setBet] = useState(50);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [msg, setMsg] = useState("");

  const spin = () => {
    if (spinning) return;
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    const idx = Math.floor(Math.random() * SEGMENTS.length);
    const segAngle = 360 / SEGMENTS.length;
    const target = 360 * 6 + (360 - idx * segAngle - segAngle / 2);
    setSpinning(true);
    setMsg("");
    setAngle(target);
    setTimeout(() => {
      const m = SEGMENTS[idx];
      const won = Math.floor(bet * m);
      if (won > 0) credit(won);
      setMsg(m > 0 ? `🎉 ${m}× · +${won}` : `💥 Zero · -${bet}`);
      setSpinning(false);
    }, 4200);
  };

  const seg = 360 / SEGMENTS.length;
  const gradient = SEGMENTS.map((_, i) => {
    const from = i * seg;
    const to = (i + 1) * seg;
    return `${COLORS[i]} ${from}deg ${to}deg`;
  }).join(", ");

  return (
    <GameShell title="Wheel of Fortune" emoji="🎡">
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-[1fr_280px]">
        <div className="relative mx-auto flex h-80 w-80 items-center justify-center">
          <div
            className="h-72 w-72 rounded-full ring-4 ring-[var(--neon-gold)]/60 shadow-2xl"
            style={{
              background: `conic-gradient(${gradient})`,
              transform: `rotate(${angle}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none",
            }}
          />
          {/* labels */}
          <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none" }}>
            {SEGMENTS.map((m, i) => {
              const a = i * seg + seg / 2;
              return (
                <div key={i} className="absolute left-1/2 top-1/2 text-xs font-black text-white"
                  style={{ transform: `rotate(${a}deg) translateY(-110px) rotate(90deg)` }}>
                  {m}×
                </div>
              );
            })}
          </div>
          {/* pointer */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl">▼</div>
          {/* hub */}
          <div className="absolute grid h-14 w-14 place-items-center rounded-full bg-black text-xl ring-4 ring-[var(--neon-gold)]">🎰</div>
        </div>
        <div className="flex flex-col gap-3">
          <BetControls bet={bet} setBet={setBet} disabled={spinning} />
          <button
            onClick={spin} disabled={spinning}
            className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg hover:brightness-110 disabled:opacity-50"
          >
            {spinning ? "Spinning..." : `SPIN · Bet ${bet}`}
          </button>
          {msg && <div className="text-center text-sm font-bold text-[var(--neon-gold)] animate-fade-in">{msg}</div>}
          <div className="text-[10px] text-white/50">
            Segments: 0×, 1.2×, 1.5×, 2×, 5×, 10×
          </div>
        </div>
      </div>
    </GameShell>
  );
}
