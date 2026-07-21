import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairWingo,
  wingoNetMult,
  wingoColorsOf,
  wingoSizeOf,
  WINGO_NUM_GROSS,
  WINGO_COLOR_PURE_GROSS,
  WINGO_COLOR_MIXED_GROSS,
  WINGO_VIOLET_GROSS,
  WINGO_SIZE_GROSS,
  type WingoPick,
  type WingoColor,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/wingo")({
  head: () => ({ meta: [
    { title: "Wingo · 3-Minute Lottery — Asik Game" },
    { name: "description", content: "রঙ, সংখ্যা বা বিগ/স্মল বেছে নিন। প্রতিটি রাউন্ডে ০-৯ এর মধ্যে একটি সংখ্যা আসবে।" },
    { property: "og:title", content: "Wingo · 3-Minute Lottery — Asik Game" },
    { property: "og:description", content: "Provably fair 0..9 color+number lottery. Pick number, color, violet, big or small." },
  ]}),
  component: WingoGame,
});

const ROUND_MS = 30_000; // demo cadence: 30s per round (mini-Wingo)

type Phase = "betting" | "drawing" | "settled";
type State =
  | { phase: "betting" }
  | { phase: "drawing"; pick: WingoPick; bet: number; revealIdx: number }
  | { phase: "settled"; pick: WingoPick; bet: number; number: number; colors: WingoColor[]; size: "big" | "small"; win: boolean; payout: number; netMult: number };

const NUM_COLORS: Record<number, string> = {
  0: "linear-gradient(135deg,#ef4444 0%,#ef4444 50%,#8b5cf6 50%,#8b5cf6 100%)",
  1: "#10b981", 2: "#ef4444", 3: "#10b981", 4: "#ef4444",
  5: "linear-gradient(135deg,#10b981 0%,#10b981 50%,#8b5cf6 50%,#8b5cf6 100%)",
  6: "#ef4444", 7: "#10b981", 8: "#ef4444", 9: "#10b981",
};

function pickKey(p: WingoPick): string {
  if (p.kind === "num") return `n:${p.value}`;
  if (p.kind === "color") return `c:${p.value}`;
  if (p.kind === "violet") return "v";
  return `s:${p.value}`;
}

function pickLabel(p: WingoPick): string {
  if (p.kind === "num") return `#${p.value}`;
  if (p.kind === "color") return p.value === "red" ? "RED" : "GREEN";
  if (p.kind === "violet") return "VIOLET";
  return p.value === "big" ? "BIG (5-9)" : "SMALL (0-4)";
}

function pickPreviewGross(p: WingoPick): { min: number; max: number } {
  if (p.kind === "num") return { min: WINGO_NUM_GROSS, max: WINGO_NUM_GROSS };
  if (p.kind === "color") return { min: WINGO_COLOR_MIXED_GROSS, max: WINGO_COLOR_PURE_GROSS };
  if (p.kind === "violet") return { min: WINGO_VIOLET_GROSS, max: WINGO_VIOLET_GROSS };
  return { min: WINGO_SIZE_GROSS, max: WINGO_SIZE_GROSS };
}

function WingoGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("wingo");
  const { data: cfg } = useGameConfig("wingo");
  const pf = useProvablyFair("wingo");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState<WingoPick>({ kind: "color", value: "green" });
  const [state, setState] = useState<State>({ phase: "betting" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [countdown, setCountdown] = useState(ROUND_MS / 1000);
  const [reelDigit, setReelDigit] = useState(0);
  const reelTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live countdown timer (visual; play/draw is manual).
  useEffect(() => {
    if (state.phase !== "betting") return;
    const t = setInterval(() => setCountdown((c) => (c <= 1 ? ROUND_MS / 1000 : c - 1)), 1000);
    return () => clearInterval(t);
  }, [state.phase]);

  const preview = useMemo(() => {
    const g = pickPreviewGross(pick);
    const netMin = +(g.min * (1 - edge)).toFixed(2);
    const netMax = +(g.max * (1 - edge)).toFixed(2);
    return { netMin, netMax };
  }, [pick, edge]);

  const draw = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    try { sfxTick(); } catch {}
    setState({ phase: "drawing", pick, bet, revealIdx: 0 });
    const r = await fairWingo(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Spin digits reel for ~2.2s then settle on r.number
    if (reelTimer.current) clearInterval(reelTimer.current);
    reelTimer.current = setInterval(() => setReelDigit((d) => (d + 1) % 10), 90);
    setTimeout(() => {
      if (reelTimer.current) { clearInterval(reelTimer.current); reelTimer.current = null; }
      setReelDigit(r.number);
      const netMult = wingoNetMult(pick, r.number, edge);
      const win = netMult > 0;
      const payout = win ? Math.floor(bet * netMult) : 0;
      if (win) { credit(payout); try { sfxWin(netMult); } catch {} }
      else { try { sfxBust(); } catch {} }
      const pnl = payout - bet;
      record({ pnl, multiplier: win ? netMult : 0 });
      pushMultiplierHistory("wingo", win ? netMult : 0);
      recordMyBet({ game: "wingo", bet, multiplier: win ? netMult : 0, payout });
      pf.consume(`wingo pick=${pickKey(pick)} n=${r.number} c=[${r.colors.join("+")}] size=${r.size} net=${netMult.toFixed(2)}x`);
      setState({ phase: "settled", pick, bet, number: r.number, colors: r.colors, size: r.size, win, payout, netMult });
      setMsg(win
        ? `🏆 ${pickLabel(pick)} হিট! ×${netMult.toFixed(2)} · +${pnl}`
        : `💥 ${r.number} · ${r.colors.join("+")} · ${r.size.toUpperCase()} — লস ${bet}`);
      setBusy(false);
    }, 2200);
  }, [busy, bet, pick, placeBet, pf, edge, credit, record]);

  useEffect(() => () => { if (reelTimer.current) clearInterval(reelTimer.current); }, []);

  const reset = () => { setState({ phase: "betting" }); setMsg(""); };
  const isDrawing = state.phase === "drawing";
  const settled = state.phase === "settled" ? state : null;
  const shownNumber = settled ? settled.number : reelDigit;
  const shownColors = settled ? settled.colors : wingoColorsOf(shownNumber);
  const shownSize = settled ? settled.size : wingoSizeOf(shownNumber);

  return (
    <GameShell title="Wingo · 3-Minute Lottery" emoji="🎯" gameKey="wingo">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-fuchsia-400/30 p-4 min-h-[520px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(180,80,255,0.22), transparent 55%), radial-gradient(circle at 50% 100%, rgba(40,160,255,0.22), transparent 55%), linear-gradient(180deg, #0d0225 0%, #180a3a 55%, #05010f 100%)",
          }}
        >
          <div className="pointer-events-none absolute inset-2 rounded-2xl border border-fuchsia-400/20" />

          {/* Header */}
          <div className="relative z-[2] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-200/80">Lottery</div>
              <div className="text-xl font-black text-white">🎯 উইনগো লটারি</div>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-right">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/60">Next Draw</div>
              <div className="font-mono text-lg font-black text-emerald-300">
                {String(Math.floor(countdown / 60)).padStart(2, "0")}:{String(countdown % 60).padStart(2, "0")}
              </div>
            </div>
          </div>

          {/* Draw display */}
          <div className="relative z-[2] mx-auto grid place-items-center">
            <div
              className="grid h-40 w-40 place-items-center rounded-full text-7xl font-black text-white shadow-[0_0_60px_rgba(180,80,255,0.55)] ring-8 ring-white/10"
              style={{
                background: NUM_COLORS[shownNumber] ?? "#111",
                filter: isDrawing ? "blur(0.5px) saturate(1.1)" : "none",
                transition: "background 0.2s ease",
              }}
            >
              <span style={{ textShadow: "0 4px 10px rgba(0,0,0,0.6)" }}>{shownNumber}</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {shownColors.map((c) => (
                <span
                  key={c}
                  className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/30"
                  style={{ background: c === "red" ? "#ef4444" : c === "green" ? "#10b981" : "#8b5cf6" }}
                >
                  {c}
                </span>
              ))}
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white ring-1 ring-white/20">
                {shownSize}
              </span>
            </div>
          </div>

          {/* Result pill */}
          {settled && (
            <div className={`relative z-[2] mx-auto rounded-full px-4 py-1.5 text-sm font-black shadow ${
              settled.win
                ? "border border-emerald-300/50 bg-emerald-500/25 text-emerald-100"
                : "border border-rose-300/50 bg-rose-500/25 text-rose-100"
            }`}>
              {settled.win ? `✅ WIN ×${settled.netMult.toFixed(2)}` : "❌ LOSS"} · #{settled.number}
            </div>
          )}

          {/* Bet type tabs — colors + violet + size */}
          <div className="relative z-[2] grid grid-cols-4 gap-2">
            <PickTile active={pick.kind === "color" && pick.value === "green"} onClick={() => !busy && setPick({ kind: "color", value: "green" })} bg="linear-gradient(180deg,#10b981,#065f46)" label="GREEN" sub="×2.0 / 1.5" />
            <PickTile active={pick.kind === "violet"} onClick={() => !busy && setPick({ kind: "violet" })} bg="linear-gradient(180deg,#8b5cf6,#4c1d95)" label="VIOLET" sub="×4.5" />
            <PickTile active={pick.kind === "color" && pick.value === "red"} onClick={() => !busy && setPick({ kind: "color", value: "red" })} bg="linear-gradient(180deg,#ef4444,#7f1d1d)" label="RED" sub="×2.0 / 1.5" />
            <PickTile active={pick.kind === "size" && pick.value === "big"} onClick={() => !busy && setPick({ kind: "size", value: "big" })} bg="linear-gradient(180deg,#f59e0b,#78350f)" label="BIG" sub="5-9 · ×2.0" />
          </div>
          <div className="relative z-[2] grid grid-cols-4 gap-2">
            <PickTile active={pick.kind === "size" && pick.value === "small"} onClick={() => !busy && setPick({ kind: "size", value: "small" })} bg="linear-gradient(180deg,#0ea5e9,#0c4a6e)" label="SMALL" sub="0-4 · ×2.0" />
            <div className="col-span-3 rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-center">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/50">Selected</div>
              <div className="text-sm font-black text-white">
                {pickLabel(pick)} · net {preview.netMin === preview.netMax ? `×${preview.netMax.toFixed(2)}` : `×${preview.netMin.toFixed(2)}–${preview.netMax.toFixed(2)}`}
              </div>
            </div>
          </div>

          {/* Numbers 0..9 grid */}
          <div className="relative z-[2] grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, n) => {
              const active = pick.kind === "num" && pick.value === n;
              return (
                <button
                  key={n}
                  disabled={busy}
                  onClick={() => setPick({ kind: "num", value: n })}
                  className={`grid h-14 place-items-center rounded-xl text-2xl font-black text-white ring-1 ring-white/20 transition-all ${
                    active ? "scale-[1.05] ring-2 ring-white shadow-[0_0_16px_rgba(255,255,255,0.5)]" : "opacity-90 hover:opacity-100"
                  }`}
                  style={{ background: NUM_COLORS[n] }}
                >
                  <span style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>{n}</span>
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
            value={preview.netMin === preview.netMax ? `×${preview.netMax.toFixed(2)}` : `×${preview.netMin.toFixed(2)}–${preview.netMax.toFixed(2)}`}
            sub={<>Pick <b className="uppercase">{pickLabel(pick)}</b> · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy || isDrawing} />
          {state.phase === "settled" ? (
            <div className="grid grid-cols-2 gap-2">
              <PrimaryButton onClick={() => { reset(); draw(); }} disabled={busy}>
                🔁 আবার খেলুন ({bet})
              </PrimaryButton>
              <button
                onClick={reset}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-black text-white/80 hover:bg-white/20"
              >
                রিসেট
              </button>
            </div>
          ) : (
            <PrimaryButton onClick={draw} disabled={busy || isDrawing}>
              {isDrawing ? "ড্র হচ্ছে..." : `🎯 ড্র শুরু (${bet})`}
            </PrimaryButton>
          )}
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="wingo" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Paytable · gross × (1 − edge {(edge * 100).toFixed(1)}%)
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <PayRow label="Number (0–9)" gross={`×${WINGO_NUM_GROSS.toFixed(1)}`} sub="1 চান্স / 10" />
          <PayRow label="Green (pure 1/3/7/9)" gross={`×${WINGO_COLOR_PURE_GROSS.toFixed(1)}`} sub="4 চান্স / 10" />
          <PayRow label="Green (mixed 5)" gross={`×${WINGO_COLOR_MIXED_GROSS.toFixed(1)}`} sub="1 চান্স / 10" />
          <PayRow label="Red (pure 2/4/6/8)" gross={`×${WINGO_COLOR_PURE_GROSS.toFixed(1)}`} sub="4 চান্স / 10" />
          <PayRow label="Red (mixed 0)" gross={`×${WINGO_COLOR_MIXED_GROSS.toFixed(1)}`} sub="1 চান্স / 10" />
          <PayRow label="Violet (0 or 5)" gross={`×${WINGO_VIOLET_GROSS.toFixed(1)}`} sub="2 চান্স / 10" />
          <PayRow label="Big (5–9)" gross={`×${WINGO_SIZE_GROSS.toFixed(1)}`} sub="5 চান্স / 10" />
          <PayRow label="Small (0–4)" gross={`×${WINGO_SIZE_GROSS.toFixed(1)}`} sub="5 চান্স / 10" />
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="wingo" />
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
