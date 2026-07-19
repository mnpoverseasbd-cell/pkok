import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { fairSevenUpDown } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/seven-up-down")({
  head: () => ({
    meta: [
      { title: "7 Up 7 Down — Asik Game" },
      { name: "description", content: "দুই ডাইসের যোগফল ৭-এর উপরে না নিচে? সঠিক অনুমানে জিতুন — Lucky 7 হিট করলে 5×।" },
      { property: "og:title", content: "7 Up 7 Down — Asik Game" },
      { property: "og:description", content: "সবচেয়ে সহজ ও দ্রুত দুই-ডাইস গেম — Up/Down 1.95× ও Lucky Seven 5× পেআউট।" },
    ],
  }),
  component: SevenUpDown,
});

type Pick = "UP" | "DOWN" | "SEVEN";
type Phase = "idle" | "rolling" | "done";

const PAYOUT_UD = 1.95;
const PAYOUT_SEVEN = 5;

// SVG dice pips
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]],
};

function Die({ value, rolling }: { value: number | null; rolling: boolean }) {
  const shown = value ?? Math.floor(Math.random() * 6) + 1;
  const pips = PIPS[shown];
  return (
    <div
      className={`relative h-24 w-24 rounded-2xl bg-gradient-to-br from-white via-[#f2f2f2] to-[#d8d8d8] shadow-[0_10px_25px_rgba(0,0,0,0.55),inset_0_2px_0_rgba(255,255,255,0.9)] border border-black/20 ${
        rolling ? "animate-[spin_0.6s_linear_infinite]" : "animate-fade-in"
      }`}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {pips.map(([x, y], i) => (
          <circle key={i} cx={x * 100} cy={y * 100} r={9} fill="#0a0a0a" />
        ))}
      </svg>
    </div>
  );
}

function SevenUpDown() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("seven-up-down");
  const { data: cfg } = useGameConfig("seven-up-down");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("seven-up-down");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Pick>("UP");
  const [phase, setPhase] = useState<Phase>("idle");
  const [d1, setD1] = useState<number | null>(null);
  const [d2, setD2] = useState<number | null>(null);
  const [result, setResult] = useState<Pick | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const runRound = useCallback(async () => {
    if (phase === "rolling") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setD1(null); setD2(null); setResult(null); setMsg("");
    setPhase("rolling");

    // Shake dice for a bit
    await new Promise((r) => setTimeout(r, 900));

    const r = await fairSevenUpDown(pf.serverSeed, pf.clientSeed, pf.nonce);

    setD1(r.d1);
    try { sfxPeg(0.5); } catch { /* noop */ }
    await new Promise((res) => setTimeout(res, 280));
    setD2(r.d2);
    try { sfxPeg(0.5); } catch { /* noop */ }
    await new Promise((res) => setTimeout(res, 250));

    setResult(r.result);
    const mult = r.result === "SEVEN" ? PAYOUT_SEVEN : PAYOUT_UD;
    let pnl: number;
    let won = 0;
    let winMult = 0;

    if (r.result === pick) {
      won = Math.floor(bet * mult * (1 - edge));
      credit(won);
      pnl = won - bet;
      winMult = won / bet;
      const label = pick === "SEVEN" ? "Lucky 7" : pick === "UP" ? "Up (>7)" : "Down (<7)";
      setMsg(`🎉 জয় · Sum ${r.sum} · ${label} · +${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({ count: r.result === "SEVEN" ? 130 : 70, kind: "confetti", speed: 8 });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      const wLabel = r.result === "SEVEN" ? "Lucky 7" : r.result === "UP" ? "Up" : "Down";
      setMsg(`💥 হার · Sum ${r.sum} · ${wLabel} এসেছে`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`7ud d1=${r.d1} d2=${r.d2} sum=${r.sum} result=${r.result}`);
    recordMyBet({ game: "seven-up-down", bet, multiplier: winMult, payout: won });
    pushMultiplierHistory("seven-up-down", winMult);
    setPhase("done");
  }, [phase, pf, placeBet, credit, edge, bet, pick, record]);

  const reset = () => { setD1(null); setD2(null); setResult(null); setMsg(""); setPhase("idle"); };
  const busy = phase === "rolling";

  const won = result && result === pick;
  const lost = result && result !== pick;
  const glow =
    won ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
      lost ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
        "border-[#1a3a2a]";

  const potential = pick === "SEVEN"
    ? Math.floor(bet * PAYOUT_SEVEN)
    : Math.floor(bet * PAYOUT_UD);

  const sum = d1 !== null && d2 !== null ? d1 + d2 : null;

  return (
    <GameShell title="7 Up 7 Down" emoji="🎲" gameKey="seven-up-down">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b1f18] via-[#050d0a] to-[#020404] p-4 min-h-[420px] transition-shadow duration-500 ${glow}`}>
          {/* felt */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.10),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          {/* Sum meter */}
          <div className="relative z-10 mx-auto mb-4 flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
            <span className={pick === "DOWN" ? "text-[#ff6b9d]" : "text-white/40"}>▼ DOWN (2–6)</span>
            <span className={pick === "SEVEN" ? "text-[#ffd166]" : "text-white/40"}>★ SEVEN</span>
            <span className={pick === "UP" ? "text-[#00ff88]" : "text-white/40"}>UP (8–12) ▲</span>
          </div>

          {/* Dice arena */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-8">
              <Die value={d1} rolling={busy && d1 === null} />
              <div className="text-3xl font-black text-white/40">+</div>
              <Die value={d2} rolling={busy && d2 === null} />
            </div>

            {sum !== null && (
              <div className="flex flex-col items-center gap-1 animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">যোগফল</div>
                <div
                  className={`text-5xl font-black tabular-nums drop-shadow-[0_0_18px_rgba(0,255,136,0.5)] ${
                    result === "SEVEN" ? "text-[#ffd166]" : result === "UP" ? "text-[#00ff88]" : "text-[#ff6b9d]"
                  }`}
                >
                  {sum}
                </div>
              </div>
            )}
          </div>

          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              won ? "text-[#00ff88]" : lost ? "text-[#ff4d4d]" : "text-[#ffd166]"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">সম্ভাব্য জয়</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {potential.toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">@ {pick === "SEVEN" ? PAYOUT_SEVEN : PAYOUT_UD}×</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">কোন দিকে বাজি?</label>
            <div className="grid grid-cols-3 gap-2">
              <PickBtn active={pick === "DOWN"} disabled={busy} onClick={() => setPick("DOWN")}
                label="DOWN" sub="২–৬" tone="#ff6b9d" mult={PAYOUT_UD} />
              <PickBtn active={pick === "SEVEN"} disabled={busy} onClick={() => setPick("SEVEN")}
                label="LUCKY 7" sub="ঠিক ৭" tone="#ffd166" mult={PAYOUT_SEVEN} />
              <PickBtn active={pick === "UP"} disabled={busy} onClick={() => setPick("UP")}
                label="UP" sub="৮–১২" tone="#00ff88" mult={PAYOUT_UD} />
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={busy} />

          {phase === "done" ? (
            <PrimaryButton onClick={reset}>আবার খেলুন</PrimaryButton>
          ) : (
            <PrimaryButton onClick={runRound} disabled={busy}>
              {busy ? "রোল হচ্ছে..." : `রোল করুন · ${bet}`}
            </PrimaryButton>
          )}

          <ProvablyFairPanel pf={pf} gameKey="seven-up-down" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="seven-up-down" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

function PickBtn({
  active, disabled, onClick, label, sub, tone, mult,
}: {
  active: boolean; disabled: boolean; onClick: () => void;
  label: string; sub: string; tone: string; mult: number;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={active ? { borderColor: tone, boxShadow: `0 0 15px ${tone}66`, background: `${tone}18`, color: tone } : undefined}
      className={`rounded-lg border-2 px-3 py-3 font-black transition-all active:scale-95 ${
        active ? "" : "border-[#1a3a2a] bg-[#0c1a14] text-white/70 hover:border-[#2a5a3a]"
      }`}
    >
      <div className="text-sm leading-tight">{label}</div>
      <div className="text-[10px] font-bold opacity-70 leading-tight">{sub}</div>
      <div className="mt-1 text-[10px] tabular-nums opacity-80">{mult}×</div>
    </button>
  );
}
