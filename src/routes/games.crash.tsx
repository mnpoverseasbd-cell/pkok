import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Coins,
  LogIn,
  Menu,
  MessageSquare,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { AviatorCanvas, type SkyCashoutBadge } from "@/components/games/fx/AviatorCanvas";
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
      { title: "Aviator — Asik Game" },
      { name: "description", content: "Spribe Aviator — বাজি ধরুন, বিমান উড়ার সাথে ক্যাশআউট করুন।" },
    ],
  }),
  component: AviatorCrashPage,
});

type Phase = "waiting" | "flying" | "crashed";
type SlotStatus = "idle" | "queued" | "active" | "cashed" | "lost";
type LeftTab = "all" | "previous" | "top";

interface Slot {
  mode: "bet" | "auto";
  amount: number;
  auto: number;
  autoBet: boolean;
  autoCashout: boolean;
  status: SlotStatus;
  cashMult?: number;
  payout?: number;
}

const BETTING_WINDOW_MS = 4000;
const POST_CRASH_MS = 2200;
const QUICK_AMOUNTS = [100, 200, 500, 10000];

const INITIAL_CHAT = [
  { id: 1, user: "f***d", time: "11:49:43", msg: "Good luck all ✈️" },
  { id: 2, user: "w***1", time: "11:49:45", msg: "18.21x dhorse vai ajke!" },
  { id: 3, user: "b***4", time: "11:49:50", msg: "4.03k cashout @ 1.68x 💰" },
];

/** Exact Spribe v4.2 color tiers */
function multPillStyle(m: number) {
  if (m >= 10) return "text-[#c017b4] border-[#c017b4]/35 bg-[#1b101b]";
  if (m >= 2) return "text-[#913ef8] border-[#913ef8]/35 bg-[#191326]";
  return "text-[#34b4ff] border-[#34b4ff]/30 bg-[#0d1924]";
}

function AviatorCrashPage() {
  const { balance, bet: placeBet, credit, refresh, userId, loading: walletLoading } = useDemoWallet();
  const { data: cfg, isLoading: cfgLoading } = useGameConfig("crash");
  const { record } = useGameStats("crash");
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
  const [recentCrashes, setRecentCrashes] = useState<number[]>([
    2.64, 1.66, 1.59, 11.6, 18.21, 1.02, 1.03, 1.68, 1.41, 1.12, 1.0, 11.05, 2.75, 4.33, 1.45, 5.61, 2.4, 15.31,
  ]);
  const [skyBadges, setSkyBadges] = useState<SkyCashoutBadge[]>([]);
  const [muted, setMutedState] = useState(() => isMuted());
  const [animationsOn, setAnimationsOn] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [fairOpen, setFairOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showSecondSlot, setShowSecondSlot] = useState(true);
  const [chatDraft, setChatDraft] = useState("");
  const [chatList, setChatList] = useState(INITIAL_CHAT);
  const [leftTab, setLeftTab] = useState<LeftTab>("all");
  const [topFilter, setTopFilter] = useState<"x" | "win">("x");
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [myHistory, setMyHistory] = useState<BetHistoryEntry[]>([]);

  const [slots, setSlots] = useState<[Slot, Slot]>([
    { mode: "bet", amount: Math.max(minBet, 10), auto: 2.0, autoBet: false, autoCashout: false, status: "idle" },
    { mode: "bet", amount: Math.max(minBet, 10), auto: 2.0, autoBet: false, autoCashout: false, status: "idle" },
  ]);

  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  const balanceRef = useRef(balance);
  balanceRef.current = balance;
  const pfRef = useRef(pf);
  pfRef.current = pf;
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => subscribeLiveBets(setLiveBets), []);
  useEffect(() => subscribeBetHistory(setMyHistory), []);

  const crashHistory = useMemo(
    () => myHistory.filter((h) => h.game === "crash").slice(0, 20),
    [myHistory],
  );

  const topBets = useMemo(
    () =>
      [...liveBets]
        .sort((a, b) => (topFilter === "x" ? b.multiplier - a.multiplier : b.payout - a.payout))
        .slice(0, 15),
    [liveBets, topFilter],
  );

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
      try {
        sfxCashout();
      } catch {
        /* noop */
      }
    },
    [calcPayout, credit, edge, record, setSlot],
  );

  const beginBettingWindowRef = useRef<() => void>(() => {});
  const startFlyingRef = useRef<() => Promise<void>>(async () => {});

  const startFlying = useCallback(async () => {
    const activePf = pfRef.current;

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

    let target = 2.15;
    try {
      if (activePf.ready && activePf.serverSeed && activePf.clientSeed) {
        const computed = await fairCrash(activePf.serverSeed, activePf.clientSeed, activePf.nonce, edge);
        if (Number.isFinite(computed) && computed >= 1) {
          target = computed;
        }
      } else {
        const u = Math.max(0.01, Math.random());
        target = +Math.max(1.08, Math.min(50, (1 - edge) / u)).toFixed(2);
      }
    } catch {
      const u = Math.max(0.01, Math.random());
      target = +Math.max(1.08, Math.min(50, (1 - edge) / u)).toFixed(2);
    }

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
      const t = Math.max(0, (now - startRef.current) / 1000);
      const m = +Math.exp(0.15 * t).toFixed(2);

      for (const i of [0, 1] as const) {
        const s = slotsRef.current[i];
        if (s.status === "active" && s.autoCashout && m >= s.auto && s.auto < target) {
          cashoutSlot(i, s.auto);
        }
      }

      if (m >= target) {
        setMult(target);
        setCrashAt(target);
        setPhase("crashed");
        setRecentCrashes((prev) => [target, ...prev].slice(0, 32));
        if (activePf.ready) activePf.consume(`crash=${target}×`);
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

    setSlots((prev) => {
      const next = prev.map((s) =>
        s.status === "cashed" || s.status === "lost"
          ? { ...s, status: "idle" as SlotStatus, cashMult: undefined, payout: undefined }
          : s,
      ) as [Slot, Slot];

      // Auto-bet re-queues enabled slots if balance suffices
      let runningReserve =
        (next[0].status === "queued" ? next[0].amount : 0) +
        (next[1].status === "queued" ? next[1].amount : 0);

      for (const i of [0, 1] as const) {
        if (next[i].autoBet && next[i].status === "idle") {
          if (runningReserve + next[i].amount <= balanceRef.current && next[i].amount >= minBet && next[i].amount <= maxBet) {
            next[i] = { ...next[i], status: "queued" };
            runningReserve += next[i].amount;
          }
        }
      }
      return next;
    });

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
        void startFlyingRef.current();
      }
    }, 100);
  }, [maxBet, minBet]);

  beginBettingWindowRef.current = beginBettingWindow;
  startFlyingRef.current = startFlying;

  useEffect(() => {
    beginBettingWindowRef.current();
    return () => {
      stopAnim();
      if (cycleTimerRef.current) {
        clearTimeout(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  const queueBet = useCallback(
    (i: 0 | 1) => {
      const s = slotsRef.current[i];
      if (s.status === "queued" || s.status === "active") return;
      if (s.amount < minBet || s.amount > maxBet) {
        toast.error(`Bet must be ৳${minBet}–৳${maxBet}`);
        return;
      }
      const otherIdx = i === 0 ? 1 : 0;
      const otherQueued = slotsRef.current[otherIdx].status === "queued" ? slotsRef.current[otherIdx].amount : 0;
      if (s.amount + otherQueued > balanceRef.current) {
        toast.error("Insufficient balance");
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || fairOpen || notLoggedIn || noCoins || maintenance) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      const s0 = slotsRef.current[0];
      if (phase === "flying" && s0.status === "active") cashoutSlot(0, mult);
      else if (s0.status === "queued") cancelQueued(0);
      else if (s0.status !== "active") queueBet(0);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cancelQueued, cashoutSlot, fairOpen, maintenance, mult, noCoins, notLoggedIn, phase, queueBet]);

  function sendChat(e: FormEvent) {
    e.preventDefault();
    const txt = chatDraft.trim();
    if (!txt) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    setChatList((prev) => [...prev.slice(-24), { id: Date.now(), user: "You", time, msg: txt }]);
    setChatDraft("");
  }

  const totalPool = useMemo(
    () => liveBets.slice(0, 12).reduce((acc, b) => acc + (b.payout > 0 ? b.payout : b.bet), 0),
    [liveBets],
  );

  const activePlayersCount = 1094 + (recentCrashes.length % 47);

  return (
    <SiteShell>
      {/* Spribe Aviator exact #0e0e0e charcoal backdrop */}
      <div className="min-h-[calc(100vh-105px)] bg-[#0e0e0e] text-[#e5e7eb] lg:pr-14">
        {/* SPRIBE 40PX HEADER */}
        <div className="relative z-30 flex h-[42px] items-center justify-between border-b border-white/5 bg-[#141516] px-3 sm:px-4">
          <div className="flex items-center gap-3">
            <Link
              to="/esports"
              className="inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Lobby
            </Link>
            <span className="font-display text-xl font-black italic tracking-tight text-[#e50539]">
              Aviator
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tabular-nums text-[#28a909]">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-bold text-slate-400">BDT</span>
              {userId && (
                <button type="button" onClick={refresh} className="text-slate-400 hover:text-white" title="Refresh balance">
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>

            <Link
              to="/wallet"
              search={{ tab: "deposit" }}
              className="hidden sm:inline-flex rounded-full bg-[#28a909] px-2.5 py-0.5 text-[11px] font-black text-white hover:brightness-110"
            >
              + Deposit
            </Link>

            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className={`rounded-md p-1.5 transition ${chatOpen ? "bg-[#e50539] text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"}`}
              title="Toggle Chat"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="rounded-md p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
                title="Menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-9 z-50 w-56 rounded-xl border border-white/10 bg-[#1b1c1d] p-2 shadow-2xl text-xs">
                  <button
                    type="button"
                    onClick={() => setMutedState(toggleMuted())}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5"
                  >
                    <span className="inline-flex items-center gap-2">
                      {muted ? <VolumeX className="h-3.5 w-3.5 text-slate-400" /> : <Volume2 className="h-3.5 w-3.5 text-[#28a909]" />}
                      Sound
                    </span>
                    <span className={`text-[10px] font-bold ${muted ? "text-slate-500" : "text-[#28a909]"}`}>{muted ? "OFF" : "ON"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnimationsOn((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-white/5"
                  >
                    <span>Animation</span>
                    <span className={`text-[10px] font-bold ${animationsOn ? "text-[#28a909]" : "text-slate-500"}`}>{animationsOn ? "ON" : "OFF"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      setFairOpen(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 text-emerald-400"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Provably Fair Settings
                  </button>
                  <Link
                    to="/wallet"
                    search={{ tab: "deposit" }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/5 text-amber-300"
                  >
                    <Coins className="h-3.5 w-3.5" /> Deposit Coins
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {maintenance ? (
          <AviatorGuard
            icon={<Wrench className="h-10 w-10 text-amber-400" />}
            title="Game Under Maintenance"
            desc="Admin has temporarily paused Aviator. Please check back shortly."
          />
        ) : notLoggedIn ? (
          <AviatorGuard
            icon={<LogIn className="h-10 w-10 text-[#28a909]" />}
            title="Login Required"
            desc="Please sign in to place bets in Aviator."
            cta={
              <div className="flex gap-3">
                <Link to="/login" className="rounded-xl bg-[#28a909] px-6 py-2.5 text-sm font-black text-white">লগইন করুন</Link>
                <Link to="/register" className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-black text-white">রেজিস্টার</Link>
              </div>
            }
          />
        ) : noCoins ? (
          <AviatorGuard
            icon={<Coins className="h-10 w-10 text-amber-400" />}
            title="Insufficient Coins"
            desc="Deposit coins to play Aviator."
            cta={<Link to="/wallet" search={{ tab: "deposit" }} className="rounded-xl bg-[#28a909] px-6 py-2.5 text-sm font-black text-white">কয়েন কিনুন</Link>}
          />
        ) : (
          /* SPRIBE AVIATOR 2-COLUMN (OR 3-COLUMN WITH CHAT OPEN) */
          <div className="mx-auto grid max-w-[1440px] gap-1.5 p-1.5 lg:grid-cols-12">
            {/* LEFT SIDEBAR: All Bets | Previous | Top (3 cols on lg, drops below on mobile) */}
            <aside className="order-2 flex flex-col justify-between rounded-[10px] bg-[#1b1c1d] p-2.5 lg:order-1 lg:col-span-4 xl:col-span-3 lg:h-[620px]">
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="grid grid-cols-3 gap-1 rounded-full bg-[#141516] p-0.5 text-[11px] font-bold">
                  {(["all", "previous", "top"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLeftTab(t)}
                      className={`rounded-full py-1 capitalize transition ${
                        leftTab === t ? "bg-[#2c2d30] text-white" : "text-[#8e9093] hover:text-white"
                      }`}
                    >
                      {t === "all" ? "All Bets" : t === "previous" ? "Previous" : "Top"}
                    </button>
                  ))}
                </div>

                {leftTab === "top" ? (
                  <div className="mt-2 flex gap-1 rounded-full bg-[#141516] p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setTopFilter("x")}
                      className={`flex-1 rounded-full py-1 ${topFilter === "x" ? "bg-[#2c2d30] text-white" : "text-[#8e9093]"}`}
                    >
                      X
                    </button>
                    <button
                      type="button"
                      onClick={() => setTopFilter("win")}
                      className={`flex-1 rounded-full py-1 ${topFilter === "win" ? "bg-[#2c2d30] text-white" : "text-[#8e9093]"}`}
                    >
                      Win
                    </button>
                  </div>
                ) : leftTab === "previous" ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-[#141516] px-3 py-1.5 text-xs">
                    <span className="text-[#8e9093]">Round Result</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-black ${multPillStyle(recentCrashes[0] ?? 1.5)}`}>
                      {(recentCrashes[0] ?? 1.5).toFixed(2)}x
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 border-b border-white/5 pb-2 px-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex -space-x-1.5">
                          <span className="h-5 w-5 rounded-full bg-[#28a909] ring-2 ring-[#1b1c1d]" />
                          <span className="h-5 w-5 rounded-full bg-[#e50539] ring-2 ring-[#1b1c1d]" />
                          <span className="h-5 w-5 rounded-full bg-amber-400 ring-2 ring-[#1b1c1d]" />
                        </div>
                        <div className="mt-1 text-[11px] font-bold text-white">
                          {liveBets.length}/{activePlayersCount} <span className="font-normal text-[#8e9093]">Bets</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black tabular-nums text-white">
                          {totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-[#8e9093]">Total win BDT</div>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#141516]">
                      <div className="h-full w-1/3 rounded-full bg-[#28a909]" />
                    </div>
                  </div>
                )}

                <div className="mt-2 grid grid-cols-12 px-2 text-[10px] font-bold text-[#8e9093]">
                  <span className="col-span-4">Player</span>
                  <span className="col-span-3 text-right">Bet BDT</span>
                  <span className="col-span-2 text-center">X</span>
                  <span className="col-span-3 text-right">Win BDT</span>
                </div>

                <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-0.5">
                  {leftTab === "previous" && crashHistory.length > 0
                    ? crashHistory.map((h) => {
                        const won = h.payout > 0;
                        return (
                          <div
                            key={h.id}
                            className={`grid grid-cols-12 items-center rounded-lg px-2 py-1.5 text-[11px] ${
                              won ? "border border-[#28a909]/40 bg-[#122710]" : "bg-[#141516]"
                            }`}
                          >
                            <span className="col-span-4 font-bold text-amber-300 truncate">You</span>
                            <span className="col-span-3 text-right tabular-nums">{h.bet.toFixed(2)}</span>
                            <span className="col-span-2 text-center">
                              {h.multiplier > 0 ? (
                                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black ${multPillStyle(h.multiplier)}`}>
                                  {h.multiplier.toFixed(2)}x
                                </span>
                              ) : (
                                "—"
                              )}
                            </span>
                            <span className={`col-span-3 text-right font-bold tabular-nums ${won ? "text-[#28a909]" : "text-[#8e9093]"}`}>
                              {won ? h.payout.toFixed(2) : "0.00"}
                            </span>
                          </div>
                        );
                      })
                    : (leftTab === "top" ? topBets : liveBets.slice(0, 22)).map((b) => {
                        const won = b.payout > 0;
                        return (
                          <div
                            key={b.id}
                            className={`grid grid-cols-12 items-center rounded-lg px-2 py-1.5 text-[11px] ${
                              won ? "border border-[#28a909]/35 bg-[#122710]" : "bg-[#141516]"
                            }`}
                          >
                            <span className="col-span-4 truncate font-semibold text-slate-200">
                              {b.isMe ? <span className="font-black text-amber-300">YOU</span> : b.user}
                            </span>
                            <span className="col-span-3 text-right tabular-nums text-slate-300">
                              {b.bet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span className="col-span-2 text-center">
                              {b.multiplier > 0 ? (
                                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-black ${multPillStyle(b.multiplier)}`}>
                                  {b.multiplier.toFixed(2)}x
                                </span>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </span>
                            <span className={`col-span-3 text-right font-bold tabular-nums ${won ? "text-[#4be125]" : "text-[#8e9093]"}`}>
                              {won ? b.payout.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                            </span>
                          </div>
                        );
                      })}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-[#8e9093]">
                <button type="button" onClick={() => setFairOpen(true)} className="inline-flex items-center gap-1 hover:text-[#4be125]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#28a909]" /> Provably Fair Game
                </button>
                <span className="font-bold">Powered by PKOK</span>
              </div>
            </aside>

            {/* RIGHT MAIN AREA (Wide Canvas + Dual Bet Boxes, OR shrinks only if user opens Chat) */}
            <div className={`order-1 flex flex-col gap-1.5 lg:order-2 ${chatOpen ? "lg:col-span-8 xl:col-span-6" : "lg:col-span-8 xl:col-span-9"}`}>
              {/* Multiplier History Strip + '...' Expand Dropdown */}
              <div className="relative flex items-center justify-between gap-2 rounded-[10px] bg-[#141516] px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {recentCrashes.slice(0, 18).map((m, idx) => (
                    <span
                      key={`${m}-${idx}`}
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black tabular-nums ${multPillStyle(m)} ${
                        idx === 0 ? "ring-1 ring-white/30" : ""
                      }`}
                    >
                      {m.toFixed(2)}x
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen((o) => !o)}
                  className="grid h-6 w-7 shrink-0 place-items-center rounded-full bg-[#2c2d30] text-slate-300 hover:text-white"
                  title="Round History"
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>

                {historyOpen && (
                  <div className="absolute inset-x-0 top-10 z-30 rounded-xl border border-white/15 bg-[#1b1c1d] p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-300">
                      <span>ROUND HISTORY</span>
                      <button type="button" onClick={() => setHistoryOpen(false)} className="rounded bg-white/10 p-1 text-white">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentCrashes.map((m, i) => (
                        <span key={`${m}-${i}`} className={`rounded-full border px-2.5 py-0.5 text-[11px] font-black tabular-nums ${multPillStyle(m)}`}>
                          {m.toFixed(2)}x
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* MAIN BLACK FLIGHT STAGE */}
              <div className="relative h-[300px] sm:h-[385px] overflow-hidden rounded-[12px] border border-white/5 bg-black">
                <AviatorCanvas multiplier={mult} phase={phase} badges={skyBadges} animationsEnabled={animationsOn} />

                {/* Center Waiting / Flying / Flew Away HUD */}
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                  {phase === "waiting" ? (
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="flex items-center gap-2 text-lg sm:text-xl font-black tracking-wide text-white">
                        <span className="text-slate-300">PKOK</span>
                        <span className="text-slate-500">|</span>
                        <span className="font-display italic text-[#e50539]">Aviator</span>
                      </div>
                      <div className="h-2 w-52 overflow-hidden rounded-full bg-[#333538]">
                        <div
                          className="h-full rounded-full bg-[#d90429] transition-all duration-100"
                          style={{ width: `${Math.min(100, (countdown / (BETTING_WINDOW_MS / 1000)) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">
                        WAITING FOR NEXT ROUND · <span className="tabular-nums text-white">{countdown.toFixed(1)}s</span>
                      </div>
                      <div className="mt-1 inline-flex items-center gap-1.5 rounded-xl border border-[#4e7c31] bg-[#121810] px-3 py-1 text-[10px] font-bold text-slate-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#4be125]" />
                        <span>Official Game</span>
                        <span className="text-[#8e9093]">· Studio</span>
                      </div>
                    </div>
                  ) : phase === "crashed" ? (
                    <div className="flex flex-col items-center">
                      <div className="text-xl sm:text-2xl font-black uppercase tracking-widest text-white">
                        FLEW AWAY!
                      </div>
                      <div className="mt-1 text-6xl sm:text-7xl font-black tracking-tight tabular-nums text-[#e50539]">
                        {crashAt?.toFixed(2)}x
                      </div>
                    </div>
                  ) : (
                    <div className="text-6xl sm:text-8xl font-black tracking-tight tabular-nums text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                      {mult.toFixed(2)}x
                    </div>
                  )}
                </div>

                {/* Bottom-Right Active Players Pill */}
                <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white">
                  <span className="flex -space-x-1">
                    <span className="h-4 w-4 rounded-full bg-sky-400 ring-1 ring-black" />
                    <span className="h-4 w-4 rounded-full bg-[#e50539] ring-1 ring-black" />
                    <span className="h-4 w-4 rounded-full bg-[#28a909] ring-1 ring-black" />
                  </span>
                  <span>{activePlayersCount.toLocaleString()}</span>
                </div>
              </div>

              {/* DUAL SPRIBE BET / AUTO BOXES */}
              <div className={`grid gap-1.5 ${showSecondSlot ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                <SpribeBetBox
                  slot={slots[0]}
                  phase={phase}
                  minBet={minBet}
                  maxBet={maxBet}
                  potential={calcPayout(slots[0].amount, mult)}
                  disabled={!pf.ready}
                  showExpandBtn={!showSecondSlot}
                  onExpandToggle={() => setShowSecondSlot((v) => !v)}
                  onMode={(mode) => setSlot(0, { mode })}
                  onAmount={(a) => setSlot(0, { amount: Math.max(minBet, Math.min(maxBet, Math.round(a) || minBet)) })}
                  onAuto={(a) => setSlot(0, { auto: Math.max(1.01, Math.min(1000, +a.toFixed(2))) })}
                  onToggleAutoBet={() => setSlot(0, { autoBet: !slots[0].autoBet })}
                  onToggleAutoCashout={() => setSlot(0, { autoCashout: !slots[0].autoCashout })}
                  onQueue={() => queueBet(0)}
                  onCancel={() => cancelQueued(0)}
                  onCashout={() => manualCashout(0)}
                />
                {showSecondSlot && (
                  <SpribeBetBox
                    slot={slots[1]}
                    phase={phase}
                    minBet={minBet}
                    maxBet={maxBet}
                    potential={calcPayout(slots[1].amount, mult)}
                    disabled={!pf.ready}
                    showCollapseBtn
                    onExpandToggle={() => setShowSecondSlot(false)}
                    onMode={(mode) => setSlot(1, { mode })}
                    onAmount={(a) => setSlot(1, { amount: Math.max(minBet, Math.min(maxBet, Math.round(a) || minBet)) })}
                    onAuto={(a) => setSlot(1, { auto: Math.max(1.01, Math.min(1000, +a.toFixed(2))) })}
                    onToggleAutoBet={() => setSlot(1, { autoBet: !slots[1].autoBet })}
                    onToggleAutoCashout={() => setSlot(1, { autoCashout: !slots[1].autoCashout })}
                    onQueue={() => queueBet(1)}
                    onCancel={() => cancelQueued(1)}
                    onCashout={() => manualCashout(1)}
                  />
                )}
              </div>
            </div>

            {/* OPTIONAL COLLAPSIBLE LIVE CHAT SIDEBAR (xl only when toggled open) */}
            {chatOpen && (
              <aside className="order-3 hidden xl:flex xl:col-span-3 flex-col justify-between rounded-[10px] bg-[#1b1c1d] p-2.5 h-[620px]">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 px-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4be125]">
                    <span className="h-2 w-2 rounded-full bg-[#4be125]" /> Online: {3600 + (recentCrashes.length % 90)}
                  </span>
                  <button type="button" onClick={() => setChatOpen(false)} className="rounded p-1 text-slate-400 hover:text-white">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="my-2 flex-1 space-y-2 overflow-y-auto pr-1">
                  {chatList.map((c) => (
                    <div key={c.id} className="rounded-lg bg-[#141516] px-2.5 py-2 text-xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#4be125]">{c.user}</span>
                        <span className="text-[#8e9093]">{c.time}</span>
                      </div>
                      <div className="mt-0.5 text-slate-200">{c.msg}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendChat} className="flex items-center gap-1.5 rounded-lg bg-[#141516] px-2.5 py-1.5">
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder="Your message…"
                    className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-[#8e9093] outline-none"
                  />
                  <button type="submit" className="rounded bg-white/10 p-1.5 text-slate-300 hover:text-white">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </aside>
            )}
          </div>
        )}

        {fairOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setFairOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#1b1c1d] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sm font-black uppercase text-[#4be125]">
                  <Activity className="h-4 w-4" /> Provably Fair Settings
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

function SpribeBetBox({
  slot,
  phase,
  minBet,
  maxBet,
  potential,
  disabled,
  showCollapseBtn,
  showExpandBtn,
  onExpandToggle,
  onMode,
  onAmount,
  onAuto,
  onToggleAutoBet,
  onToggleAutoCashout,
  onQueue,
  onCancel,
  onCashout,
}: {
  slot: Slot;
  phase: Phase;
  minBet: number;
  maxBet: number;
  potential: number;
  disabled: boolean;
  showCollapseBtn?: boolean;
  showExpandBtn?: boolean;
  onExpandToggle: () => void;
  onMode: (m: "bet" | "auto") => void;
  onAmount: (n: number) => void;
  onAuto: (n: number) => void;
  onToggleAutoBet: () => void;
  onToggleAutoCashout: () => void;
  onQueue: () => void;
  onCancel: () => void;
  onCashout: () => void;
}) {
  const canCashout = phase === "flying" && slot.status === "active";
  const isQueued = slot.status === "queued";
  const locked = isQueued || canCashout;

  return (
    <div className="flex flex-col justify-between gap-2.5 rounded-[10px] bg-[#1b1c1d] p-3">
      {/* Centered Bet | Auto Switch + Optional [-] Collapse Button */}
      <div className="relative flex items-center justify-center">
        <div className="grid w-44 grid-cols-2 rounded-full bg-[#141516] p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onMode("bet")}
            className={`rounded-full py-1 transition ${
              slot.mode === "bet" ? "bg-[#2c2d30] text-white" : "text-[#8e9093] hover:text-white"
            }`}
          >
            Bet
          </button>
          <button
            type="button"
            onClick={() => onMode("auto")}
            className={`rounded-full py-1 transition ${
              slot.mode === "auto" ? "bg-[#2c2d30] text-white" : "text-[#8e9093] hover:text-white"
            }`}
          >
            Auto
          </button>
        </div>

        {(showCollapseBtn || showExpandBtn) && (
          <button
            type="button"
            onClick={onExpandToggle}
            className="absolute right-0 grid h-6 w-6 place-items-center rounded-md border border-white/15 bg-[#141516] text-[#8e9093] hover:text-white"
            title={showCollapseBtn ? "Hide second bet panel" : "Show second bet panel"}
          >
            {showCollapseBtn ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Main Horizontal Split (~42% Stepper & Presets | ~58% Green Bet CTA) */}
      <div className="grid grid-cols-12 items-stretch gap-2.5">
        <div className="col-span-5 flex flex-col gap-1.5">
          {/* Dark Pill Stepper */}
          <div className="flex items-center justify-between rounded-full bg-[#0e0e0e] px-2 py-1">
            <button
              type="button"
              disabled={locked}
              onClick={() => onAmount(slot.amount - Math.max(10, minBet))}
              className="grid h-6 w-6 place-items-center rounded-full bg-[#2c2d30] text-slate-300 hover:text-white disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>
            <input
              type="number"
              min={minBet}
              max={maxBet}
              value={slot.amount}
              disabled={locked}
              onChange={(e) => onAmount(Number(e.target.value))}
              className="min-w-0 flex-1 bg-transparent text-center text-sm font-black tabular-nums text-white outline-none"
            />
            <button
              type="button"
              disabled={locked}
              onClick={() => onAmount(slot.amount + Math.max(10, minBet))}
              className="grid h-6 w-6 place-items-center rounded-full bg-[#2c2d30] text-slate-300 hover:text-white disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* 2x2 Quick Preset Pills */}
          <div className="grid grid-cols-2 gap-1">
            {QUICK_AMOUNTS.map((c) => {
              const val = Math.max(minBet, Math.min(maxBet, c));
              return (
                <button
                  key={c}
                  type="button"
                  disabled={locked}
                  onClick={() => onAmount(val)}
                  className="rounded-full bg-[#141516] py-1 text-[11px] font-bold text-[#8e9093] hover:bg-[#252628] hover:text-white disabled:opacity-40"
                >
                  {val.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Big Rounded Spribe Green Bet Button */}
        <div className="col-span-7 flex">
          {canCashout ? (
            <button
              type="button"
              onClick={onCashout}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-[#fde047] bg-gradient-to-b from-[#d97706] to-[#b45309] p-2 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <span className="text-sm font-black uppercase tracking-wider">Cash Out</span>
              <span className="text-base font-black tabular-nums">{potential.toFixed(2)} BDT</span>
            </button>
          ) : isQueued ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-[#ff4d6d] bg-[#d90429] p-2 text-white transition hover:brightness-110"
            >
              <span className="text-base font-black uppercase">Cancel</span>
              {phase === "flying" && <span className="text-[10px] opacity-85">Waiting for next round</span>}
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || (slot.status !== "idle" && slot.status !== "cashed" && slot.status !== "lost")}
              onClick={onQueue}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-[#4be125] bg-[#28a909] p-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-45"
            >
              <span className="text-lg font-black leading-tight">Bet</span>
              <span className="text-sm font-bold tabular-nums">{slot.amount.toFixed(2)} BDT</span>
            </button>
          )}
        </div>
      </div>

      {/* Spribe Auto Mode Bottom Row: Auto bet switch + Auto Cash Out switch + multiplier */}
      {slot.mode === "auto" && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
          <button
            type="button"
            onClick={onToggleAutoBet}
            className="inline-flex items-center gap-2 text-[#8e9093] hover:text-white"
          >
            <span>Auto bet</span>
            <span className={`relative inline-flex h-4 w-7 items-center rounded-full p-0.5 transition ${slot.autoBet ? "bg-[#28a909]" : "bg-[#141516]"}`}>
              <span className={`h-3 w-3 rounded-full bg-white transition-transform ${slot.autoBet ? "translate-x-3" : "translate-x-0"}`} />
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={canCashout}
              onClick={onToggleAutoCashout}
              className="inline-flex items-center gap-2 text-[#8e9093] hover:text-white disabled:opacity-45"
            >
              <span>Auto Cash Out</span>
              <span className={`relative inline-flex h-4 w-7 items-center rounded-full p-0.5 transition ${slot.autoCashout ? "bg-[#28a909]" : "bg-[#141516]"}`}>
                <span className={`h-3 w-3 rounded-full bg-white transition-transform ${slot.autoCashout ? "translate-x-3" : "translate-x-0"}`} />
              </span>
            </button>
            <div className="flex items-center gap-1 rounded-full bg-[#141516] px-2.5 py-0.5">
              <input
                type="number"
                step="0.1"
                min={1.01}
                value={slot.auto}
                disabled={!slot.autoCashout || canCashout}
                onChange={(e) => onAuto(Number(e.target.value) || 1.01)}
                className="w-12 bg-transparent text-center font-black tabular-nums text-white outline-none disabled:opacity-40"
              />
              <span className="text-[#8e9093]">x</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AviatorGuard({
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
    <div className="mx-auto my-10 flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#1b1c1d] p-10 text-center shadow-2xl">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5">{icon}</div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-sm text-[#8e9093]">{desc}</p>
      {cta}
    </div>
  );
}
