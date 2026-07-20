import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Plane, Trophy } from "lucide-react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { fairAviatrix, AVIATRIX_PLANES } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxCashout, sfxPeg } from "@/lib/sound";

export const Route = createFileRoute("/games/aviatrix")({
  head: () => ({
    meta: [
      { title: "Aviatrix Multi-Race — Asik Game" },
      { name: "description", content: "৩টি প্লেন রেস · সবচেয়ে উঁচু গেলে জেতে · পিক করুন সঠিক প্লেন।" },
    ],
  }),
  component: Aviatrix,
});

const PLANE_COLORS = [
  { tail: "#ff4d4d", glow: "rgba(255,77,77,0.55)", label: "লাল" },
  { tail: "#00ff88", glow: "rgba(0,255,136,0.55)", label: "সবুজ" },
  { tail: "#ffd166", glow: "rgba(255,209,102,0.55)", label: "সোনালি" },
];

type Phase = "idle" | "racing" | "done";

function Aviatrix() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("aviatrix");
  const { data: cfg } = useGameConfig("aviatrix");
  const edge = cfg?.house_edge ?? 0.01;
  const pf = useProvablyFair("aviatrix");

  const [amount, setAmount] = useState(50);
  const [pick, setPick] = useState<number>(1);
  const [phase, setPhase] = useState<Phase>("idle");
  const [multipliers, setMultipliers] = useState<number[]>([1, 1, 1]);
  const [targets, setTargets] = useState<number[]>([1, 1, 1]);
  const [winner, setWinner] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [outcome, setOutcome] = useState<"idle" | "win" | "lose">("idle");
  const fxRef = useRef<ParticleBurstHandle>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const runRound = useCallback(async () => {
    if (!pf.ready || phase === "racing") return;
    if (!placeBet(amount)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setPhase("racing"); setMsg(""); setOutcome("idle"); setWinner(null);
    setMultipliers([1, 1, 1]);

    const r = await fairAviatrix(pf.serverSeed, pf.clientSeed, pf.nonce, edge);
    setTargets(r.multipliers);

    // Animate each plane climbing from 1× → its target multiplier at its own pace.
    const start = performance.now();
    // Different total flight time per plane, biased so the winner tends to finish last (dramatic).
    const durations = r.multipliers.map((m) => 1600 + Math.min(4200, Math.log(Math.max(1.01, m)) * 900));

    const tick = (now: number) => {
      const elapsed = now - start;
      const next = r.multipliers.map((m, i) => {
        const t = Math.min(1, elapsed / durations[i]);
        // Exponential-ish climb
        const eased = Math.pow(t, 1.35);
        return +Math.max(1, 1 + (m - 1) * eased).toFixed(2);
      });
      setMultipliers(next);

      if (elapsed < Math.max(...durations)) {
        if (Math.floor(elapsed / 220) !== Math.floor((elapsed - 16) / 220)) {
          try { sfxPeg(0.12); } catch { /* noop */ }
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // Finalize
      setMultipliers(r.multipliers);
      setWinner(r.winner);
      const won = r.winner === pick;
      const winMult = r.multipliers[r.winner];
      let payout = 0, pnl = -amount, mult = 0;
      if (won) {
        payout = Math.floor(amount * winMult * (1 - edge));
        credit(payout);
        pnl = payout - amount;
        mult = payout / amount;
        setMsg(`🏆 জয় +${pnl} · Plane ${r.winner + 1} @ ${winMult.toFixed(2)}×`);
        setOutcome("win");
        fxRef.current?.burst({ count: 80, kind: "confetti", speed: 9 });
        try { sfxWin(mult); sfxCashout(); } catch { /* noop */ }
      } else {
        setMsg(`💥 হার · Plane ${r.winner + 1} জিতেছে @ ${winMult.toFixed(2)}×`);
        setOutcome("lose");
        fxRef.current?.burst({ count: 40, kind: "smoke", color: PLANE_COLORS[r.winner].tail, speed: 5 });
        try { sfxBust(); } catch { /* noop */ }
      }
      pf.consume(`aviatrix pick=${pick + 1} winner=${r.winner + 1} @${winMult}×`);
      record({ pnl, multiplier: mult });
      recordMyBet({ game: "aviatrix", bet: amount, multiplier: mult, payout });
      pushMultiplierHistory("aviatrix", winMult);
      setPhase("done");
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [pf, phase, placeBet, amount, edge, pick, credit, record]);

  // Position per plane (0..100 % across the runway based on climb progress toward its target)
  const progress = (i: number) => {
    const m = multipliers[i];
    const t = targets[i];
    if (t <= 1) return 0;
    const p = (m - 1) / (t - 1);
    return Math.max(0, Math.min(1, p));
  };

  const glow =
    outcome === "win" ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
    outcome === "lose" ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.45)] border-[#3a1414]" :
    "border-[#1a3321]";

  return (
    <GameShell title="Aviatrix · Multi-Race" emoji="✈️" gameKey="aviatrix">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#02040a] via-[#04091a] to-[#020509] p-4 min-h-[380px] transition-shadow duration-500 ${glow}`}>
          {/* Starfield */}
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(1px 1px at 12% 20%, rgba(255,255,255,0.7), transparent 60%)," +
                "radial-gradient(1.5px 1.5px at 70% 45%, rgba(255,255,255,0.5), transparent 60%)," +
                "radial-gradient(1px 1px at 40% 80%, rgba(255,255,255,0.6), transparent 60%)," +
                "radial-gradient(1px 1px at 85% 15%, rgba(255,255,255,0.4), transparent 60%)," +
                "radial-gradient(2px 2px at 25% 60%, rgba(180,220,255,0.35), transparent 60%)",
            }}
          />
          <div className="relative z-10 mb-3 flex items-center justify-between">
            <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60">
              তিনটি প্লেন — সবচেয়ে উঁচু যায় সেটাই জেতে
            </div>
            {winner !== null && (
              <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-xs font-black text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/40">
                <Trophy className="h-3.5 w-3.5" />
                Plane {winner + 1} @ {targets[winner].toFixed(2)}×
              </div>
            )}
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center gap-3">
            {[0, 1, 2].map((i) => {
              const p = progress(i);
              const c = PLANE_COLORS[i];
              const isPick = pick === i;
              const isWinner = winner === i;
              const isFinalLoser = phase === "done" && !isWinner;
              return (
                <div key={i} className={`relative h-20 overflow-hidden rounded-xl border bg-black/45 backdrop-blur transition-all ${
                  isWinner ? "border-[var(--neon-gold)] shadow-[0_0_25px_-6px_rgba(255,215,0,0.55)]" :
                  isPick ? "border-[#00ff88]/50" : "border-white/10"
                } ${isFinalLoser ? "opacity-50" : ""}`}>
                  {/* Runway grid */}
                  <div aria-hidden className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: "linear-gradient(90deg, transparent 0 39px, rgba(255,255,255,0.15) 39px 40px)" }} />
                  {/* Label */}
                  <div className="absolute left-2 top-1.5 z-[3] flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/80">
                    <span className="grid h-5 w-5 place-items-center rounded-full text-[10px] font-black text-black"
                      style={{ backgroundColor: c.tail }}>{i + 1}</span>
                    {c.label}
                    {isPick && <span className="rounded-full bg-[#00ff88]/20 px-1.5 py-0.5 text-[9px] text-[#00ff88]">আপনার পিক</span>}
                  </div>
                  {/* Multiplier readout */}
                  <div className={`absolute right-3 top-1/2 z-[3] -translate-y-1/2 text-2xl font-black tabular-nums drop-shadow ${
                    isWinner ? "text-[var(--neon-gold)]" :
                    isFinalLoser ? "text-white/40" : "text-white"
                  }`}>
                    {multipliers[i].toFixed(2)}×
                  </div>
                  {/* Trail */}
                  <div className="absolute bottom-2 left-2 right-14 h-1 rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-[width] duration-100 ease-linear"
                      style={{ width: `${p * 100}%`, background: `linear-gradient(90deg, transparent, ${c.tail})` }}
                    />
                  </div>
                  {/* Plane */}
                  <div
                    className="absolute top-1/2 z-[2] -translate-y-1/2 transition-[left] duration-100 ease-linear"
                    style={{ left: `calc(${p * 100}% * 0.82 + 4%)` }}
                  >
                    <Plane
                      className="h-8 w-8 -rotate-[20deg]"
                      style={{ color: c.tail, filter: `drop-shadow(0 0 12px ${c.glow})` }}
                      fill="currentColor"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {msg && (
            <div className={`relative z-10 mt-3 text-center text-lg font-black ${
              outcome === "win" ? "text-[#00ff88]" : outcome === "lose" ? "text-[#ff4d4d]" : "text-white/80"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">প্লেন পিক করুন</label>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: AVIATRIX_PLANES }).map((_, i) => {
                const c = PLANE_COLORS[i];
                const active = pick === i;
                return (
                  <button
                    key={i}
                    disabled={phase === "racing"}
                    onClick={() => setPick(i)}
                    className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 font-black transition-all active:scale-95 disabled:opacity-50 ${
                      active
                        ? "border-[#00ff88] bg-[#00ff88]/10 text-white shadow-[0_0_15px_rgba(0,255,136,0.4)]"
                        : "border-[#1a3321] bg-[#0a120b] text-white/70 hover:border-[#254a30]"
                    }`}
                  >
                    <Plane
                      className="h-6 w-6 -rotate-[20deg]"
                      style={{ color: c.tail, filter: `drop-shadow(0 0 8px ${c.glow})` }}
                      fill="currentColor"
                    />
                    <span className="text-[11px]">Plane {i + 1}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">{c.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              জিতলে পেআউট = বেট × winner-multiplier × (১ − হাউস এজ)
            </div>
          </div>

          <BetControls bet={amount} setBet={setAmount} disabled={phase === "racing"} />

          <PrimaryButton onClick={runRound} disabled={phase === "racing" || !pf.ready}>
            {phase === "racing" ? "রেস চলছে…" : `রেস শুরু · ${amount}`}
          </PrimaryButton>

          <ProvablyFairPanel pf={pf} gameKey="aviatrix" />
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="aviatrix" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
