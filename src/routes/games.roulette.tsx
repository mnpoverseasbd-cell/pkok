import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { fairRoulette, ROULETTE_RED } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/roulette")({
  head: () => ({
    meta: [
      { title: "Roulette — Asik Game" },
      { name: "description", content: "European single-zero রুলেট — Red/Black, Odd/Even, Dozen ও Straight-up 35× পর্যন্ত।" },
      { property: "og:title", content: "Roulette — Asik Game" },
      { property: "og:description", content: "Provably-fair European roulette · 37 pockets · straight-up 35×।" },
    ],
  }),
  component: Roulette,
});

// Wheel order (European single-zero, clockwise from 0)
const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

type Pick =
  | { kind: "COLOR"; v: "RED" | "BLACK" }
  | { kind: "PARITY"; v: "ODD" | "EVEN" }
  | { kind: "SIZE"; v: "LOW" | "HIGH" }
  | { kind: "DOZEN"; v: 1 | 2 | 3 }
  | { kind: "STRAIGHT"; n: number };

type Phase = "idle" | "spinning" | "done";

const PAYOUT_EVEN = 2;     // Red/Black, Odd/Even, Low/High → 2× (1:1 + stake back)
const PAYOUT_DOZEN = 3;    // Dozen → 3× (2:1)
const PAYOUT_STRAIGHT = 36; // Straight-up → 36× (35:1)

function pockColor(n: number): "RED" | "BLACK" | "GREEN" {
  if (n === 0) return "GREEN";
  return ROULETTE_RED.has(n) ? "RED" : "BLACK";
}

function pickEq(a: Pick, b: Pick): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "COLOR" && b.kind === "COLOR") return a.v === b.v;
  if (a.kind === "PARITY" && b.kind === "PARITY") return a.v === b.v;
  if (a.kind === "SIZE" && b.kind === "SIZE") return a.v === b.v;
  if (a.kind === "DOZEN" && b.kind === "DOZEN") return a.v === b.v;
  if (a.kind === "STRAIGHT" && b.kind === "STRAIGHT") return a.n === b.n;
  return false;
}

function pickLabel(p: Pick): string {
  switch (p.kind) {
    case "COLOR": return p.v === "RED" ? "Red" : "Black";
    case "PARITY": return p.v === "ODD" ? "Odd" : "Even";
    case "SIZE": return p.v === "LOW" ? "1–18" : "19–36";
    case "DOZEN": return p.v === 1 ? "1st 12" : p.v === 2 ? "2nd 12" : "3rd 12";
    case "STRAIGHT": return `Straight ${p.n}`;
  }
}

function pickMult(p: Pick): number {
  switch (p.kind) {
    case "COLOR":
    case "PARITY":
    case "SIZE": return PAYOUT_EVEN;
    case "DOZEN": return PAYOUT_DOZEN;
    case "STRAIGHT": return PAYOUT_STRAIGHT;
  }
}

function pickWins(r: {
  pocket: number;
  color: "RED" | "BLACK" | "GREEN";
  parity: "ODD" | "EVEN" | null;
  size: "LOW" | "HIGH" | null;
  dozen: 1 | 2 | 3 | null;
}, p: Pick): boolean {
  if (r.pocket === 0) return p.kind === "STRAIGHT" && p.n === 0;
  switch (p.kind) {
    case "COLOR": return r.color === p.v;
    case "PARITY": return r.parity === p.v;
    case "SIZE": return r.size === p.v;
    case "DOZEN": return r.dozen === p.v;
    case "STRAIGHT": return p.n === r.pocket;
  }
}

// Compute the wheel target angle (degrees) that lands the given pocket at 12 o'clock.
function targetAngleFor(pocket: number, extraTurns: number): number {
  const idx = WHEEL_ORDER.indexOf(pocket);
  const seg = 360 / WHEEL_ORDER.length;
  // pocket idx sits at (idx * seg). Rotate wheel by -that so it aligns to 0°/top.
  return extraTurns * 360 - idx * seg;
}

function RouletteWheel({ angle, spinning }: { angle: number; spinning: boolean }) {
  const segs = WHEEL_ORDER.length;
  const seg = 360 / segs;
  return (
    <div className="relative h-72 w-72 sm:h-80 sm:w-80">
      {/* pointer */}
      <div
        aria-hidden
        className="absolute left-1/2 top-0 z-20 -translate-x-1/2"
        style={{
          width: 0, height: 0,
          borderLeft: "12px solid transparent",
          borderRight: "12px solid transparent",
          borderTop: "18px solid #ffd166",
          filter: "drop-shadow(0 0 6px rgba(255,209,102,0.8))",
        }}
      />
      {/* outer bezel */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, #8b6b1f, #f3d27a, #8b6b1f, #f3d27a, #8b6b1f)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6), inset 0 0 24px rgba(0,0,0,0.5)",
        }}
      />
      {/* rotating wheel */}
      <div
        className="absolute inset-2 rounded-full overflow-hidden"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: spinning
            ? "transform 4.2s cubic-bezier(0.15, 0.85, 0.25, 1)"
            : "none",
          background: "#0a0a0a",
          boxShadow: "inset 0 0 20px rgba(0,0,0,0.9)",
        }}
      >
        <svg viewBox="-100 -100 200 200" className="h-full w-full">
          {WHEEL_ORDER.map((n, i) => {
            const a0 = (i * seg - seg / 2 - 90) * (Math.PI / 180);
            const a1 = (i * seg + seg / 2 - 90) * (Math.PI / 180);
            const r = 95;
            const x0 = Math.cos(a0) * r, y0 = Math.sin(a0) * r;
            const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r;
            const fill = pockColor(n) === "RED" ? "#c8102e" : pockColor(n) === "BLACK" ? "#111" : "#0a8f3c";
            const midA = (i * seg - 90) * (Math.PI / 180);
            const tr = 78;
            const tx = Math.cos(midA) * tr, ty = Math.sin(midA) * tr;
            return (
              <g key={n}>
                <path
                  d={`M0 0 L${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1} Z`}
                  fill={fill}
                  stroke="#e6c56a"
                  strokeWidth={0.6}
                />
                <text
                  x={tx}
                  y={ty}
                  fontSize={9}
                  fontWeight={900}
                  fill="#fff"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${(i * seg)} ${tx} ${ty})`}
                >
                  {n}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* hub */}
      <div
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background: "radial-gradient(circle, #f3d27a 0%, #8b6b1f 70%, #3a2a08 100%)",
          boxShadow: "0 0 20px rgba(255,209,102,0.6), inset 0 -4px 8px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}

function Roulette() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("roulette");
  const { data: cfg } = useGameConfig("roulette");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("roulette");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Pick>({ kind: "COLOR", v: "RED" });
  const [phase, setPhase] = useState<Phase>("idle");
  const [angle, setAngle] = useState(0);
  const [pocket, setPocket] = useState<number | null>(null);
  const [won, setWon] = useState<boolean | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const runRound = useCallback(async () => {
    if (phase === "spinning") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setPocket(null); setWon(null); setMsg("");
    setPhase("spinning");
    try { sfxPeg(0.6); } catch { /* noop */ }

    const r = await fairRoulette(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Kick the wheel: 6 full turns then land on the pocket.
    const target = targetAngleFor(r.pocket, 6);
    // Ensure we advance forward from current angle
    const base = Math.ceil((angle - target) / 360) * 360;
    setAngle(target + base);

    await new Promise((res) => setTimeout(res, 4300));
    setPocket(r.pocket);

    const wins = pickWins(r, pick);
    const mult = pickMult(pick);
    const label = `${r.pocket} · ${r.color}${r.pocket === 0 ? "" : ` · ${r.parity} · ${r.size}`}`;
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
        count: pick.kind === "STRAIGHT" ? 220 : pick.kind === "DOZEN" ? 120 : 70,
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

    pf.consume(`roulette pocket=${r.pocket} color=${r.color}`);
    recordMyBet({ game: "roulette", bet, multiplier: winMult, payout: paid });
    pushMultiplierHistory("roulette", winMult);
    setPhase("done");
  }, [phase, pf, placeBet, credit, edge, bet, pick, record, angle]);

  const reset = () => { setPocket(null); setWon(null); setMsg(""); setPhase("idle"); };
  const busy = phase === "spinning";
  const glow =
    won === true ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
      won === false ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
        "border-[#1a3a2a]";

  const potential = Math.floor(bet * pickMult(pick));

  const numberGrid = useMemo(() => {
    // rows top→bottom: 3, 2, 1 columns then dozens etc.
    const rows: number[][] = [[], [], []];
    for (let n = 1; n <= 36; n++) {
      const row = 3 - ((n - 1) % 3) - 1; // 0=top(3,6,..),1=mid,2=bot
      rows[row].push(n);
    }
    return rows;
  }, []);

  return (
    <GameShell title="Roulette" emoji="🎡" gameKey="roulette">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b1f14] via-[#06120a] to-[#020604] p-4 min-h-[420px] transition-shadow duration-500 ${glow}`}>
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.08),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          <div className="relative z-10 mx-auto mb-4 flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest">
            <span className="text-[#ff4d4d]">RED 2×</span>
            <span className="text-[#ffd166]">STRAIGHT 36×</span>
            <span className="text-white/80">BLACK 2×</span>
          </div>

          <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
            <RouletteWheel angle={angle} spinning={busy} />

            {pocket !== null && (
              <div className="flex flex-col items-center gap-1 animate-fade-in">
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">POCKET</div>
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black tabular-nums text-white`}
                  style={{
                    background:
                      pockColor(pocket) === "RED" ? "#c8102e" :
                      pockColor(pocket) === "BLACK" ? "#111" : "#0a8f3c",
                    boxShadow:
                      pockColor(pocket) === "RED" ? "0 0 22px rgba(200,16,46,0.7)" :
                      pockColor(pocket) === "GREEN" ? "0 0 22px rgba(10,143,60,0.8)" :
                      "0 0 22px rgba(255,255,255,0.25)",
                  }}
                >
                  {pocket}
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
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">আউটসাইড বেট</label>

            <div className="grid grid-cols-2 gap-2">
              <OutsideBtn active={pickEq(pick, { kind: "COLOR", v: "RED" })} disabled={busy}
                onClick={() => setPick({ kind: "COLOR", v: "RED" })}
                label="RED" tone="#c8102e" mult={PAYOUT_EVEN} />
              <OutsideBtn active={pickEq(pick, { kind: "COLOR", v: "BLACK" })} disabled={busy}
                onClick={() => setPick({ kind: "COLOR", v: "BLACK" })}
                label="BLACK" tone="#ffffff" mult={PAYOUT_EVEN} />
              <OutsideBtn active={pickEq(pick, { kind: "PARITY", v: "ODD" })} disabled={busy}
                onClick={() => setPick({ kind: "PARITY", v: "ODD" })}
                label="ODD" tone="#7ee7ff" mult={PAYOUT_EVEN} />
              <OutsideBtn active={pickEq(pick, { kind: "PARITY", v: "EVEN" })} disabled={busy}
                onClick={() => setPick({ kind: "PARITY", v: "EVEN" })}
                label="EVEN" tone="#b47bff" mult={PAYOUT_EVEN} />
              <OutsideBtn active={pickEq(pick, { kind: "SIZE", v: "LOW" })} disabled={busy}
                onClick={() => setPick({ kind: "SIZE", v: "LOW" })}
                label="1–18" tone="#ff6b9d" mult={PAYOUT_EVEN} />
              <OutsideBtn active={pickEq(pick, { kind: "SIZE", v: "HIGH" })} disabled={busy}
                onClick={() => setPick({ kind: "SIZE", v: "HIGH" })}
                label="19–36" tone="#00ff88" mult={PAYOUT_EVEN} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {([1, 2, 3] as const).map((d) => (
                <OutsideBtn key={d} active={pickEq(pick, { kind: "DOZEN", v: d })} disabled={busy}
                  onClick={() => setPick({ kind: "DOZEN", v: d })}
                  label={d === 1 ? "1st 12" : d === 2 ? "2nd 12" : "3rd 12"} tone="#ffd166" mult={PAYOUT_DOZEN} />
              ))}
            </div>

            <label className="mt-2 text-xs font-bold uppercase tracking-widest text-[#ffd166]">
              স্ট্রেইট নাম্বার · 36×
            </label>
            <div className="flex gap-1.5">
              {/* zero column */}
              <button
                disabled={busy}
                onClick={() => setPick({ kind: "STRAIGHT", n: 0 })}
                style={pickEq(pick, { kind: "STRAIGHT", n: 0 }) ? {
                  outline: "2px solid #ffd166",
                  boxShadow: "0 0 12px rgba(255,209,102,0.6)",
                } : undefined}
                className="w-8 rounded-md bg-[#0a8f3c] py-1 text-sm font-black text-white active:scale-95"
              >
                0
              </button>
              <div className="grid flex-1 grid-cols-12 gap-1">
                {numberGrid.map((row, ri) => (
                  row.map((n) => {
                    const c = pockColor(n);
                    const active = pickEq(pick, { kind: "STRAIGHT", n });
                    return (
                      <button
                        key={n}
                        disabled={busy}
                        onClick={() => setPick({ kind: "STRAIGHT", n })}
                        style={{
                          background: c === "RED" ? "#c8102e" : "#111",
                          gridRow: ri + 1,
                          outline: active ? "2px solid #ffd166" : undefined,
                          boxShadow: active ? "0 0 12px rgba(255,209,102,0.6)" : undefined,
                        }}
                        className="rounded-md py-1 text-[11px] font-black tabular-nums text-white active:scale-95"
                      >
                        {n}
                      </button>
                    );
                  })
                ))}
              </div>
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={busy} />

          {phase === "done" ? (
            <PrimaryButton onClick={reset}>আবার খেলুন</PrimaryButton>
          ) : (
            <PrimaryButton onClick={runRound} disabled={busy}>
              {busy ? "স্পিন হচ্ছে..." : `স্পিন · ${bet}`}
            </PrimaryButton>
          )}

          <ProvablyFairPanel pf={pf} gameKey="roulette" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="roulette" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

function OutsideBtn({
  active, disabled, onClick, label, tone, mult,
}: {
  active: boolean; disabled: boolean; onClick: () => void;
  label: string; tone: string; mult: number;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={active ? { borderColor: tone, boxShadow: `0 0 15px ${tone}66`, background: `${tone}22`, color: tone } : undefined}
      className={`rounded-lg border-2 px-3 py-2.5 font-black transition-all active:scale-95 ${
        active ? "" : "border-[#1a3a2a] bg-[#0c1a14] text-white/80 hover:border-[#2a5a3a]"
      }`}
    >
      <div className="text-sm leading-tight">{label}</div>
      <div className="mt-0.5 text-[10px] tabular-nums opacity-80">{mult}×</div>
    </button>
  );
}
