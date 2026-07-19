import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell, GameFrame, ControlsPanel } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { fairCrash } from "@/lib/provablyFair";
import { CrashChart } from "@/components/games/fx/CrashChart";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { LiveBetsFeed } from "@/components/games/LiveBetsFeed";
import { sfxCashout, sfxBust } from "@/lib/sound";
import { Plane, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/games/crash")({
  head: () => ({
    meta: [
      { title: "Aviator — Asik Game" },
      { name: "description", content: "উড়ন্ত plane — cashout the crash before it flies away." },
    ],
  }),
  component: Aviator,
});

// ---------- types ----------
type Phase = "waiting" | "flying" | "crashed";
type SlotStatus = "idle" | "queued" | "active" | "cashed" | "lost";
interface Slot {
  amount: number;
  auto: number;
  autoEnabled: boolean;
  status: SlotStatus;
  cashMult?: number;
  payout?: number;
}

const BETTING_WINDOW_MS = 7000;
const POST_CRASH_MS = 3000;

const chips = [10, 50, 100, 500, 1000];

function Aviator() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("crash");
  const { data: cfg } = useGameConfig("crash");
  const edge = cfg?.house_edge ?? 0.01;
  const pf = useProvablyFair("crash");

  const [phase, setPhase] = useState<Phase>("waiting");
  const [mult, setMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(BETTING_WINDOW_MS / 1000);

  const targetRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const fxRef = useRef<ParticleBurstHandle>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [slots, setSlots] = useState<[Slot, Slot]>([
    { amount: 50, auto: 2.0, autoEnabled: false, status: "idle" },
    { amount: 100, auto: 2.0, autoEnabled: false, status: "idle" },
  ]);
  const slotsRef = useRef(slots);
  useEffect(() => { slotsRef.current = slots; }, [slots]);

  const setSlot = useCallback((i: 0 | 1, patch: Partial<Slot>) => {
    setSlots((prev) => {
      const next = [...prev] as [Slot, Slot];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  // ---------- Round lifecycle ----------
  const stopAnim = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  const cashoutSlot = useCallback((i: 0 | 1, atMult: number, source: "manual" | "auto") => {
    const s = slotsRef.current[i];
    if (s.status !== "active") return;
    const won = Math.floor(s.amount * atMult * (1 - edge));
    credit(won);
    const pnl = won - s.amount;
    setSlot(i, { status: "cashed", cashMult: atMult, payout: won });
    record({ pnl, multiplier: atMult });
    recordMyBet({ game: "crash", bet: s.amount, multiplier: atMult, payout: won });
    fxRef.current?.burst({ count: 50, kind: "confetti", speed: 8 });
    try { sfxCashout(); } catch { /* noop */ }
    if (source === "auto") {
      // subtle visual only
    }
  }, [credit, edge, record, setSlot]);

  const startFlying = useCallback(async () => {
    if (!pf.ready) {
      // pf not ready — restart betting window
      setPhase("waiting");
      setCountdown(BETTING_WINDOW_MS / 1000);
      return;
    }
    // Convert queued -> active (bet already debited on queue)
    setSlots((prev) => {
      const next = prev.map((s) => (s.status === "queued" ? { ...s, status: "active" as SlotStatus } : s)) as [Slot, Slot];
      return next;
    });

    const target = await fairCrash(pf.serverSeed, pf.clientSeed, pf.nonce, edge);
    targetRef.current = target;
    setCrashAt(null);
    setMult(1.0);
    setPhase("flying");
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const m = +Math.pow(1.06, t * 8).toFixed(2);

      // Auto cashout checks
      for (const i of [0, 1] as const) {
        const s = slotsRef.current[i];
        if (s.status === "active" && s.autoEnabled && m >= s.auto && s.auto < target) {
          cashoutSlot(i, s.auto, "auto");
        }
      }

      if (m >= target) {
        setMult(target);
        setCrashAt(target);
        setPhase("crashed");
        pf.consume(`crash=${target}×`);
        pushMultiplierHistory("crash", target);
        // any still-active slot is lost
        setSlots((prev) => {
          const next = [...prev] as [Slot, Slot];
          for (const i of [0, 1] as const) {
            if (next[i].status === "active") {
              record({ pnl: -next[i].amount, multiplier: 0 });
              recordMyBet({ game: "crash", bet: next[i].amount, multiplier: 0, payout: 0 });
              next[i] = { ...next[i], status: "lost" };
            }
          }
          return next;
        });
        fxRef.current?.burst({ count: 60, kind: "smoke", color: "#ff4d4d", speed: 6 });
        try { sfxBust(); } catch { /* noop */ }
        stopAnim();
        // schedule next betting window
        cycleTimerRef.current = setTimeout(() => beginBettingWindow(), POST_CRASH_MS);
        return;
      }
      setMult(m);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [pf, edge, cashoutSlot, record]);

  const beginBettingWindow = useCallback(() => {
    stopAnim();
    setPhase("waiting");
    setMult(1.0);
    setCrashAt(null);
    setCountdown(BETTING_WINDOW_MS / 1000);
    // Reset finished slots to idle for a new round
    setSlots((prev) => prev.map((s) =>
      s.status === "cashed" || s.status === "lost" ? { ...s, status: "idle", cashMult: undefined, payout: undefined } : s,
    ) as [Slot, Slot]);
    if (countdownRef.current) clearInterval(countdownRef.current);
    const start = Date.now();
    countdownRef.current = setInterval(() => {
      const left = Math.max(0, BETTING_WINDOW_MS - (Date.now() - start));
      setCountdown(+(left / 1000).toFixed(1));
      if (left <= 0) {
        if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
        startFlying();
      }
    }, 100);
  }, [startFlying]);

  // Boot the cycle once
  const bootedRef = useRef(false);
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    beginBettingWindow();
    return () => {
      stopAnim();
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [beginBettingWindow]);

  // ---------- Actions ----------
  const queueBet = (i: 0 | 1) => {
    const s = slotsRef.current[i];
    if (s.status !== "idle") return;
    if (phase === "flying") return; // can't queue mid-flight visually — button hides anyway
    if (!placeBet(s.amount)) return;
    setSlot(i, { status: "queued" });
  };

  const cancelQueued = (i: 0 | 1) => {
    const s = slotsRef.current[i];
    if (s.status !== "queued") return;
    credit(s.amount); // refund pending bet
    setSlot(i, { status: "idle" });
  };

  const manualCashout = (i: 0 | 1) => {
    if (phase !== "flying") return;
    cashoutSlot(i, mult, "manual");
  };

  // ---------- Plane position on curve ----------
  // Approximation of the CrashChart mapping: t-progress across width, m-progress across height.
  // We overlay a plane that flies along the same parabolic path.
  const planeStyle = useMemo(() => {
    if (phase === "waiting") {
      return { left: "8%", bottom: "10%", opacity: 0, transform: "rotate(-25deg)" };
    }
    const t = Math.min(1, Math.log(mult) / Math.log(Math.max(2, targetRef.current || 2)));
    const x = 8 + t * 78; // % from left
    const y = 10 + t * 68; // % from bottom
    const rot = -18 - t * 15;
    return {
      left: `${x}%`,
      bottom: `${y}%`,
      opacity: phase === "crashed" ? 0 : 1,
      transform: `translate(-50%, 50%) rotate(${rot}deg)`,
    };
  }, [mult, phase]);

  // ---------- UI helpers ----------
  const statusText =
    phase === "waiting" ? `পরবর্তী রাউন্ড: ${countdown.toFixed(1)}s` :
      phase === "flying" ? "উড়ছে…" :
        `💥 বাস্ট @ ${crashAt}×`;

  const statusColor =
    phase === "waiting" ? "text-white/70" :
      phase === "flying" ? "text-[#00ff88]" :
        "text-[#ff4d4d]";

  const frameGlow =
    phase === "crashed" ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
      phase === "flying" ? "shadow-[0_0_70px_-10px_rgba(0,255,136,0.5)] border-[#143a1f]" :
        "shadow-[0_0_50px_-15px_rgba(255,255,255,0.15)] border-[#1a3321]";

  return (
    <GameShell title="Aviator" emoji="✈️" gameKey="crash">
      <GameFrame>
        {/* --------- Flight display --------- */}
        <div className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0a120b] via-[#050a06] to-[#020604] min-h-[340px] transition-shadow duration-500 ${frameGlow}`}>
          {/* history strip pinned at top */}
          <div className="absolute inset-x-0 top-0 z-20 border-b border-white/5 bg-black/40 px-3 py-2 backdrop-blur">
            <MultiplierHistoryStrip gameKey="crash" />
          </div>

          {/* curve */}
          <CrashChart multiplier={mult} active={phase === "flying"} state={phase === "waiting" ? "idle" : phase} />

          {/* Ambient glow */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,255,136,0.08),transparent_60%)]" />

          {/* Center HUD */}
          <div className="relative z-10 flex flex-col items-center gap-3 pt-6">
            {phase === "waiting" ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-[11px] font-black uppercase tracking-[0.35em] text-white/50">Next round in</div>
                <div className="text-7xl font-black tabular-nums text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]">
                  {Math.max(0, Math.ceil(countdown))}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-white/40">এখনই বাজি রাখুন</div>
              </div>
            ) : (
              <>
                <div className={`text-7xl font-black tabular-nums drop-shadow-[0_0_30px_rgba(0,255,136,0.55)] transition-colors sm:text-8xl ${phase === "crashed" ? "text-[#ff4d4d]" : "text-white"}`}>
                  {mult.toFixed(2)}<span className="text-4xl sm:text-5xl">×</span>
                </div>
                <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] ${statusColor}`}>
                  {phase === "flying" && <><Plane className="h-3.5 w-3.5 animate-pulse" /> in flight</>}
                  {phase === "crashed" && <>✈️💥 flew away</>}
                </div>
              </>
            )}
          </div>

          {/* Flying plane overlay */}
          {phase !== "waiting" && (
            <div
              className="pointer-events-none absolute z-10 transition-all duration-100 ease-linear"
              style={planeStyle}
            >
              <div className="relative">
                <Plane
                  className="h-10 w-10 text-[#ffd166] drop-shadow-[0_0_18px_rgba(255,209,102,0.9)] sm:h-12 sm:w-12"
                  fill="currentColor"
                />
                {phase === "flying" && (
                  <div className="absolute -left-16 top-1/2 h-1 w-16 -translate-y-1/2 bg-gradient-to-r from-transparent to-[#ffd166]/70 blur-sm" />
                )}
              </div>
            </div>
          )}

          <div className="absolute bottom-2 left-3 z-10 text-[10px] font-bold uppercase tracking-widest text-white/40">
            {statusText}
          </div>

          <ParticleLayer ref={fxRef} />
        </div>

        {/* --------- Controls (dual bet) --------- */}
        <ControlsPanel>
          <div className="grid gap-3 sm:grid-cols-2">
            <BetSlotPanel
              label="বাজি ১"
              slot={slots[0]}
              phase={phase}
              currentMult={mult}
              disabledQueue={!pf.ready || phase === "flying"}
              onAmount={(a) => setSlot(0, { amount: Math.max(1, a) })}
              onAuto={(a) => setSlot(0, { auto: Math.max(1.01, a) })}
              onToggleAuto={() => setSlot(0, { autoEnabled: !slots[0].autoEnabled })}
              onQueue={() => queueBet(0)}
              onCancel={() => cancelQueued(0)}
              onCashout={() => manualCashout(0)}
              edge={edge}
            />
            <BetSlotPanel
              label="বাজি ২"
              slot={slots[1]}
              phase={phase}
              currentMult={mult}
              disabledQueue={!pf.ready || phase === "flying"}
              onAmount={(a) => setSlot(1, { amount: Math.max(1, a) })}
              onAuto={(a) => setSlot(1, { auto: Math.max(1.01, a) })}
              onToggleAuto={() => setSlot(1, { autoEnabled: !slots[1].autoEnabled })}
              onQueue={() => queueBet(1)}
              onCancel={() => cancelQueued(1)}
              onCashout={() => manualCashout(1)}
              edge={edge}
            />
          </div>

          <ProvablyFairPanel pf={pf} gameKey="crash" />
        </ControlsPanel>
      </GameFrame>

      {/* Live bets feed */}
      <div className="mt-4">
        <LiveBetsFeed compact />
      </div>

      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

// ---------- Bet slot subcomponent ----------
function BetSlotPanel({
  label, slot, phase, currentMult, disabledQueue, edge,
  onAmount, onAuto, onToggleAuto, onQueue, onCancel, onCashout,
}: {
  label: string;
  slot: Slot;
  phase: Phase;
  currentMult: number;
  disabledQueue: boolean;
  edge: number;
  onAmount: (n: number) => void;
  onAuto: (n: number) => void;
  onToggleAuto: () => void;
  onQueue: () => void;
  onCancel: () => void;
  onCashout: () => void;
}) {
  const canCashout = phase === "flying" && slot.status === "active";
  const isQueued = slot.status === "queued";
  const potential = Math.floor(slot.amount * currentMult * (1 - edge));

  const borderTone =
    slot.status === "cashed" ? "border-[#ffd166]/60 shadow-[0_0_25px_-8px_rgba(255,209,102,0.6)]" :
      slot.status === "lost" ? "border-[#ff4d4d]/50" :
        canCashout ? "border-[#00ff88]/60 shadow-[0_0_25px_-8px_rgba(0,255,136,0.5)]" :
          isQueued ? "border-[#ffd166]/40" :
            "border-white/10";

  return (
    <div className={`flex flex-col gap-2 rounded-xl border bg-black/40 p-3 transition-all ${borderTone}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</span>
        {slot.status === "cashed" && (
          <span className="rounded-full bg-[#ffd166]/20 px-2 py-0.5 text-[10px] font-black text-[#ffd166]">
            +{slot.payout} @ {slot.cashMult?.toFixed(2)}×
          </span>
        )}
        {slot.status === "lost" && (
          <span className="rounded-full bg-[#ff4d4d]/20 px-2 py-0.5 text-[10px] font-black text-[#ff4d4d]">
            -{slot.amount}
          </span>
        )}
        {isQueued && (
          <span className="rounded-full bg-[#ffd166]/20 px-2 py-0.5 text-[10px] font-black text-[#ffd166] animate-pulse">
            পরবর্তী রাউন্ডের জন্য
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="flex items-center gap-2">
        <button
          disabled={isQueued || canCashout}
          onClick={() => onAmount(Math.max(1, Math.floor(slot.amount / 2)))}
          className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-black/50 text-white/80 hover:bg-black/70 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <input
          type="number"
          min={1}
          value={slot.amount}
          disabled={isQueued || canCashout}
          onChange={(e) => onAmount(Number(e.target.value) || 1)}
          className="w-full rounded-md border border-white/10 bg-black/50 px-2 py-2 text-center text-lg font-black tabular-nums text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
        />
        <button
          disabled={isQueued || canCashout}
          onClick={() => onAmount(slot.amount * 2)}
          className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-black/50 text-white/80 hover:bg-black/70 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1">
        {chips.map((c) => (
          <button
            key={c}
            disabled={isQueued || canCashout}
            onClick={() => onAmount(c)}
            className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-[11px] font-bold text-white/70 hover:border-[#00ff88]/50 hover:text-[#00ff88] disabled:opacity-40"
          >
            {c}
          </button>
        ))}
      </div>

      {/* Auto cashout */}
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
          <input
            type="checkbox"
            checked={slot.autoEnabled}
            disabled={canCashout}
            onChange={onToggleAuto}
            className="h-3.5 w-3.5 accent-[#00ff88]"
          />
          Auto @
        </label>
        <input
          type="number"
          step="0.01"
          min={1.01}
          value={slot.auto}
          disabled={!slot.autoEnabled || canCashout}
          onChange={(e) => onAuto(Number(e.target.value) || 1.01)}
          className="w-20 rounded-md border border-white/10 bg-black/50 px-2 py-1 text-sm font-bold tabular-nums text-white outline-none focus:border-[#00ff88] disabled:opacity-40"
        />
        <span className="text-[10px] font-bold text-white/40">×</span>
      </div>

      {/* Main action */}
      {canCashout ? (
        <button
          onClick={onCashout}
          className="rounded-xl bg-gradient-to-b from-[#ffd166] to-[#e0a500] px-3 py-3 text-center font-black text-[#050a06] shadow-[0_6px_20px_-4px_rgba(255,209,102,0.6)] transition hover:brightness-110 active:scale-95"
        >
          <div className="text-[10px] uppercase tracking-widest opacity-70">ক্যাশআউট</div>
          <div className="text-lg tabular-nums">৳ {potential.toLocaleString("en-BD")}</div>
        </button>
      ) : isQueued ? (
        <button
          onClick={onCancel}
          className="rounded-xl border border-[#ff4d4d]/40 bg-[#ff4d4d]/10 px-3 py-3 text-center text-sm font-black text-[#ff4d4d] transition hover:bg-[#ff4d4d]/20"
        >
          বাতিল করুন (৳ {slot.amount})
        </button>
      ) : (
        <button
          onClick={onQueue}
          disabled={disabledQueue || slot.status !== "idle"}
          className="rounded-xl bg-gradient-to-b from-[#00ff88] to-[#00a755] px-3 py-3 text-center font-black text-[#050a06] shadow-[0_6px_20px_-4px_rgba(0,255,136,0.55)] transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          <div className="text-[10px] uppercase tracking-widest opacity-70">
            {phase === "flying" ? "পরবর্তী রাউন্ড" : "বাজি রাখুন"}
          </div>
          <div className="text-lg tabular-nums">৳ {slot.amount.toLocaleString("en-BD")}</div>
        </button>
      )}
    </div>
  );
}
