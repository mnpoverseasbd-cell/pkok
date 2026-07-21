import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairDragonPhoenix,
  dpNetMult,
  dpOutcomeForSegment,
  DP_SEGMENTS,
  DP_DRAGON_COUNT,
  DP_PHOENIX_COUNT,
  DP_SIDE_GROSS,
  DP_TIE_GROSS,
  type DPPick,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/dragon-phoenix")({
  head: () => ({ meta: [
    { title: "Dragon vs Phoenix · Battle Wheel — Asik Game" },
    { name: "description", content: "২৫-সেগমেন্ট ব্যাটল হুইলে ড্রাগন, ফিনিক্স বা টাই বেছে নিন। জিতলে পাবেন বড় পেআউট।" },
    { property: "og:title", content: "Dragon vs Phoenix · Battle Wheel — Asik Game" },
    { property: "og:description", content: "Provably fair 25-slot battle wheel: 12 Dragon, 12 Phoenix, 1 Tie." },
  ]}),
  component: DragonPhoenixGame,
});

type State =
  | { phase: "idle" }
  | { phase: "spinning"; pick: DPPick; bet: number }
  | { phase: "settled"; pick: DPPick; segment: number; outcome: DPPick; win: boolean; payout: number; netMult: number; bet: number };

const PICKS: { key: DPPick; label: string; bnl: string; emoji: string; gross: number; color: string; glow: string }[] = [
  { key: "dragon",  label: "DRAGON",  bnl: "ড্রাগন",  emoji: "🐉", gross: DP_SIDE_GROSS, color: "from-rose-500 to-red-700",       glow: "rgba(255,80,80,0.55)" },
  { key: "phoenix", label: "PHOENIX", bnl: "ফিনিক্স", emoji: "🔥", gross: DP_SIDE_GROSS, color: "from-amber-400 to-orange-600",   glow: "rgba(255,180,40,0.55)" },
  { key: "tie",     label: "TIE",     bnl: "টাই",     emoji: "⚡", gross: DP_TIE_GROSS,  color: "from-emerald-400 to-emerald-600", glow: "rgba(80,255,180,0.55)" },
];

const SEG_ANGLE = 360 / DP_SEGMENTS;

function segmentColor(seg: number): string {
  const o = dpOutcomeForSegment(seg);
  if (o === "dragon")  return "#b91c1c";
  if (o === "phoenix") return "#d97706";
  return "#059669";
}

function DragonPhoenixGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("dragon-phoenix");
  const { data: cfg } = useGameConfig("dragon-phoenix");
  const pf = useProvablyFair("dragon-phoenix");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState<DPPick>("dragon");
  const [state, setState] = useState<State>({ phase: "idle" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [rotation, setRotation] = useState(0);

  const previewNet = useMemo(() => {
    const g = pick === "tie" ? DP_TIE_GROSS : DP_SIDE_GROSS;
    return +(g * (1 - edge)).toFixed(4);
  }, [pick, edge]);

  const spin = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    try { sfxTick(); } catch {}
    setState({ phase: "spinning", pick, bet });
    const r = await fairDragonPhoenix(pf.serverSeed, pf.clientSeed, pf.nonce);
    // Rotation lands with the target segment centered under the top pointer.
    const targetAngle = r.segment * SEG_ANGLE + SEG_ANGLE / 2;
    const spins = 6; // full revolutions
    const finalRot = spins * 360 + (360 - targetAngle);
    setRotation((prev) => prev + finalRot);
    // Settle after spin animation.
    setTimeout(() => {
      const win = r.outcome === pick;
      const netMult = dpNetMult(pick, r.outcome, edge);
      const payout = win ? Math.floor(bet * netMult) : 0;
      if (win) {
        credit(payout);
        try { sfxWin(netMult); } catch {}
      } else {
        try { sfxBust(); } catch {}
      }
      const pnl = payout - bet;
      record({ pnl, multiplier: win ? netMult : 0 });
      pushMultiplierHistory("dragon-phoenix", win ? netMult : 0);
      recordMyBet({ game: "dragon-phoenix", bet, multiplier: win ? netMult : 0, payout });
      pf.consume(`dragon-phoenix pick=${pick} seg=${r.segment} outcome=${r.outcome} net=${netMult.toFixed(2)}x`);
      setState({ phase: "settled", pick, segment: r.segment, outcome: r.outcome, win, payout, netMult, bet });
      setMsg(win
        ? `🏆 ${r.outcome.toUpperCase()}! ×${netMult.toFixed(2)} · +${pnl}`
        : `💥 ${r.outcome.toUpperCase()} জিতেছে! লস ${bet}`);
      setBusy(false);
    }, 2600);
  }, [busy, bet, pick, placeBet, pf, edge, credit, record]);

  const reset = () => { setState({ phase: "idle" }); setMsg(""); };

  const isSpinning = state.phase === "spinning";
  const settled = state.phase === "settled" ? state : null;

  // Precompute wheel conic-gradient stops
  const wheelGradient = useMemo(() => {
    const stops: string[] = [];
    for (let i = 0; i < DP_SEGMENTS; i++) {
      const from = (i * SEG_ANGLE).toFixed(4);
      const to = ((i + 1) * SEG_ANGLE).toFixed(4);
      stops.push(`${segmentColor(i)} ${from}deg ${to}deg`);
    }
    return `conic-gradient(from 0deg, ${stops.join(",")})`;
  }, []);

  return (
    <GameShell title="Dragon vs Phoenix · Battle Wheel" emoji="🐉" gameKey="dragon-phoenix">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-amber-400/30 p-4 min-h-[460px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,120,80,0.18), transparent 55%), radial-gradient(circle at 50% 100%, rgba(80,60,220,0.30), transparent 55%), linear-gradient(180deg, #180418 0%, #2a0910 55%, #05010a 100%)",
          }}
        >
          <div className="pointer-events-none absolute inset-2 rounded-2xl border border-amber-400/20" />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-200/80">Battle Wheel</div>
            <div className="text-2xl font-black text-white">🐉 ড্রাগন বনাম ফিনিক্স 🔥</div>
            <div className="mt-1 text-[11px] text-white/60">
              {DP_SEGMENTS} সেগমেন্ট · {DP_DRAGON_COUNT} ড্রাগন · {DP_PHOENIX_COUNT} ফিনিক্স · 1 টাই
            </div>
          </div>

          {/* Wheel */}
          <div className="relative z-[2] mx-auto grid flex-1 place-items-center">
            <div className="relative" style={{ width: 320, height: 320 }}>
              {/* Pointer */}
              <div
                className="absolute left-1/2 -translate-x-1/2 z-[3]"
                style={{
                  top: -6,
                  width: 0, height: 0,
                  borderLeft: "14px solid transparent",
                  borderRight: "14px solid transparent",
                  borderTop: "22px solid #fde68a",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                }}
              />
              {/* Rim */}
              <div className="absolute inset-0 rounded-full border-[6px] border-amber-300/60 shadow-[0_0_60px_rgba(255,180,60,0.35)]" />
              {/* Spinning disc */}
              <div
                className="absolute inset-[6px] rounded-full"
                style={{
                  background: wheelGradient,
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? "transform 2.6s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none",
                  boxShadow: "inset 0 0 40px rgba(0,0,0,0.5)",
                }}
              />
              {/* Segment dividers */}
              <div className="absolute inset-[6px] rounded-full" style={{
                background: `repeating-conic-gradient(from 0deg, transparent 0deg ${(SEG_ANGLE - 0.4).toFixed(4)}deg, rgba(0,0,0,0.35) ${(SEG_ANGLE - 0.4).toFixed(4)}deg ${SEG_ANGLE.toFixed(4)}deg)`,
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 2.6s cubic-bezier(0.15, 0.85, 0.25, 1)" : "none",
                pointerEvents: "none",
              }} />
              {/* Center hub */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-600 shadow-[0_0_30px_rgba(255,180,60,0.6)] ring-4 ring-amber-900/40">
                <div className="text-3xl">
                  {settled ? (settled.outcome === "dragon" ? "🐉" : settled.outcome === "phoenix" ? "🔥" : "⚡") : "⚔️"}
                </div>
              </div>
            </div>
          </div>

          {/* Result pill */}
          {settled && (
            <div className={`relative z-[2] mx-auto rounded-full px-4 py-1.5 text-sm font-black shadow ${
              settled.win
                ? "border border-emerald-300/50 bg-emerald-500/25 text-emerald-100"
                : "border border-rose-300/50 bg-rose-500/25 text-rose-100"
            }`}>
              {settled.win ? "✅ WIN" : "❌ LOSS"} · seg {settled.segment} → {settled.outcome.toUpperCase()}
            </div>
          )}

          {/* Pick buttons */}
          <div className="relative z-[2] grid grid-cols-3 gap-2">
            {PICKS.map((p) => {
              const active = pick === p.key;
              const netP = +(p.gross * (1 - edge)).toFixed(2);
              return (
                <button
                  key={p.key}
                  onClick={() => !busy && setPick(p.key)}
                  disabled={busy}
                  className={`rounded-xl px-3 py-2.5 text-sm font-black text-white transition-all bg-gradient-to-b ${p.color} ${
                    active ? "scale-[1.03] ring-2 ring-white/70" : "opacity-80 hover:opacity-100"
                  }`}
                  style={active ? { boxShadow: `0 0 20px ${p.glow}` } : undefined}
                >
                  <div className="text-lg leading-none">{p.emoji}</div>
                  <div className="mt-0.5">{p.bnl}</div>
                  <div className="text-[10px] font-bold opacity-90">×{netP}</div>
                </button>
              );
            })}
          </div>

          {msg && (
            <div className="relative z-[2] text-center text-base font-black text-[var(--neon-gold)]">
              {msg}
            </div>
          )}
        </div>

        <ControlsPanel>
          <MultDisplay
            label="Payout"
            value={`×${previewNet.toFixed(2)}`}
            sub={<>Pick <b className="uppercase">{pick}</b> · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || isSpinning} />
          {state.phase === "settled" ? (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={() => { reset(); spin(); }} disabled={busy}>
                🔁 আবার স্পিন ({bet})
              </PrimaryButton>
              <button
                onClick={reset}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white/80 hover:bg-white/20"
              >
                রিসেট
              </button>
            </div>
          ) : (
            <PrimaryButton onClick={spin} disabled={busy || isSpinning}>
              {isSpinning ? "স্পিনিং..." : `⚔️ যুদ্ধ শুরু (${bet})`}
            </PrimaryButton>
          )}
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="dragon-phoenix" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Wheel odds · {DP_SEGMENTS} segments · edge applied to net payout
        </div>
        <div className="grid grid-cols-3 gap-2">
          {PICKS.map((p) => {
            const count = p.key === "tie" ? 1 : DP_DRAGON_COUNT;
            const prob = (count / DP_SEGMENTS) * 100;
            const net = +(p.gross * (1 - edge)).toFixed(2);
            return (
              <div key={p.key} className="rounded-lg border border-white/15 bg-white/5 p-2 text-center">
                <div className="text-lg">{p.emoji}</div>
                <div className="text-xs font-black text-white">{p.bnl}</div>
                <div className="text-[11px] font-black text-emerald-300">×{net}</div>
                <div className="text-[9px] text-white/60">{prob.toFixed(0)}% · {count}/{DP_SEGMENTS}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="dragon-phoenix" />
      </div>
    </GameShell>
  );
}
