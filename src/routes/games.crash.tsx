import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  Coins,
  LogIn,
  MessageSquare,
  Minus,
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
      { name: "description", content: "Spribe Aviator স্টাইল লাইভ ক্র্যাশ গেম — বাজি ধরুন এবং প্লেন ওড়ার সাথে ক্যাশআউট করুন।" },
    ],
  }),
  component: AviatorCrashPage,
});

type Phase = "waiting" | "flying" | "crashed";
type SlotStatus = "idle" | "queued" | "active" | "cashed" | "lost";
type LeftTab = "all" | "my" | "top";

interface Slot {
  mode: "bet" | "auto";
  amount: number;
  auto: number;
  autoEnabled: boolean;
  status: SlotStatus;
  cashMult?: number;
  payout?: number;
}

const BETTING_WINDOW_MS = 6500;
const POST_CRASH_MS = 2800;
const QUICK_AMOUNTS = [100, 200, 500, 10000];

const INITIAL_CHAT = [
  { id: 1, user: "0***0", time: "11:28:45", msg: "2x e auto diya rakhsi 🔥" },
  { id: 2, user: "w***1", time: "11:28:47", msg: "15.31x dhorse vai ajke!" },
  { id: 3, user: "f***d", time: "11:28:49", msg: "Good luck all ✈️" },
  { id: 4, user: "b***4", time: "11:28:51", msg: "1000 BDT cashout @ 4.23x 💰" },
];

function multPillStyle(m: number) {
  if (m >= 10) return "text-[#f472b6] border-[#db2777]/40 bg-[#3b122b]";
  if (m >= 2) return "text-[#c084fc] border-[#9333ea]/40 bg-[#2b1542]";
  return "text-[#38bdf8] border-[#0284c7]/40 bg-[#0d2238]";
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
    1.24, 1.25, 5.61, 1.28, 2.4, 15.31, 1.45, 2.85, 43.86, 1.18, 6.14,
  ]);
  const [skyBadges, setSkyBadges] = useState<SkyCashoutBadge[]>([]);
  const [muted, setMutedState] = useState(() => isMuted());
  const [fairOpen, setFairOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatDraft, setChatDraft] = useState("");
  const [chatList, setChatList] = useState(INITIAL_CHAT);
  const [leftTab, setLeftTab] = useState<LeftTab>("all");
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [myHistory, setMyHistory] = useState<BetHistoryEntry[]>([]);

  const [slots, setSlots] = useState<[Slot, Slot]>([
    { mode: "bet", amount: Math.max(minBet, 50), auto: 2.0, autoEnabled: false, status: "idle" },
    { mode: "bet", amount: Math.max(minBet, 100), auto: 2.0, autoEnabled: false, status: "idle" },
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
    () => [...liveBets].sort((a, b) => b.payout - a.payout).slice(0, 15),
    [liveBets],
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
        { id: Date.now() + i, label: `CASHED +৳${won.toLocaleString()} (${atMult.toFixed(2)}×)`, mult: atMult, createdAt: performance.now() },
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

  const startFlying = useCallback(async () => {
    const activePf = pfRef.current;
    if (!activePf.ready) {
      beginBettingWindowRef.current();
      return;
    }

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
        setRecentCrashes((prev) => [target, ...prev].slice(0, 18));
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
      {/* Authentic Spribe Aviator Dark Arena */}
      <div className="min-h-[calc(100vh-105px)] bg-[#0e0f12] text-[#e5e7eb] lg:pr-14">
        {/* TOP AVIATOR BAR */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#141519] px-3 py-2 sm:px-4">
          <div className="flex items-center gap-3">
            <Link
              to="/esports"
              className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Lobby
            </Link>
            <span className="font-display text-xl font-black italic tracking-tight text-[#e11d48]">
              Aviator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFairOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-white/10"
              title="Provably Fair"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Fair
            </button>
            <button
              type="button"
              onClick={() => setMutedState(toggleMuted())}
              className="rounded-full bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1">
              <span className="text-sm font-black tabular-nums text-[#22c55e]">
                {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[11px] font-bold text-slate-400">BDT</span>
              {userId && (
                <button type="button" onClick={refresh} className="ml-0.5 text-slate-400 hover:text-white" title="Refresh">
                  <RefreshCw className="h-3 w-3" />
                </button>
              )}
            </div>
            <Link
              to="/wallet"
              search={{ tab: "deposit" }}
              className="rounded-full bg-[#28a745] px-3 py-1 text-xs font-black text-white hover:brightness-110"
            >
              + Deposit
            </Link>
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className={`hidden xl:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                chatOpen ? "bg-[#e11d48] text-white" : "bg-white/10 text-slate-300"
              }`}
              title="Toggle Chat"
            >
              <MessageSquare className="h-3.5 w-3.5" /> Chat
            </button>
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
            icon={<LogIn className="h-10 w-10 text-[#22c55e]" />}
            title="Login Required"
            desc="Please sign in to place bets in Aviator."
            cta={
              <div className="flex gap-3">
                <Link to="/login" className="rounded-xl bg-[#28a745] px-6 py-2.5 text-sm font-black text-white hover:brightness-110">
                  লগইন করুন
                </Link>
                <Link to="/register" className="rounded-xl border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-black text-white">
                  রেজিস্টার
                </Link>
              </div>
            }
          />
        ) : noCoins ? (
          <AviatorGuard
            icon={<Coins className="h-10 w-10 text-amber-400" />}
            title="Insufficient Coins"
            desc="Deposit coins to start flying & cashing out."
            cta={
              <Link to="/wallet" search={{ tab: "deposit" }} className="rounded-xl bg-[#28a745] px-6 py-2.5 text-sm font-black text-white">
                কয়েন কিনুন
              </Link>
            }
          />
        ) : (
          /* 3-COLUMN AUTHENTIC SPRIBE AVIATOR SHELL */
          <div className="mx-auto grid max-w-[1600px] gap-2 p-2 lg:grid-cols-12">
            {/* LEFT PANEL: All Bets / My Bets / Top (3 cols on lg, hidden below on mobile) */}
            <aside className="order-2 flex flex-col justify-between rounded-2xl bg-[#1b1c20] p-2.5 lg:order-1 lg:col-span-3 lg:h-[620px]">
              <div className="flex flex-col min-h-0 flex-1">
                {/* Segmented Tabs */}
                <div className="grid grid-cols-3 gap-1 rounded-full bg-[#111215] p-1">
                  <button
                    type="button"
                    onClick={() => setLeftTab("all")}
                    className={`rounded-full py-1 text-[11px] font-bold transition ${
                      leftTab === "all" ? "bg-[#2c2d33] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All Bets
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab("my")}
                    className={`rounded-full py-1 text-[11px] font-bold transition ${
                      leftTab === "my" ? "bg-[#2c2d33] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setLeftTab("top")}
                    className={`rounded-full py-1 text-[11px] font-bold transition ${
                      leftTab === "top" ? "bg-[#2c2d33] text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Top
                  </button>
                </div>

                {/* Live Pool Summary */}
                <div className="mt-2.5 flex items-center justify-between border-b border-white/5 pb-2 px-1">
                  <div>
                    <div className="flex -space-x-1.5">
                      <span className="h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-[#1b1c20]" />
                      <span className="h-5 w-5 rounded-full bg-rose-500 ring-2 ring-[#1b1c20]" />
                      <span className="h-5 w-5 rounded-full bg-amber-400 ring-2 ring-[#1b1c20]" />
                    </div>
                    <div className="mt-1 text-[11px] font-bold text-slate-300">
                      {liveBets.length}/{activePlayersCount} <span className="text-slate-500 font-normal">Bets</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black tabular-nums text-white">
                      {totalPool.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-400">Total win BDT</div>
                  </div>
                </div>

                {/* Column Headers */}
                <div className="mt-2 grid grid-cols-12 px-2 text-[10px] font-bold text-slate-500">
                  <span className="col-span-4">Player</span>
                  <span className="col-span-3 text-right">Bet BDT</span>
                  <span className="col-span-2 text-center">X</span>
                  <span className="col-span-3 text-right">Win BDT</span>
                </div>

                {/* Rows */}
                <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-0.5">
                  {leftTab === "my" ? (
                    crashHistory.length === 0 ? (
                      <div className="py-10 text-center text-xs text-slate-500">No bets yet</div>
                    ) : (
                      crashHistory.map((h) => {
                        const won = h.payout > 0;
                        return (
                          <div
                            key={h.id}
                            className={`grid grid-cols-12 items-center rounded-lg px-2 py-1.5 text-[11px] ${
                              won ? "border border-[#22c55e]/35 bg-[#122e19]" : "bg-[#141518]"
                            }`}
                          >
                            <span className="col-span-4 font-bold text-amber-300 truncate">You</span>
                            <span className="col-span-3 text-right tabular-nums text-slate-200">{h.bet.toFixed(2)}</span>
                            <span className="col-span-2 text-center">
                              {h.multiplier > 0 ? (
                                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${multPillStyle(h.multiplier)}`}>
                                  {h.multiplier.toFixed(2)}x
                                </span>
                              ) : (
                                <span className="text-slate-500">—</span>
                              )}
                            </span>
                            <span className={`col-span-3 text-right font-black tabular-nums ${won ? "text-[#4ade80]" : "text-slate-500"}`}>
                              {won ? h.payout.toFixed(2) : "0.00"}
                            </span>
                          </div>
                        );
                      })
                    )
                  ) : (
                    (leftTab === "top" ? topBets : liveBets.slice(0, 18)).map((b) => {
                      const won = b.payout > 0;
                      return (
                        <div
                          key={b.id}
                          className={`grid grid-cols-12 items-center rounded-lg px-2 py-1.5 text-[11px] ${
                            won
                              ? "border border-[#22c55e]/30 bg-[#142a18]"
                              : "bg-[#141518]"
                          }`}
                        >
                          <span className="col-span-4 truncate font-semibold text-slate-200">
                            {b.isMe ? <span className="text-amber-300 font-black">YOU</span> : b.user}
                          </span>
                          <span className="col-span-3 text-right tabular-nums text-slate-300">
                            {b.bet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="col-span-2 text-center">
                            {b.multiplier > 0 ? (
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${multPillStyle(b.multiplier)}`}>
                                {b.multiplier.toFixed(2)}x
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </span>
                          <span className={`col-span-3 text-right font-bold tabular-nums ${won ? "text-[#4ade80]" : "text-slate-500"}`}>
                            {won ? b.payout.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Spribe-style Panel Footer */}
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2 text-[10px] text-slate-400">
                <button type="button" onClick={() => setFairOpen(true)} className="inline-flex items-center gap-1 hover:text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Provably Fair Game
                </button>
                <span className="font-bold text-slate-500">PKOK STUDIO</span>
              </div>
            </aside>

            {/* CENTER ARENA: History Ribbon + Sky Canvas + Dual Bet Boxes */}
            <div className={`order-1 flex flex-col gap-2 lg:order-2 ${chatOpen ? "lg:col-span-9 xl:col-span-6" : "lg:col-span-9"}`}>
              {/* Top Multiplier Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-xl bg-[#141519] px-3 py-1.5">
                {recentCrashes.map((m, idx) => (
                  <span
                    key={`${m}-${idx}`}
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-black tabular-nums ${multPillStyle(m)} ${
                      idx === 0 ? "ring-1 ring-white/40" : ""
                    }`}
                  >
                    {m.toFixed(2)}x
                  </span>
                ))}
              </div>

              {/* MAIN FLIGHT CANVAS STAGE */}
              <div className="relative h-[280px] sm:h-[330px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d10]">
                <AviatorCanvas multiplier={mult} phase={phase} badges={skyBadges} />

                {/* Center Multiplier / Countdown */}
                <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
                  {phase === "waiting" ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#e11d48]/25 border-t-[#e11d48]" />
                      <div className="text-xs font-black uppercase tracking-[0.25em] text-slate-200">
                        WAITING FOR NEXT ROUND
                      </div>
                      <div className="h-1.5 w-44 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-[#e11d48] transition-all duration-100"
                          style={{ width: `${Math.min(100, (countdown / (BETTING_WINDOW_MS / 1000)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : phase === "crashed" ? (
                    <div className="flex flex-col items-center">
                      <div className="text-lg sm:text-xl font-black uppercase tracking-widest text-white">
                        FLEW AWAY!
                      </div>
                      <div className="text-5xl sm:text-6xl font-black tracking-tight tabular-nums text-[#e11d48]">
                        {crashAt?.toFixed(2)}x
                      </div>
                    </div>
                  ) : (
                    <div className="text-6xl sm:text-7xl font-black tracking-tight tabular-nums text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                      {mult.toFixed(2)}x
                    </div>
                  )}
                </div>

                {/* Bottom-Right Live Spectators Pill (like screenshot 1,110) */}
                <div className="pointer-events-none absolute right-3 bottom-3 z-10 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                  <span className="flex -space-x-1">
                    <span className="h-4 w-4 rounded-full bg-sky-400 ring-1 ring-black" />
                    <span className="h-4 w-4 rounded-full bg-rose-500 ring-1 ring-black" />
                    <span className="h-4 w-4 rounded-full bg-emerald-400 ring-1 ring-black" />
                  </span>
                  <span>{activePlayersCount.toLocaleString()}</span>
                </div>
              </div>

              {/* DUAL SPRIBE AVIATOR BET BOXES */}
              <div className="grid gap-2 sm:grid-cols-2">
                {([0, 1] as const).map((idx) => (
                  <SpribeBetBox
                    key={idx}
                    slot={slots[idx]}
                    phase={phase}
                    minBet={minBet}
                    maxBet={maxBet}
                    potential={calcPayout(slots[idx].amount, mult)}
                    disabled={!pf.ready}
                    onMode={(mode) => setSlot(idx, { mode })}
                    onAmount={(a) => setSlot(idx, { amount: Math.max(minBet, Math.min(maxBet, Math.round(a) || minBet)) })}
                    onAuto={(a) => setSlot(idx, { auto: Math.max(1.01, Math.min(1000, +a.toFixed(2))) })}
                    onToggleAuto={() => setSlot(idx, { autoEnabled: !slots[idx].autoEnabled })}
                    onQueue={() => queueBet(idx)}
                    onCancel={() => cancelQueued(idx)}
                    onCashout={() => manualCashout(idx)}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT PANEL: LIVE AVIATOR CHAT (hidden on <xl or toggleable) */}
            {chatOpen && (
              <aside className="order-3 hidden xl:flex xl:col-span-3 flex-col justify-between rounded-2xl bg-[#1b1c20] p-2.5 h-[620px]">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 px-1">
                  <span className="text-[11px] font-bold text-slate-400">Live Chat</span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4ade80]">
                    <span className="h-2 w-2 rounded-full bg-[#4ade80]" />
                    Online: {3900 + (recentCrashes.length % 90)}
                  </span>
                </div>

                <div className="my-2 flex-1 space-y-2 overflow-y-auto pr-1">
                  {chatList.map((c) => (
                    <div key={c.id} className="rounded-xl bg-[#141518] px-2.5 py-2 text-xs">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#4ade80]">{c.user}</span>
                        <span className="text-slate-500">{c.time}</span>
                      </div>
                      <div className="mt-0.5 text-slate-200">{c.msg}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={sendChat} className="flex items-center gap-1.5 rounded-xl bg-[#111215] px-2.5 py-1.5">
                  <input
                    value={chatDraft}
                    onChange={(e) => setChatDraft(e.target.value)}
                    placeholder="Your message…"
                    className="min-w-0 flex-1 bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
                  />
                  <button type="submit" className="rounded-lg bg-white/10 p-1.5 text-slate-300 hover:text-white">
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </form>
              </aside>
            )}
          </div>
        )}

        {/* PROVABLY FAIR MODAL */}
        {fairOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setFairOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#16171b] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sm font-black uppercase text-emerald-400">
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
  onMode,
  onAmount,
  onAuto,
  onToggleAuto,
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
  onMode: (m: "bet" | "auto") => void;
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
    <div className="flex flex-col gap-2.5 rounded-2xl border border-white/5 bg-[#1b1c20] p-3">
      {/* Top Centered Bet | Auto Switcher + Status */}
      <div className="relative flex items-center justify-center">
        <div className="grid w-44 grid-cols-2 rounded-full bg-[#111215] p-0.5 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => onMode("bet")}
            className={`rounded-full py-1 transition ${
              slot.mode === "bet" ? "bg-[#2c2d33] text-white" : "text-slate-400"
            }`}
          >
            Bet
          </button>
          <button
            type="button"
            onClick={() => onMode("auto")}
            className={`rounded-full py-1 transition ${
              slot.mode === "auto" ? "bg-[#2c2d33] text-white" : "text-slate-400"
            }`}
          >
            Auto
          </button>
        </div>

        {slot.status === "cashed" && (
          <span className="absolute right-0 rounded-full bg-[#22c55e]/20 px-2 py-0.5 text-[10px] font-black text-[#4ade80]">
            +৳{slot.payout?.toLocaleString()}
          </span>
        )}
      </div>

      {/* Main Controls Row: Left Stepper/Presets + Right Green Bet Button */}
      <div className="grid grid-cols-12 items-stretch gap-2.5">
        <div className="col-span-6 flex flex-col gap-1.5">
          {/* - [ 100.00 ] + */}
          <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#111215] px-2 py-1">
            <button
              type="button"
              disabled={locked}
              onClick={() => onAmount(slot.amount - Math.max(10, minBet))}
              className="grid h-6 w-6 place-items-center rounded-full border border-white/20 text-slate-300 hover:text-white disabled:opacity-40"
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
              className="grid h-6 w-6 place-items-center rounded-full border border-white/20 text-slate-300 hover:text-white disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {/* 2x2 Quick Amount Grid matching screenshot */}
          <div className="grid grid-cols-2 gap-1">
            {QUICK_AMOUNTS.map((c) => {
              const val = Math.max(minBet, Math.min(maxBet, c));
              return (
                <button
                  key={c}
                  type="button"
                  disabled={locked}
                  onClick={() => onAmount(val)}
                  className="rounded-full bg-[#111215] py-1 text-[11px] font-bold text-slate-300 hover:bg-[#2c2d33] hover:text-white disabled:opacity-40"
                >
                  {val.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Iconic Big Green Bet / Red Cancel / Amber Cash Out */}
        <div className="col-span-6 flex">
          {canCashout ? (
            <button
              type="button"
              onClick={onCashout}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-[#fde047] bg-gradient-to-b from-[#f59e0b] to-[#d97706] p-2 text-white shadow-[0_0_20px_rgba(245,158,11,0.45)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <span className="text-xs font-black uppercase tracking-wider">Cash Out</span>
              <span className="text-base font-black tabular-nums">{potential.toFixed(2)} BDT</span>
            </button>
          ) : isQueued ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-[#f87171] bg-[#dc2626] p-2 text-white transition hover:brightness-110"
            >
              <span className="text-sm font-black uppercase">Cancel</span>
              {phase === "flying" && <span className="text-[10px] opacity-85">Waiting for next round</span>}
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled || (slot.status !== "idle" && slot.status !== "cashed" && slot.status !== "lost")}
              onClick={onQueue}
              className="flex w-full flex-col items-center justify-center rounded-2xl border border-[#4ade80] bg-gradient-to-b from-[#28b636] to-[#1f982b] p-2 text-white shadow-[0_0_18px_rgba(34,197,94,0.35)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-45"
            >
              <span className="text-sm font-black">Bet</span>
              <span className="text-sm font-bold tabular-nums">{slot.amount.toFixed(2)} BDT</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto Cashout Row (always handy in Auto tab, or quick glance) */}
      {slot.mode === "auto" && (
        <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[11px]">
          <label className="inline-flex items-center gap-2 font-bold text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={slot.autoEnabled}
              disabled={canCashout}
              onChange={onToggleAuto}
              className="h-3.5 w-3.5 accent-[#28b636]"
            />
            Auto Cash Out
          </label>
          <div className="flex items-center gap-1 rounded-full bg-[#111215] px-2.5 py-1">
            <input
              type="number"
              step="0.1"
              min={1.01}
              value={slot.auto}
              disabled={!slot.autoEnabled || canCashout}
              onChange={(e) => onAuto(Number(e.target.value) || 1.01)}
              className="w-14 bg-transparent text-center font-black tabular-nums text-white outline-none disabled:opacity-40"
            />
            <span className="text-slate-400">×</span>
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
    <div className="mx-auto my-10 flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-white/10 bg-[#1b1c20] p-10 text-center shadow-2xl">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/5">{icon}</div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-sm text-slate-400">{desc}</p>
      {cta}
    </div>
  );
}
