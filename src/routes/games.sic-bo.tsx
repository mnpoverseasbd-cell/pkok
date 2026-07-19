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
import { fairSicBo } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/sic-bo")({
  head: () => ({
    meta: [
      { title: "Sic Bo — Asik Game" },
      { name: "description", content: "তিন ডাইসের প্রাচীন চাইনিজ ক্যাসিনো গেম — Small/Big, Odd/Even ও Triple বেটে জিতুন 150× পর্যন্ত।" },
      { property: "og:title", content: "Sic Bo — Asik Game" },
      { property: "og:description", content: "Provably-fair 3-dice ক্যাসিনো ক্লাসিক — Any Triple 8×, Specific Triple 150×।" },
    ],
  }),
  component: SicBo,
});

type Pick =
  | { kind: "SIZE"; v: "SMALL" | "BIG" }
  | { kind: "PARITY"; v: "ODD" | "EVEN" }
  | { kind: "ANY_TRIPLE" }
  | { kind: "TRIPLE"; face: number };

type Phase = "idle" | "rolling" | "done";

const PAYOUT_EVEN = 1.95;       // Small/Big/Odd/Even (loses on triple)
const PAYOUT_ANY_TRIPLE = 8;    // Any three-of-a-kind
const PAYOUT_SPECIFIC = 150;    // Specific triple 1..6

const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.5], [0.75, 0.5], [0.25, 0.75], [0.75, 0.75]],
};

function Die({ value, rolling, highlight }: { value: number | null; rolling: boolean; highlight?: boolean }) {
  const shown = value ?? Math.floor(Math.random() * 6) + 1;
  const pips = PIPS[shown];
  return (
    <div
      className={`relative h-20 w-20 rounded-2xl bg-gradient-to-br from-white via-[#f2f2f2] to-[#d8d8d8] border border-black/20 ${
        rolling ? "animate-[spin_0.55s_linear_infinite]" : "animate-fade-in"
      }`}
      style={{
        boxShadow: highlight
          ? "0 0 30px rgba(255,209,102,0.75), inset 0 2px 0 rgba(255,255,255,0.9), 0 10px 25px rgba(0,0,0,0.55)"
          : "0 10px 25px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.9)",
      }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {pips.map(([x, y], i) => (
          <circle key={i} cx={x * 100} cy={y * 100} r={9} fill="#0a0a0a" />
        ))}
      </svg>
    </div>
  );
}

function pickEq(a: Pick, b: Pick): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "SIZE" && b.kind === "SIZE") return a.v === b.v;
  if (a.kind === "PARITY" && b.kind === "PARITY") return a.v === b.v;
  if (a.kind === "TRIPLE" && b.kind === "TRIPLE") return a.face === b.face;
  return a.kind === b.kind; // ANY_TRIPLE
}

function pickLabel(p: Pick): string {
  switch (p.kind) {
    case "SIZE": return p.v === "SMALL" ? "Small (4-10)" : "Big (11-17)";
    case "PARITY": return p.v === "ODD" ? "Odd" : "Even";
    case "ANY_TRIPLE": return "Any Triple";
    case "TRIPLE": return `Triple ${p.face}`;
  }
}

function pickMult(p: Pick): number {
  switch (p.kind) {
    case "SIZE":
    case "PARITY": return PAYOUT_EVEN;
    case "ANY_TRIPLE": return PAYOUT_ANY_TRIPLE;
    case "TRIPLE": return PAYOUT_SPECIFIC;
  }
}

function picksWinning(r: {
  isTriple: boolean; tripleFace: number | null;
  size: "SMALL" | "BIG" | null; parity: "ODD" | "EVEN" | null;
}, p: Pick): boolean {
  switch (p.kind) {
    case "SIZE": return !r.isTriple && r.size === p.v;
    case "PARITY": return !r.isTriple && r.parity === p.v;
    case "ANY_TRIPLE": return r.isTriple;
    case "TRIPLE": return r.isTriple && r.tripleFace === p.face;
  }
}

function SicBo() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("sic-bo");
  const { data: cfg } = useGameConfig("sic-bo");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("sic-bo");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Pick>({ kind: "SIZE", v: "SMALL" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [d1, setD1] = useState<number | null>(null);
  const [d2, setD2] = useState<number | null>(null);
  const [d3, setD3] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const runRound = useCallback(async () => {
    if (phase === "rolling") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setD1(null); setD2(null); setD3(null); setWon(null); setMsg("");
    setPhase("rolling");

    await new Promise((r) => setTimeout(r, 900));
    const r = await fairSicBo(pf.serverSeed, pf.clientSeed, pf.nonce);

    setD1(r.d1); try { sfxPeg(0.5); } catch { /* noop */ }
    await new Promise((res) => setTimeout(res, 260));
    setD2(r.d2); try { sfxPeg(0.5); } catch { /* noop */ }
    await new Promise((res) => setTimeout(res, 260));
    setD3(r.d3); try { sfxPeg(0.5); } catch { /* noop */ }
    await new Promise((res) => setTimeout(res, 240));

    const wins = picksWinning(r, pick);
    const mult = pickMult(pick);
    const label = r.isTriple ? `Triple ${r.tripleFace}` : `${r.size} · ${r.parity} · Sum ${r.sum}`;
    let pnl: number;
    let winMult = 0;
    let paid = 0;

    if (wins) {
      paid = Math.floor(bet * mult * (1 - edge));
      credit(paid);
      pnl = paid - bet;
      winMult = paid / bet;
      setWon(true);
      setMsg(`🎉 জয় · ${label} · +${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({
        count: pick.kind === "TRIPLE" ? 180 : pick.kind === "ANY_TRIPLE" ? 130 : 70,
        kind: "confetti",
        speed: 8,
      });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      setWon(false);
      setMsg(`💥 হার · ${label}`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`sicbo d=[${r.d1},${r.d2},${r.d3}] sum=${r.sum} triple=${r.isTriple}`);
    recordMyBet({ game: "sic-bo", bet, multiplier: winMult, payout: paid });
    pushMultiplierHistory("sic-bo", winMult);
    setPhase("done");
  }, [phase, pf, placeBet, credit, edge, bet, pick, record]);

  const reset = () => { setD1(null); setD2(null); setD3(null); setWon(null); setMsg(""); setPhase("idle"); };
  const busy = phase === "rolling";
  const glow =
    won === true ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
      won === false ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
        "border-[#1a3a2a]";

  const sum = d1 !== null && d2 !== null && d3 !== null ? d1 + d2 + d3 : null;
  const isTriple = d1 !== null && d1 === d2 && d2 === d3;
  const potential = Math.floor(bet * pickMult(pick));

  return (
    <GameShell title="Sic Bo" emoji="🎲" gameKey="sic-bo">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#1a0b1f] via-[#0a0510] to-[#020204] p-4 min-h-[420px] transition-shadow duration-500 ${glow}`}>
          {/* felt */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,80,180,0.10),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          {/* Header chips */}
          <div className="relative z-10 mx-auto mb-4 flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
            <span className="text-[#ff6b9d]">SMALL 4-10</span>
            <span className="text-[#ffd166]">TRIPLES {PAYOUT_SPECIFIC}×</span>
            <span className="text-[#00ff88]">BIG 11-17</span>
          </div>

          {/* Dice bowl */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
            <div className="relative flex items-center gap-5 rounded-full border border-white/10 bg-black/40 px-8 py-6">
              <Die value={d1} rolling={busy && d1 === null} highlight={isTriple} />
              <Die value={d2} rolling={busy && d2 === null} highlight={isTriple} />
              <Die value={d3} rolling={busy && d3 === null} highlight={isTriple} />
            </div>

            {sum !== null && (
              <div className="flex flex-col items-center gap-1 animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                  {isTriple ? "TRIPLE!" : "যোগফল"}
                </div>
                <div
                  className={`text-5xl font-black tabular-nums ${
                    isTriple ? "text-[#ffd166] drop-shadow-[0_0_20px_rgba(255,209,102,0.7)]"
                      : sum >= 11 ? "text-[#00ff88] drop-shadow-[0_0_18px_rgba(0,255,136,0.5)]"
                      : "text-[#ff6b9d] drop-shadow-[0_0_18px_rgba(255,107,157,0.5)]"
                  }`}
                >
                  {sum}
                </div>
              </div>
            )}
          </div>

          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              won === true ? "text-[#00ff88]" : won === false ? "text-[#ff4d4d]" : "text-[#ffd166]"
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
              <span className="text-xs font-bold text-white/40 tabular-nums">
                @ {pickMult(pick)}× · {pickLabel(pick)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">বেট বেছে নিন</label>

            {/* Size + Parity row */}
            <div className="grid grid-cols-2 gap-2">
              <BetBtn active={pickEq(pick, { kind: "SIZE", v: "SMALL" })} disabled={busy}
                onClick={() => setPick({ kind: "SIZE", v: "SMALL" })}
                label="SMALL" sub="৪–১০" tone="#ff6b9d" mult={PAYOUT_EVEN} />
              <BetBtn active={pickEq(pick, { kind: "SIZE", v: "BIG" })} disabled={busy}
                onClick={() => setPick({ kind: "SIZE", v: "BIG" })}
                label="BIG" sub="১১–১৭" tone="#00ff88" mult={PAYOUT_EVEN} />
              <BetBtn active={pickEq(pick, { kind: "PARITY", v: "ODD" })} disabled={busy}
                onClick={() => setPick({ kind: "PARITY", v: "ODD" })}
                label="ODD" sub="বিজোড়" tone="#7ee7ff" mult={PAYOUT_EVEN} />
              <BetBtn active={pickEq(pick, { kind: "PARITY", v: "EVEN" })} disabled={busy}
                onClick={() => setPick({ kind: "PARITY", v: "EVEN" })}
                label="EVEN" sub="জোড়" tone="#b47bff" mult={PAYOUT_EVEN} />
            </div>

            {/* Any triple */}
            <BetBtn active={pickEq(pick, { kind: "ANY_TRIPLE" })} disabled={busy}
              onClick={() => setPick({ kind: "ANY_TRIPLE" })}
              label="ANY TRIPLE" sub="যেকোনো তিন সমান" tone="#ffd166" mult={PAYOUT_ANY_TRIPLE} wide />

            {/* Specific triples */}
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">
              Specific Triple · {PAYOUT_SPECIFIC}×
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {[1, 2, 3, 4, 5, 6].map((face) => {
                const active = pickEq(pick, { kind: "TRIPLE", face });
                return (
                  <button
                    key={face}
                    disabled={busy}
                    onClick={() => setPick({ kind: "TRIPLE", face })}
                    style={active ? {
                      borderColor: "#ffd166",
                      boxShadow: "0 0 12px rgba(255,209,102,0.5)",
                      background: "rgba(255,209,102,0.15)",
                      color: "#ffd166",
                    } : undefined}
                    className={`rounded-lg border-2 py-2 text-lg font-black tabular-nums transition-all active:scale-95 ${
                      active ? "" : "border-[#1a3a2a] bg-[#0c1a14] text-white/70 hover:border-[#3a5a2a]"
                    }`}
                  >
                    {face}
                  </button>
                );
              })}
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

          <ProvablyFairPanel pf={pf} gameKey="sic-bo" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="sic-bo" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

function BetBtn({
  active, disabled, onClick, label, sub, tone, mult, wide,
}: {
  active: boolean; disabled: boolean; onClick: () => void;
  label: string; sub: string; tone: string; mult: number; wide?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={active ? { borderColor: tone, boxShadow: `0 0 15px ${tone}66`, background: `${tone}18`, color: tone } : undefined}
      className={`rounded-lg border-2 px-3 py-3 font-black transition-all active:scale-95 ${wide ? "col-span-full" : ""} ${
        active ? "" : "border-[#1a3a2a] bg-[#0c1a14] text-white/70 hover:border-[#2a5a3a]"
      }`}
    >
      <div className="text-sm leading-tight">{label}</div>
      <div className="text-[10px] font-bold opacity-70 leading-tight">{sub}</div>
      <div className="mt-1 text-[10px] tabular-nums opacity-80">{mult}×</div>
    </button>
  );
}
