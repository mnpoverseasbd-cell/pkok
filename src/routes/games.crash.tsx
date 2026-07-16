import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { GameShell, BetControls } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

export const Route = createFileRoute("/games/crash")({
  head: () => ({ meta: [{ title: "Crash — Asik Game" }, { name: "description", content: "Cash out before the crash." }] }),
  component: Crash,
});

// Generate crash point with house edge; distribution close to typical crash.
function nextCrash(): number {
  const r = Math.random();
  if (r < 0.03) return 1.0; // instant bust
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

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => () => stop(), []);

  const start = () => {
    if (state === "flying") return;
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    const target = nextCrash();
    targetRef.current = target;
    setCrashAt(null);
    setMsg("");
    setMult(1.0);
    setState("flying");
    startRef.current = performance.now();
    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      // exponential growth ~1.06^t
      const m = +Math.pow(1.06, t * 8).toFixed(2);
      if (m >= target) {
        setMult(target);
        setCrashAt(target);
        setState("crashed");
        setMsg(`💥 CRASHED @ ${target}× · -${bet}`);
        stop();
        return;
      }
      setMult(m);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cashout = () => {
    if (state !== "flying") return;
    stop();
    const won = Math.floor(bet * mult);
    credit(won);
    setState("cashed");
    setMsg(`🎉 Cashed @ ${mult}× · +${won}`);
    setCrashAt(targetRef.current);
  };

  const reset = () => { setState("idle"); setMsg(""); setMult(1.0); setCrashAt(null); };

  const color = state === "crashed" ? "text-red-400" : state === "cashed" ? "text-green-400" : "text-[var(--neon-gold)]";

  return (
    <GameShell title="Crash" emoji="🚀">
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-[1fr_320px]">
        <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-b from-indigo-950 to-black ring-1 ring-white/10">
          <div className={`text-7xl font-black tabular-nums ${color} ${state === "flying" ? "animate-pulse" : ""}`}>
            {mult.toFixed(2)}×
          </div>
          <div className="absolute bottom-2 left-3 text-xs text-white/50">
            {state === "flying" && "🚀 flying..."}
            {state === "crashed" && `busted at ${crashAt}×`}
            {state === "cashed" && `cashed out (would bust @ ${crashAt}×)`}
            {state === "idle" && "place your bet"}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <BetControls bet={bet} setBet={setBet} disabled={state === "flying"} />
          {state === "idle" || state === "crashed" || state === "cashed" ? (
            <button
              onClick={state === "idle" ? start : reset}
              className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg hover:brightness-110"
            >
              {state === "idle" ? `PLACE BET · ${bet}` : "PLAY AGAIN"}
            </button>
          ) : (
            <button
              onClick={cashout}
              className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 font-black text-white shadow-lg hover:brightness-110"
            >
              CASH OUT · {Math.floor(bet * mult)}
            </button>
          )}
          {msg && <div className={`text-center text-sm font-bold ${color} animate-fade-in`}>{msg}</div>}
        </div>
      </div>
    </GameShell>
  );
}
