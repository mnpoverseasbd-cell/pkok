import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/crash")({
  head: () => ({ meta: [{ title: "Crash — Asik Game" }, { name: "description", content: "Cash out before the crash." }] }),
  component: Crash,
});

function nextCrash(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0;
  const e = 1 - r;
  return Math.max(1.0, +(0.99 / e).toFixed(2));
}

function Crash() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("crash");
  const [bet, setBet] = useState(50);
  const [state, setState] = useState<"idle" | "flying" | "crashed" | "cashed">("idle");
  const [mult, setMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const targetRef = useRef(0);

  const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  useEffect(() => () => stop(), []);

  const start = () => {
    if (state === "flying") return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    const target = nextCrash(); targetRef.current = target;
    setCrashAt(null); setMsg(""); setMult(1.0); setState("flying");
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const m = +Math.pow(1.06, t * 8).toFixed(2);
      if (m >= target) {
        setMult(target); setCrashAt(target); setState("crashed");
        setMsg(`💥 ক্র্যাশ @ ${target}× · -${bet}`);
        record({ pnl: -bet, multiplier: 0 });
        stop(); return;
      }
      setMult(m); rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cashout = () => {
    if (state !== "flying") return;
    stop();
    const won = Math.floor(bet * mult); credit(won);
    setState("cashed");
    setMsg(`🎉 ক্যাশআউট @ ${mult}× · +${won - bet}`);
    setCrashAt(targetRef.current);
    record({ pnl: won - bet, multiplier: mult });
  };

  const reset = () => { setState("idle"); setMsg(""); setMult(1.0); setCrashAt(null); };

  const isFlying = state === "flying";
  const color = state === "crashed" ? "text-[#ff4444]" : state === "cashed" ? "text-[#00ff88]" : isFlying ? "text-[#00ff88]" : "text-white";
  const glow = state === "crashed" ? "shadow-[0_0_40px_rgba(255,68,68,0.4)]" : isFlying || state === "cashed" ? "shadow-[0_0_50px_rgba(0,255,136,0.4)]" : "";

  return (
    <GameShell title="Crash" emoji="🚀">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#1a3321] bg-gradient-to-b from-[#0a120b] to-[#050a06] p-8 min-h-[280px] ${glow}`}>
          <div className={`text-8xl font-black tabular-nums drop-shadow-[0_0_20px_currentColor] ${color} ${isFlying ? "animate-pulse" : ""}`}>
            {mult.toFixed(2)}×
          </div>
          <div className="absolute bottom-3 left-4 text-xs font-bold uppercase tracking-widest text-white/50">
            {isFlying && "🚀 উড়ছে..."}
            {state === "crashed" && `বাস্ট @ ${crashAt}×`}
            {state === "cashed" && `ক্যাশ আউট (বাস্ট ছিল @ ${crashAt}×)`}
            {state === "idle" && "বাজি রাখুন"}
          </div>
        </div>
        <ControlsPanel>
          <MultDisplay
            label="বর্তমান"
            value={`${mult.toFixed(2)}×`}
            sub={isFlying ? <>ক্যাশআউট মূল্য: <span className="text-[#00ff88]">{Math.floor(bet * mult)}</span></> : "উড়ানোর জন্য বাজি রাখুন"}
          />
          <BetControls bet={bet} setBet={setBet} disabled={isFlying} />
          {isFlying ? (
            <PrimaryButton onClick={cashout} tone="gold">
              ক্যাশআউট · {Math.floor(bet * mult)}
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={state === "idle" ? start : reset}>
              {state === "idle" ? `বাজি রাখুন · ${bet}` : "আবার খেলুন"}
            </PrimaryButton>
          )}
          {msg && <div className={`animate-fade-in text-center text-sm font-bold ${color}`}>{msg}</div>}
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}
