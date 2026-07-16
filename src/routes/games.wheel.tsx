import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairWheel } from "@/lib/provablyFair";
import { isMuted, toggleMuted, sfxTick, sfxSpin, sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/wheel")({
  head: () => ({ meta: [{ title: "Wheel of Fortune — Asik Game" }, { name: "description", content: "Spin the wheel." }] }),
  component: Wheel,
});

const SEGMENTS = [0, 1.5, 0, 2, 0, 1.2, 5, 0, 1.5, 0, 2, 10];
const COLORS = ["#0a120b", "#00884a", "#0a120b", "#00ff88", "#0a120b", "#00884a", "#ffd700", "#0a120b", "#00884a", "#0a120b", "#00ff88", "#ff4444"];
const SPIN_MS = 4600;

// easeOutQuint — sharp start, gentle finish (feels heavy at the end)
const easeOut = (t: number) => 1 - Math.pow(1 - t, 5);

function Wheel() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("wheel");
  const { data: cfg } = useGameConfig("wheel");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("wheel");
  const [bet, setBet] = useState(50);
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [msg, setMsg] = useState("");
  const [lastMult, setLastMult] = useState<number | null>(null);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [muted, setMutedState] = useState(isMuted());
  const [pointerKick, setPointerKick] = useState(0);
  const [winFlash, setWinFlash] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const animateSpin = useCallback((from: number, to: number, dur: number) => new Promise<void>((resolve) => {
    const segAngle = 360 / SEGMENTS.length;
    const start = performance.now();
    let lastSegPassed = Math.floor(from / segAngle);
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = easeOut(t);
      const cur = from + (to - from) * eased;
      setAngle(cur);
      const segIdx = Math.floor(cur / segAngle);
      if (segIdx !== lastSegPassed) {
        const passes = segIdx - lastSegPassed;
        for (let i = 0; i < passes; i++) sfxTick();
        setPointerKick((k) => k + 1);
        lastSegPassed = segIdx;
      }
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else resolve();
    };
    rafRef.current = requestAnimationFrame(step);
  }), []);

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    const idx = await fairWheel(pf.serverSeed, pf.clientSeed, pf.nonce, SEGMENTS.length);
    const segAngle = 360 / SEGMENTS.length;
    setSpinning(true); setMsg(""); setLastMult(null); setWinFlash(false);
    sfxSpin();
    const from = angle;
    const base = from - (from % 360);
    const to = base + 360 * 6 + (360 - idx * segAngle - segAngle / 2);
    await animateSpin(from, to, SPIN_MS);
    const m = SEGMENTS[idx];
    setLastMult(m);
    const won = Math.floor(roundBet * m * (1 - edge));
    if (won > 0) credit(won);
    const pnl = won - roundBet;
    record({ pnl, multiplier: won / roundBet });
    if (m > 0) { sfxWin(m); setWinFlash(true); } else { sfxBust(); }
    setMsg(m > 0 ? `🎉 ${m}× · ${pnl >= 0 ? "+" : ""}${pnl}` : `💥 শূন্য · -${roundBet}`);
    pf.consume(`segment=${idx} mult=${m}×`);
    recordMyBet({ game: "wheel", bet: roundBet, multiplier: m, payout: won });
    setSpinning(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, record, angle, animateSpin]);

  const auto = useAutoBet({ runRound, baseBet: bet, delayMs: 500 });

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
          <button
            onClick={() => setMutedState(toggleMuted())}
            className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <div className="relative flex h-80 w-80 items-center justify-center">
            <div
              className={`h-72 w-72 rounded-full ring-4 ring-[#00ff88]/50 ${winFlash ? "shadow-[0_0_80px_rgba(255,215,0,0.9)]" : "shadow-[0_0_50px_rgba(0,255,136,0.35)]"}`}
              style={{ background: `conic-gradient(${gradient})`, transform: `rotate(${angle}deg)` }}
            />
            {/* Peg dots around the rim to feel like a real wheel */}
            <div className="pointer-events-none absolute inset-0" style={{ transform: `rotate(${angle}deg)` }}>
              {SEGMENTS.map((_, i) => {
                const a = i * seg;
                return (
                  <div key={`peg-${i}`} className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_4px_rgba(255,255,255,0.9)]"
                    style={{ transform: `rotate(${a}deg) translateY(-141px)` }} />
                );
              })}
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
            {/* Pointer with bounce keyed to pointerKick */}
            <div
              key={pointerKick}
              className="absolute -top-3 left-1/2 -translate-x-1/2 text-4xl text-[var(--neon-gold)] drop-shadow-[0_0_8px_var(--neon-gold)]"
              style={{ animation: "pointer-tick 90ms ease-out" }}
            >▼</div>
            <div className="absolute grid h-16 w-16 place-items-center rounded-full bg-[#050a06] text-2xl ring-4 ring-[var(--neon-gold)] shadow-[0_0_20px_rgba(255,215,0,0.5)]">🎰</div>
          </div>
          <style>{`@keyframes pointer-tick { 0% { transform: translate(-50%, 0) rotate(0); } 40% { transform: translate(-50%, 2px) rotate(-8deg); } 100% { transform: translate(-50%, 0) rotate(0); } }`}</style>
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={spinning || auto.running} />
          <MultDisplay
            label="শেষ স্পিন"
            value={lastMult !== null ? `${lastMult}×` : "—"}
            sub="সেগমেন্ট: 0× · 1.2× · 1.5× · 2× · 5× · 10×"
          />
          <BetControls bet={bet} setBet={setBet} disabled={spinning || auto.running} />
          {mode === "manual" ? (
            <PrimaryButton onClick={() => runRound(bet)} disabled={spinning}>
              {spinning ? "স্পিনিং..." : `স্পিন · ${bet}`}
            </PrimaryButton>
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready} />
          )}
          {msg && <div className="animate-fade-in text-center text-sm font-bold text-[var(--neon-gold)]">{msg}</div>}
          <ProvablyFairPanel pf={pf} gameKey="wheel" />
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}

