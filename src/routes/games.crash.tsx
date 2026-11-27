import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Bot,
  Coins,
  History,
  LogIn,
  Minus,
  Plane,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { AviatorCanvas, type SkyCashoutBadge } from "@/components/games/fx/AviatorCanvas";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { useGameConfig } from "@/hooks/useGameConfig";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairCrash } from "@/lib/provablyFair";
import { recordMyBet, subscribeLiveBets, type LiveBet } from "@/lib/liveFeed";
import { subscribeBetHistory, type BetHistoryEntry } from "@/lib/betHistory";
import { isMuted, sfxBust, sfxCashout, sfxTakeoff, toggleMuted } from "@/lib/sound";
import { toast } from "sonner";

export const Route = createFileRoute("/games/crash")({
  head: () => ({
    meta: [
      { title: "Aviator Crash — Asik Game" },
      { name: "description", content: "উপরে 60fps লাইভ জেট ক্র্যাশ এবং নিচে ডুয়াল অটো-ক্যাশআউট বেট কন্ট্রোল।" },
    ],
  }),
  component: AviatorCrashPage,
});

type Phase = "waiting" | "flying" | "crashed";
type SlotStatus = "idle" | "queued" | "active" | "cashed" | "lost";
type FeedTab = "live" | "history";

interface Slot {
  amount: number;
  auto: number;
  autoEnabled: boolean;
  status: SlotStatus;
  cashMult?: number;
  payout?: number;
}

const BETTING_WINDOW_MS = 6500;
const POST_CRASH_MS = 2800;
const QUICK_CHIPS = [10, 50, 100, 500, 1000];
const AUTO_PRESETS = [1.5, 2.0, 3.0, 5.0];

function AviatorCrashPage() {
  const { balance, bet: placeBet, credit, refresh, userId, loading: walletLoading } = useDemoWallet();
  const { data: cfg, isLoading: cfgLoading } = useGameConfig("crash");
  const { stats, record, reset: resetStats } = useGameStats("crash");
  const pf = useProvablyFair("crash");

  const maintenance = !cfgLoading && cfg && !cfg.is_enabled;
  const notLoggedIn = !walletLoading && !userId;
  const noCoins = !walletLoading && !!userId && balance <= 0;

  const minBet = cfg?.min_bet ?? 10;
  const maxBet = cfg?.max_bet ?? 10000;
  const edge = cfg?.house_edge ?? 0.01;
  const multScale = Number(cfg?.config?.payout_multiplier ?? 1);
  const maxCapMult = Number(cfg?.config?.max_payout_mult ?? 0);

  const [phase, setPhase] = useState<Phase>("waiting");
  const [mult, setMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState(BETTING_WINDOW_MS / 1000);
  const [recentCrashes, setRecentCrashes] = useState<number[]>([]);
  const [skyBadges, setSkyBadges] = useState<SkyCashoutBadge[]>([]);
  const [muted, setMutedState] = useState(() => isMuted());
  const [fairOpen, setFairOpen] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>("live");
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [myHistory, setMyHistory] = useState<BetHistoryEntry[]>([]);

  const [slots, setSlots] = useState<[Slot, Slot]>([
    { amount: 50, auto: 2.0, autoEnabled: false, status: "idle" },
    { amount: 100, auto: 2.0, autoEnabled: false, status: "idle" },
  ]);

  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const pfRef = useRef(pf);
  pfRef.current = pf;
  const targetRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const fxRef = useRef<ParticleBurstHandle>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => subscribeLiveBets(setLiveBets), []);
  useEffect(() => subscribeBetHistory(setMyHistory), []);

  const crashHistory = useMemo(
    () => myHistory.filter((h) => h.game === "crash").slice(0, 20),
    [myHistory],
  );

  // Sync slot amounts cleanly when admin min/max changes
  useEffect(() => {
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        amount: Math.max(minBet, Math.min(maxBet, s.amount)),
      })) as [Slot, Slot],
    );
  }, [minBet, maxBet]);

  const calcPayout = useCallback(
    (amount: number, atMult: number) => {
      const raw = Math.floor(amount * atMult * (1 - edge));
      const scale = Number.isFinite(multScale) && multScale > 0 ? multScale : 1;
      const cap = Number.isFinite(maxCapMult) && maxCapMult > 0 ? maxCapMult : Infinity;
      return Math.min(Math.floor(raw * scale), Math.floor(amount * cap));
    },
    [edge, multScale, maxCapMult],
  );

  const setSlot = useCallback((i: 0 | 1, patch: Partial<Slot>) => {
    setSlots((prev) => {
      const next = [...prev] as [Slot, Slot];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  const stopAnim = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const cashoutSlot = useCallback(
    (i: 0 | 1, atMult: number) => {
      const s = slotsRef.current[i];
      if (s.status !== "active") return;
      const rawWon = Math.floor(s.amount * atMult * (1 - edge));
      credit(rawWon);
      const won = calcPayout(s.amount, atMult);
      const pnl = won - s.amount;
      setSlot(i, { status: "cashed", cashMult: atMult, payout: won });
      record({ pnl, multiplier: atMult });
      recordMyBet({ game: "crash", bet: s.amount, multiplier: atMult, payout: won });
      setSkyBadges((prev) => [
        ...prev.slice(-3),
        { id: Date.now() + i, label: `YOU +৳${won.toLocaleString()} @ ${atMult.toFixed(2)}×`, mult: atMult, createdAt: performance.now() },
      ]);
      fxRef.current?.burst({ count: 55, kind: "confetti", speed: 9 });
      try {
        sfxCashout();
      } catch {
        /* noop */
      }
    },
    [calcPayout, credit, edge, record, setSlot],
  );

  const beginBettingWindowRef = useRef<() => void>(() => {});

  const startFlying = useCallback(async () => {
    const activePf = pfRef.current;
    if (!activePf.ready) {
      beginBettingWindowRef.current();
      return;
    }

    // Debit queued bets ONLY right at takeoff so pre-takeoff cancels never create bogus win records
    const currentSlots = slotsRef.current;
    const activated: [Slot, Slot] = [{ ...currentSlots[0] }, { ...currentSlots[1] }];
    for (const i of [0, 1] as const) {
      if (activated[i].status === "queued") {
        if (placeBet(activated[i].amount)) {
          activated[i] = { ...activated[i], status: "active" };
        } else {
          activated[i] = { ...activated[i], status: "idle" };
        }
      }
    }
    setSlots(activated);
    slotsRef.current = activated;

    const target = await fairCrash(activePf.serverSeed, activePf.clientSeed, activePf.nonce, edge);
    targetRef.current = target;
    setCrashAt(null);
    setMult(1.0);
    setSkyBadges([]);
    setPhase("flying");
    startRef.current = performance.now();

    try {
      sfxTakeoff();
    } catch {
      /* noop */
    }

    const tick = (now: number) => {
      const t = (now - startRef.current) / 1000;
      const m = +Math.pow(1.06, t * 8).toFixed(2);

      for (const i of [0, 1] as const) {
        const s = slotsRef.current[i];
        if (s.status === "active" && s.autoEnabled && m >= s.auto && s.auto < target) {
          cashoutSlot(i, s.auto);
        }
      }

      if (m >= target) {
        setMult(target);
        setCrashAt(target);
        setPhase("crashed");
        setRecentCrashes((prev) => [target, ...prev].slice(0, 16));
        activePf.consume(`crash=${target}×`);
        pushMultiplierHistory("crash", target);

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

        fxRef.current?.burst({ count: 65, kind: "smoke", color: "#fb7185", speed: 6 });
        try {
          sfxBust();
        } catch {
          /* noop */
        }
        stopAnim();
        cycleTimerRef.current = setTimeout(() => beginBettingWindowRef.current(), POST_CRASH_MS);
        return;
      }

      setMult(m);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [cashoutSlot, edge, placeBet, record]);

  const beginBettingWindow = useCallback(() => {
    stopAnim();
    setPhase("waiting");
    setMult(1.0);
    setCrashAt(null);
    setCountdown(BETTING_WINDOW_MS / 1000);
    setSlots((prev) =>
      prev.map((s) =>
        s.status === "cashed" || s.status === "lost"
          ? { ...s, status: "idle", cashMult: undefined, payout: undefined }
          : s,
      ) as [Slot, Slot],
    );
    if (countdownRef.current) clearInterval(countdownRef.current);
    const start = Date.now();
    countdownRef.current = setInterval(() => {
      const left = Math.max(0, BETTING_WINDOW_MS - (Date.now() - start));
      setCountdown(+(left / 1000).toFixed(1));
      if (left <= 0) {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        void startFlying();
      }
    }, 100);
  }, [startFlying]);

  beginBettingWindowRef.current = beginBettingWindow;

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

  const queueBet = useCallback(
    (i: 0 | 1) => {
      const s = slotsRef.current[i];
      if (s.status === "queued" || s.status === "active") return;
      if (s.amount < minBet || s.amount > maxBet) {
        toast.error(`বাজি ৳${minBet}–৳${maxBet} এর মধ্যে রাখুন`);
        return;
      }
      const otherIdx = i === 0 ? 1 : 0;
      const otherQueued = slotsRef.current[otherIdx].status === "queued" ? slotsRef.current[otherIdx].amount : 0;
      if (s.amount + otherQueued > balanceRef.current) {
        toast.error("পর্যাপ্ত ব্যালেন্স নেই");
        return;
      }
      setSlot(i, { status: "queued" });
    },
    [maxBet, minBet, setSlot],
  );

  const cancelQueued = useCallback(
    (i: 0 | 1) => {
      if (slotsRef.current[i].status !== "queued") return;
      setSlot(i, { status: "idle" });
    },
    [setSlot],
  );

  const manualCashout = useCallback(
    (i: 0 | 1) => {
      if (phase !== "flying") return;
      cashoutSlot(i, mult);
    },
    [cashoutSlot, mult, phase],
  );

  // Spacebar triggers Slot 1 Bet / Cashout cleanly
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || fairOpen || notLoggedIn || noCoins || maintenance) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      const s0 = slotsRef.current[0];
      if (phase === "flying" && s0.status === "active") {
        cashoutSlot(0, mult);
      } else if (s0.status === "idle") {
        queueBet(0);
      } else if (s0.status === "queued") {
        cancelQueued(0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelQueued, cashoutSlot, fairOpen, maintenance, mult, noCoins, notLoggedIn, phase, queueBet]);

  const waitPct = Math.min(100, Math.max(0, (countdown / (BETTING_WINDOW_MS / 1000)) * 100));

  return (
    <SiteShell>
      <div
        className="min-h-[calc(100vh-110px)] px-3 py-4 text-white sm:px-5 lg:pr-16"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.28), transparent 55%), linear-gradient(180deg, #0b3b23 0%, #072919 55%, #04190f 100%)",
        }}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-3">
          {/* SLIM TOP BAR */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-400/25 bg-[#052113]/85 px-3.5 py-2.5 shadow-lg">
            <div className="flex items-center gap-2.5">
              <Link
                to="/esports"
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> লবি
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xl">✈️</span>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-amber-300">
                  Aviator Crash
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setFairOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/35 bg-emerald-500/20 px-2.5 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Fair
              </button>
              <button
                type="button"
                onClick={() => setMutedState(toggleMuted())}
                className="rounded-xl border border-white/15 bg-white/10 p-1.5 text-white hover:bg-white/20"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div className="flex items-center gap-1.5 rounded-xl border border-amber-300/40 bg-[#03140b] px-3 py-1.5">
                <Coins className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-black tabular-nums">৳{balance.toLocaleString()}</span>
                {userId && (
                  <button type="button" onClick={refresh} className="text-emerald-300 hover:text-amber-300" title="Refresh">
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>
              <Link
                to="/wallet"
                search={{ tab: "deposit" }}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 px-3 py-1.5 text-xs font-black text-black shadow hover:brightness-110"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> কয়েন
              </Link>
            </div>
          </div>

          {maintenance ? (
            <GuardCard
              icon={<Wrench className="h-10 w-10 text-amber-300" />}
              title="গেমটি মেইনটেন্যান্সে আছে"
              desc="অ্যাডমিন সাময়িকভাবে Crash বন্ধ রেখেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।"
            />
          ) : notLoggedIn ? (
            <GuardCard
              icon={<LogIn className="h-10 w-10 text-emerald-300" />}
              title="লগইন প্রয়োজন"
              desc="Aviator Crash খেলতে আপনার অ্যাকাউন্টে লগইন করুন।"
              cta={
                <div className="flex gap-3">
                  <Link to="/login" className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-black text-black hover:brightness-110">
                    লগইন করুন
                  </Link>
                  <Link to="/register" className="rounded-xl border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-black text-white hover:bg-white/20">
                    রেজিস্টার
                  </Link>
                </div>
              }
            />
          ) : noCoins ? (
            <GuardCard
              icon={<Coins className="h-10 w-10 text-amber-300" />}
              title="কয়েন নেই"
              desc="খেলতে হলে আগে অ্যাকাউন্টে কয়েন যোগ করুন।"
              cta={
                <Link to="/wallet" search={{ tab: "deposit" }} className="rounded-xl bg-amber-400 px-6 py-2.5 text-sm font-black text-black hover:brightness-110">
                  কয়েন কিনুন
                </Link>
              }
            />
          ) : (
            <>
              {/* ════════════════════════════════════════════════════════════════
                  TOP SECTION ("উপরে 60fps Aviator Sky Canvas")
                 ════════════════════════════════════════════════════════════════ */}
              <section
                className={`relative flex h-[285px] sm:h-[310px] flex-col justify-between overflow-hidden rounded-3xl border-2 p-3 sm:p-4 shadow-2xl transition-colors duration-300 ${
                  phase === "crashed"
                    ? "border-rose-400/70 animate-crash-shake"
                    : phase === "flying"
                      ? "border-emerald-300/60"
                      : "border-emerald-400/35"
                }`}
                style={{
                  background:
                    phase === "crashed"
                      ? "radial-gradient(circle at 50% 45%, rgba(225,29,72,0.34), rgba(18,16,24,0.95) 65%, #07110d 100%)"
                      : "radial-gradient(circle at 50% 35%, rgba(16,185,129,0.28), rgba(5,45,26,0.94) 65%, #03150c 100%)",
                }}
              >
                {/* Live Crash Multiplier History Pills */}
                <div className="relative z-20 flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#03190e]/80 px-3 py-1.5 backdrop-blur-sm">
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-200">
                    <span className={`h-2 w-2 rounded-full ${phase === "flying" ? "bg-emerald-400 animate-ping" : "bg-amber-300"}`} />
                    {phase === "waiting" ? `টেকঅফ ${countdown.toFixed(1)}s` : phase === "flying" ? "উড়ছে" : "ক্র্যাশ"}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {recentCrashes.length === 0 ? (
                      <span className="text-[11px] text-white/45">রাউন্ড রেজাল্ট এখানে দেখাবে…</span>
                    ) : (
                      recentCrashes.map((m, idx) => (
                        <span
                          key={`${m}-${idx}`}
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black tabular-nums ${
                            m >= 10
                              ? "bg-purple-500 text-white"
                              : m >= 2
                                ? "bg-emerald-400 text-[#022010]"
                                : "bg-rose-500/80 text-white"
                          } ${idx === 0 ? "ring-2 ring-amber-300" : "opacity-85"}`}
                        >
                          {m.toFixed(2)}×
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* 60fps Custom Flight & Jet Canvas */}
                <AviatorCanvas multiplier={mult} phase={phase} badges={skyBadges} />

                {/* Center Multiplier / Countdown HUD */}
                <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
                  {phase === "waiting" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative grid h-24 w-24 place-items-center rounded-full border-4 border-white/15 bg-[#041f12]/80 shadow-xl">
                        <svg className="absolute inset-0 -rotate-90 h-full w-full" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="44"
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="6"
                            strokeDasharray="276.46"
                            strokeDashoffset={276.46 * (1 - waitPct / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="text-center">
                          <div className="text-2xl font-black tabular-nums text-amber-300">
                            {countdown.toFixed(1)}s
                          </div>
                        </div>
                      </div>
                      <div className="rounded-full bg-black/45 px-4 py-1 text-xs font-black uppercase tracking-widest text-emerald-200">
                        পরবর্তী ফ্লাইটের জন্য বাজি রাখুন
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`text-6xl sm:text-7xl font-black tracking-tight tabular-nums drop-shadow-[0_4px_24px_rgba(0,0,0,0.75)] ${
                          phase === "crashed"
                            ? "text-rose-400"
                            : mult >= 10
                              ? "text-purple-300"
                              : mult >= 2
                                ? "text-amber-300"
                                : "text-emerald-300"
                        }`}
                      >
                        {mult.toFixed(2)}
                        <span className="text-3xl sm:text-4xl">×</span>
                      </div>
                      {phase === "crashed" ? (
                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg">
                          💥 FLEW AWAY @ {crashAt?.toFixed(2)}×
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-0.5 text-[11px] font-black uppercase tracking-widest text-emerald-200">
                          <Plane className="h-3.5 w-3.5 text-amber-300" /> ক্যাশআউট করতে বাটনে চাপুন
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <ParticleLayer ref={fxRef} />
              </section>

              {/* ════════════════════════════════════════════════════════════════
                  BOTTOM SECTION ("নিচে ডুয়াল স্প্রাইব এভিয়েটর বেট কন্ট্রোলস")
                 ════════════════════════════════════════════════════════════════ */}
              <section className="grid gap-3 md:grid-cols-2">
                {([0, 1] as const).map((idx) => (
                  <BetSlotCard
                    key={idx}
                    label={`বাজি ${idx + 1}`}
                    slot={slots[idx]}
                    phase={phase}
                    currentMult={mult}
                    minBet={minBet}
                    maxBet={maxBet}
                    potential={calcPayout(slots[idx].amount, mult)}
                    disabled={!pf.ready}
                    onAmount={(a) => setSlot(idx, { amount: Math.max(minBet, Math.min(maxBet, Math.round(a) || minBet)) })}
                    onAuto={(a) => setSlot(idx, { auto: Math.max(1.01, Math.min(1000, +a.toFixed(2))) })}
                    onToggleAuto={() => setSlot(idx, { autoEnabled: !slots[idx].autoEnabled })}
                    onQueue={() => queueBet(idx)}
                    onCancel={() => cancelQueued(idx)}
                    onCashout={() => manualCashout(idx)}
                  />
                ))}
              </section>

              {/* COMPACT LIVE BETS & MY BETS BELOW */}
              <section className="rounded-3xl border border-white/15 bg-[#041b0f]/85 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFeedTab("live")}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black ${
                        feedTab === "live" ? "bg-emerald-400 text-black" : "bg-white/10 text-white/80"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5" /> লাইভ বেট
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedTab("history")}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black ${
                        feedTab === "history" ? "bg-amber-400 text-black" : "bg-white/10 text-white/80"
                      }`}
                    >
                      <History className="h-3.5 w-3.5" /> আমার বেট
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-100/70">Bets: <strong className="text-white">{stats.bets}</strong></span>
                    <span className={`font-black ${stats.net >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
                      {stats.net >= 0 ? `+৳${stats.net.toLocaleString()}` : `-৳${Math.abs(stats.net).toLocaleString()}`}
                    </span>
                    {stats.bets > 0 && (
                      <button type="button" onClick={resetStats} className="text-[11px] text-white/50 hover:text-white">
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {feedTab === "history" ? (
                  <div className="max-h-48 overflow-y-auto">
                    {crashHistory.length === 0 ? (
                      <div className="py-6 text-center text-xs text-white/50">এখনও কোনো Aviator বেট নেই</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-white/50">
                          <tr>
                            <th className="py-1.5 text-left">Bet</th>
                            <th className="py-1.5 text-right">Cashout</th>
                            <th className="py-1.5 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crashHistory.map((h) => {
                            const won = h.payout > 0;
                            return (
                              <tr key={h.id} className="border-t border-white/10">
                                <td className="py-1.5 font-mono">৳{h.bet}</td>
                                <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-white/40"}`}>
                                  {h.multiplier > 0 ? `${h.multiplier.toFixed(2)}×` : "Bust"}
                                </td>
                                <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-rose-400"}`}>
                                  {won ? `+৳${h.payout}` : `-৳${h.bet}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="text-white/50">
                        <tr>
                          <th className="py-1.5 text-left">Player</th>
                          <th className="py-1.5 text-right">Bet</th>
                          <th className="py-1.5 text-right">Mult</th>
                          <th className="py-1.5 text-right">Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveBets.slice(0, 12).map((b) => {
                          const won = b.payout > 0;
                          return (
                            <tr key={b.id} className={`border-t border-white/10 ${b.isMe ? "bg-amber-400/15" : ""}`}>
                              <td className="py-1.5 font-mono">
                                {b.isMe && <span className="mr-1 rounded bg-amber-400 px-1 text-[9px] font-black text-black">YOU</span>}
                                {b.user}
                              </td>
                              <td className="py-1.5 text-right font-mono">৳{b.bet}</td>
                              <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-white/40"}`}>
                                {b.multiplier > 0 ? `${b.multiplier}×` : "—"}
                              </td>
                              <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-rose-400"}`}>
                                {won ? `+৳${b.payout}` : `-৳${b.bet}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* PROVABLY FAIR MODAL */}
        {fairOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setFairOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-emerald-400/40 bg-[#062415] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sm font-black uppercase text-emerald-300">
                  <Activity className="h-4 w-4" /> Provably Fair — Aviator Crash
                </div>
                <button type="button" onClick={() => setFairOpen(false)} className="rounded-lg bg-white/10 p-1 text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProvablyFairPanel pf={pf} gameKey="crash" />
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function BetSlotCard({
  label,
  slot,
  phase,
  minBet,
  maxBet,
  potential,
  disabled,
  onAmount,
  onAuto,
  onToggleAuto,
  onQueue,
  onCancel,
  onCashout,
}: {
  label: string;
  slot: Slot;
  phase: Phase;
  currentMult: number;
  minBet: number;
  maxBet: number;
  potential: number;
  disabled: boolean;
  onAmount: (n: number) => void;
  onAuto: (n: number) => void;
  onToggleAuto: () => void;
  onQueue: () => void;
  onCancel: () => void;
  onCashout: () => void;
}) {
  const canCashout = phase === "flying" && slot.status === "active";
  const isQueued = slot.status === "queued";
  const locked = isQueued || canCashout;

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-3xl border p-4 shadow-xl transition-all ${
        canCashout
          ? "border-amber-300 bg-[#083820]"
          : isQueued
            ? "border-amber-400/50 bg-[#062b19]"
            : slot.status === "cashed"
              ? "border-emerald-400/60 bg-[#052a18]"
              : "border-emerald-400/25 bg-[#052314]/90"
      }`}
    >
      {/* Header + Status Pill */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-amber-300">{label}</span>
        {slot.status === "cashed" && (
          <span className="rounded-full bg-emerald-400 px-2.5 py-0.5 text-[11px] font-black text-[#022010]">
            +৳{slot.payout?.toLocaleString()} @ {slot.cashMult?.toFixed(2)}×
          </span>
        )}
        {slot.status === "lost" && (
          <span className="rounded-full bg-rose-500/85 px-2.5 py-0.5 text-[11px] font-black text-white">
            বাস্ট -৳{slot.amount}
          </span>
        )}
        {isQueued && (
          <span className="rounded-full bg-amber-400/20 border border-amber-300/40 px-2.5 py-0.5 text-[10px] font-black text-amber-200 animate-pulse">
            টেকঅফের জন্য প্রস্তুত
          </span>
        )}
      </div>

      {/* Main Controls Row: Left Inputs + Right Big Button */}
      <div className="grid gap-2.5 sm:grid-cols-12 sm:items-stretch">
        <div className="flex flex-col gap-2 sm:col-span-7">
          {/* Bet Stepper */}
          <div className="flex items-center gap-1 rounded-xl border border-white/20 bg-[#03160c] p-1">
            <button
              type="button"
              disabled={locked}
              onClick={() => onAmount(Math.floor(slot.amount / 2))}
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              min={minBet}
              max={maxBet}
              value={slot.amount}
              disabled={locked}
              onChange={(e) => onAmount(Number(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-center text-base font-black tabular-nums text-white outline-none disabled:opacity-60"
            />
            <button
              type="button"
              disabled={locked}
              onClick={() => onAmount(slot.amount * 2)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white hover:bg-white/20 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quick Chips */}
          <div className="flex flex-wrap gap-1">
            {QUICK_CHIPS.map((c) => {
              const val = Math.max(minBet, Math.min(maxBet, c));
              return (
                <button
                  key={c}
                  type="button"
                  disabled={locked}
                  onClick={() => onAmount(val)}
                  className={`flex-1 rounded-lg border px-1.5 py-1 text-[11px] font-black transition disabled:opacity-40 ${
                    slot.amount === val
                      ? "border-amber-300 bg-amber-400 text-black"
                      : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  ৳{c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Action Button */}
        <div className="flex sm:col-span-5">
          {canCashout ? (
            <button
              type="button"
              onClick={onCashout}
              className="flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 p-3 text-black shadow-[0_5px_0_0_#92400e] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">CASHOUT</span>
              <span className="text-lg font-black tabular-nums">৳{potential.toLocaleString()}</span>
            </button>
          ) : isQueued ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-rose-400/50 bg-rose-500/20 p-3 text-rose-200 transition hover:bg-rose-500/30"
            >
              <span className="text-xs font-black uppercase">বাতিল করুন</span>
              <span className="text-[11px] font-bold">৳{slot.amount}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || (slot.status !== "idle" && slot.status !== "cashed" && slot.status !== "lost")}
              onClick={onQueue}
              className="flex w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 p-3 text-[#021a0e] shadow-[0_5px_0_0_#065f46] transition hover:brightness-110 active:translate-y-1 active:shadow-none disabled:opacity-45"
            >
              <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
                {phase === "flying" ? "পরবর্তী রাউন্ড" : "বাজি ধরুন"}
              </span>
              <span className="text-lg font-black tabular-nums">৳{slot.amount.toLocaleString()}</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto Cashout Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2">
        <label className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 cursor-pointer">
          <input
            type="checkbox"
            checked={slot.autoEnabled}
            disabled={canCashout}
            onChange={onToggleAuto}
            className="h-3.5 w-3.5 accent-amber-400"
          />
          <Bot className="h-3.5 w-3.5 text-amber-300" /> Auto Cashout
        </label>

        <div className="flex items-center gap-1">
          {AUTO_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={canCashout}
              onClick={() => {
                onAuto(p);
                if (!slot.autoEnabled) onToggleAuto();
              }}
              className={`rounded-md border px-2 py-0.5 text-[10px] font-black ${
                slot.autoEnabled && slot.auto === p
                  ? "border-amber-300 bg-amber-400 text-black"
                  : "border-white/15 bg-white/10 text-white/75 hover:text-white"
              }`}
            >
              {p}×
            </button>
          ))}
          <input
            type="number"
            step="0.1"
            min={1.01}
            value={slot.auto}
            disabled={!slot.autoEnabled || canCashout}
            onChange={(e) => onAuto(Number(e.target.value) || 1.01)}
            className="ml-1 w-16 rounded-lg border border-white/15 bg-[#03160c] px-2 py-1 text-center text-xs font-black tabular-nums text-amber-300 outline-none disabled:opacity-40"
          />
        </div>
      </div>
    </div>
  );
}

function GuardCard({
  icon,
  title,
  desc,
  cta,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  cta?: ReactNode;
}) {
  return (
    <div className="mx-auto mt-8 flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-emerald-400/35 bg-[#052113]/90 p-10 text-center shadow-2xl">
      <div className="grid h-18 w-18 place-items-center rounded-2xl border border-amber-300/35 bg-amber-400/15">
        {icon}
      </div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-sm text-emerald-100/80">{desc}</p>
      {cta}
    </div>
  );
}
