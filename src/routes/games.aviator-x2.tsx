import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairAviatorX2,
  avx2NetMult,
  AVX2_SIDE_GROSS,
  AVX2_BOTH_GROSS,
  AVX2_BOTH_THRESHOLD,
  type AvX2Pick,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/aviator-x2")({
  head: () => ({ meta: [
    { title: "Aviator X2 · Duo-Plane — Asik Game" },
    { name: "description", content: "দুটি প্লেন একসাথে উড়বে — কোনটা উঁচুতে যাবে বাজি ধরুন, নাকি দুটোই ২× ছাড়াবে?" },
    { property: "og:title", content: "Aviator X2 · Duo-Plane — Asik Game" },
    { property: "og:description", content: "Provably fair duo-plane crash. Bet LEFT, RIGHT, or BOTH ≥ 2× for the big payout." },
  ]}),
  component: AviatorX2Game,
});

type Phase = "betting" | "flying" | "settled";
type State =
  | { phase: "betting" }
  | { phase: "flying"; pick: AvX2Pick; bet: number }
  | { phase: "settled"; pick: AvX2Pick; bet: number; left: number; right: number; win: boolean; payout: number; netMult: number };

const FLY_MS = 2600;

function pickLabel(p: AvX2Pick): string {
  if (p === "left") return "LEFT · বাম";
  if (p === "right") return "RIGHT · ডান";
  return "BOTH ≥ 2×";
}
function pickGross(p: AvX2Pick): number {
  return p === "both" ? AVX2_BOTH_GROSS : AVX2_SIDE_GROSS;
}

function AviatorX2Game() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("aviator-x2");
  const { data: cfg } = useGameConfig("aviator-x2");
  const pf = useProvablyFair("aviator-x2");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState<AvX2Pick>("left");
  const [state, setState] = useState<State>({ phase: "betting" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tickL, setTickL] = useState(1);
  const [tickR, setTickR] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const preview = useMemo(() => {
    const net = +(pickGross(pick) * (1 - edge)).toFixed(2);
    return { net };
  }, [pick, edge]);

  const fly = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    try { sfxTick(); } catch {}
    setState({ phase: "flying", pick, bet });
    const r = await fairAviatorX2(pf.serverSeed, pf.clientSeed, pf.nonce, 0.01);

    // Animate ticking climbers up toward each peak
    const start = performance.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / FLY_MS);
      const ease = 1 - Math.pow(1 - t, 2);
      setTickL(1 + (r.left - 1) * ease);
      setTickR(1 + (r.right - 1) * ease);
      if (t >= 1 && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }, 50);

    setTimeout(() => {
      setTickL(r.left); setTickR(r.right);
      const netMult = avx2NetMult(pick, r.left, r.right, edge);
      const win = netMult > 0;
      const payout = win ? Math.floor(bet * netMult) : 0;
      if (win) { credit(payout); try { sfxWin(netMult); } catch {} }
      else { try { sfxBust(); } catch {} }
      const pnl = payout - bet;
      record({ pnl, multiplier: win ? netMult : 0 });
      pushMultiplierHistory("aviator-x2", win ? netMult : 0);
      recordMyBet({ game: "aviator-x2", bet, multiplier: win ? netMult : 0, payout });
      pf.consume(`aviator-x2 pick=${pick} L=${r.left.toFixed(2)} R=${r.right.toFixed(2)} net=${netMult.toFixed(2)}x`);
      setState({ phase: "settled", pick, bet, left: r.left, right: r.right, win, payout, netMult });
      setMsg(win
        ? `🏆 ${pickLabel(pick)} জিতেছে! ×${netMult.toFixed(2)} · +${pnl}`
        : `💥 L=${r.left.toFixed(2)}× · R=${r.right.toFixed(2)}× — লস ${bet}`);
      setBusy(false);
    }, FLY_MS + 60);
  }, [busy, bet, pick, placeBet, pf, edge, credit, record]);

  const reset = () => { setState({ phase: "betting" }); setMsg(""); setTickL(1); setTickR(1); };
  const isFlying = state.phase === "flying";
  const settled = state.phase === "settled" ? state : null;

  const winnerBadge = (side: "L" | "R"): string => {
    if (!settled) return "";
    const l = settled.left, r = settled.right;
    if (side === "L") return l > r ? "🏆" : l < r ? "" : "=";
    return r > l ? "🏆" : r < l ? "" : "=";
  };

  return (
    <GameShell title="Aviator X2 · Duo-Plane" emoji="✈️" gameKey="aviator-x2">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-sky-400/30 p-4 min-h-[520px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(80,180,255,0.22), transparent 55%), radial-gradient(circle at 50% 100%, rgba(255,120,60,0.18), transparent 55%), linear-gradient(180deg, #04102a 0%, #071b3f 55%, #010614 100%)",
          }}
        >
          <div className="pointer-events-none absolute inset-2 rounded-2xl border border-sky-400/20" />

          {/* Header */}
          <div className="relative z-[2] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-200/80">Duo-Plane</div>
              <div className="text-xl font-black text-white">✈️ অ্যাভিয়েটর X2</div>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-right">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/60">Threshold (BOTH)</div>
              <div className="font-mono text-lg font-black text-amber-300">≥ ×{AVX2_BOTH_THRESHOLD.toFixed(1)}</div>
            </div>
          </div>

          {/* Twin sky lanes */}
          <div className="relative z-[2] grid grid-cols-2 gap-3">
            {(["L", "R"] as const).map((side) => {
              const val = side === "L" ? tickL : tickR;
              const peakSettled = settled ? (side === "L" ? settled.left : settled.right) : null;
              const crashed = peakSettled !== null && peakSettled <= 1.0;
              const climb = Math.min(0.85, (val - 1) * 0.18); // 0..0.85 of height
              const borderCls = side === "L" ? "border-sky-400/30" : "border-rose-400/30";
              return (
                <div key={side} className={`relative h-56 overflow-hidden rounded-xl border ${borderCls} bg-black/40`}>
                  <div className="pointer-events-none absolute inset-0"
                    style={{
                      background: side === "L"
                        ? "linear-gradient(180deg, rgba(56,189,248,0.10), transparent 70%)"
                        : "linear-gradient(180deg, rgba(244,63,94,0.10), transparent 70%)",
                    }}
                  />
                  {/* horizon lines */}
                  {[0.25, 0.5, 0.75].map((y) => (
                    <div key={y} className="absolute left-0 right-0 border-t border-white/5" style={{ top: `${y * 100}%` }} />
                  ))}
                  {/* plane */}
                  <div
                    className="absolute left-1/2 text-3xl transition-transform"
                    style={{
                      bottom: `${8 + climb * 100}%`,
                      transform: `translateX(-50%) rotate(${side === "L" ? -18 : -18}deg)`,
                      filter: crashed ? "grayscale(1) brightness(0.6)" : "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
                    }}
                  >
                    {crashed ? "💥" : "✈️"}
                  </div>
                  {/* multiplier readout */}
                  <div className="absolute inset-x-0 top-2 text-center">
                    <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-lg font-black text-white ring-1 ${
                      side === "L" ? "bg-sky-500/25 ring-sky-300/50" : "bg-rose-500/25 ring-rose-300/50"
                    }`}>
                      <span>{side === "L" ? "L" : "R"}</span>
                      <span className="font-mono">×{val.toFixed(2)}</span>
                      {settled && <span>{winnerBadge(side)}</span>}
                    </div>
                  </div>
                  {/* BOTH threshold marker */}
                  <div
                    className="absolute inset-x-2 border-t border-dashed border-amber-300/50"
                    style={{ bottom: `${8 + Math.min(0.85, (AVX2_BOTH_THRESHOLD - 1) * 0.18) * 100}%` }}
                  >
                    <span className="absolute -top-2 right-0 rounded bg-amber-500/80 px-1 text-[9px] font-black text-black">2×</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Result pill */}
          {settled && (
            <div className={`relative z-[2] mx-auto rounded-full px-4 py-1.5 text-sm font-black shadow ${
              settled.win
                ? "border border-emerald-300/50 bg-emerald-500/25 text-emerald-100"
                : "border border-rose-300/50 bg-rose-500/25 text-rose-100"
            }`}>
              {settled.win ? `✅ WIN ×${settled.netMult.toFixed(2)}` : "❌ LOSS"} · L ×{settled.left.toFixed(2)} · R ×{settled.right.toFixed(2)}
            </div>
          )}

          {/* Bet picks */}
          <div className="relative z-[2] grid grid-cols-3 gap-2">
            <PickTile active={pick === "left"} onClick={() => !busy && setPick("left")}
              bg="linear-gradient(180deg,#38bdf8,#0c4a6e)" label="LEFT" sub={`×${AVX2_SIDE_GROSS.toFixed(2)}`} />
            <PickTile active={pick === "both"} onClick={() => !busy && setPick("both")}
              bg="linear-gradient(180deg,#f59e0b,#78350f)" label="BOTH ≥ 2×" sub={`×${AVX2_BOTH_GROSS.toFixed(2)}`} />
            <PickTile active={pick === "right"} onClick={() => !busy && setPick("right")}
              bg="linear-gradient(180deg,#f43f5e,#7f1d1d)" label="RIGHT" sub={`×${AVX2_SIDE_GROSS.toFixed(2)}`} />
          </div>

          {msg && (
            <div className="relative z-[2] text-center text-base font-black text-[var(--neon-gold)]">
              {msg}
            </div>
          )}
        </div>

        <ControlsPanel>
          <MultDisplay
            label="Net Payout"
            value={`×${preview.net.toFixed(2)}`}
            sub={<>Pick <b className="uppercase">{pickLabel(pick)}</b> · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || isFlying} />
          {state.phase === "settled" ? (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={() => { reset(); fly(); }} disabled={busy}>
                🔁 আবার উড়ান ({bet})
              </PrimaryButton>
              <button
                onClick={reset}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white/80 hover:bg-white/20"
              >
                রিসেট
              </button>
            </div>
          ) : (
            <PrimaryButton onClick={fly} disabled={busy || isFlying}>
              {isFlying ? "উড়ছে..." : `✈️ উড়াও (${bet})`}
            </PrimaryButton>
          )}
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="aviator-x2" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Paytable · gross × (1 − edge {(edge * 100).toFixed(1)}%)
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <PayRow label="LEFT (higher peak)" gross={`×${AVX2_SIDE_GROSS.toFixed(2)}`} sub="~49% জিততে পারে" />
          <PayRow label="RIGHT (higher peak)" gross={`×${AVX2_SIDE_GROSS.toFixed(2)}`} sub="~49% জিততে পারে" />
          <PayRow label={`BOTH ≥ ×${AVX2_BOTH_THRESHOLD.toFixed(1)}`} gross={`×${AVX2_BOTH_GROSS.toFixed(2)}`} sub="~24% হিট রেট" />
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="aviator-x2" />
      </div>
    </GameShell>
  );
}

function PickTile({ active, onClick, bg, label, sub }: { active: boolean; onClick: () => void; bg: string; label: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-2 py-2.5 text-center text-white ring-1 transition-all ${
        active ? "scale-[1.04] ring-2 ring-white shadow-[0_0_18px_rgba(255,255,255,0.35)]" : "ring-white/20 opacity-90 hover:opacity-100"
      }`}
      style={{ background: bg }}
    >
      <div className="text-sm font-black leading-tight" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>{label}</div>
      <div className="text-[10px] font-bold opacity-90">{sub}</div>
    </button>
  );
}

function PayRow({ label, gross, sub }: { label: string; gross: string; sub: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/15 bg-white/5 px-2 py-1.5">
      <div>
        <div className="text-[11px] font-black text-white">{label}</div>
        <div className="text-[9px] text-white/60">{sub}</div>
      </div>
      <div className="text-[11px] font-black text-emerald-300">{gross}</div>
    </div>
  );
}
