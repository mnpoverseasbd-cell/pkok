import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  Bot,
  Coins,
  Flame,
  History,
  LogIn,
  Maximize2,
  Minimize2,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";
import { Die3D } from "@/components/games/Die3D";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel } from "@/components/games/AutoBetPanel";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { useGameConfig } from "@/hooks/useGameConfig";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { fairDice } from "@/lib/provablyFair";
import { recordMyBet, subscribeLiveBets, type LiveBet } from "@/lib/liveFeed";
import { subscribeBetHistory, type BetHistoryEntry } from "@/lib/betHistory";
import { isMuted, sfxBust, sfxDiceLand, sfxDiceShake, sfxWin, toggleMuted } from "@/lib/sound";

export const Route = createFileRoute("/games/dice")({
  head: () => ({
    meta: [
      { title: "Lucky Dice — Live Studio | Asik Game" },
      {
        name: "description",
        content: "Evolution-স্টাইল লাইভ স্টুডিও ডাইস — ৩ডি ক্রিস্টাল টাওয়ার ও ফিজিক্স বাউন্সের সাথে রিয়েল-টাইম বেটিং।",
      },
    ],
  }),
  component: LuckyDiceStudioPage,
});

type Direction = "under" | "over";
type RecentRoll = { id: number; value: number; win: boolean; mult: number };
type DeskTab = "live" | "history" | "auto";

const BETTING_TILES: Array<{
  id: string;
  label: string;
  sub: string;
  dir: Direction;
  target: number;
  accent: string;
}> = [
  { id: "sniper", label: "SNIPER", sub: "< 10", dir: "under", target: 10, accent: "from-amber-500/25 to-orange-600/20 border-amber-400/45" },
  { id: "low", label: "LOW ZONE", sub: "< 25", dir: "under", target: 25, accent: "from-emerald-500/25 to-teal-700/20 border-emerald-400/45" },
  { id: "under50", label: "UNDER HALF", sub: "< 50", dir: "under", target: 50, accent: "from-cyan-500/25 to-sky-700/20 border-cyan-400/45" },
  { id: "over50", label: "OVER HALF", sub: "> 50", dir: "over", target: 50, accent: "from-sky-500/25 to-indigo-700/20 border-sky-400/45" },
  { id: "high", label: "HIGH ZONE", sub: "> 75", dir: "over", target: 75, accent: "from-emerald-500/25 to-green-700/20 border-emerald-400/45" },
  { id: "mega", label: "LIGHTNING", sub: "> 95", dir: "over", target: 95, accent: "from-amber-400/30 to-rose-600/25 border-yellow-300/60" },
];

const POKER_CHIPS = [
  { val: 10, label: "10", rim: "#38bdf8", body: "#0284c7" },
  { val: 50, label: "50", rim: "#34d399", body: "#059669" },
  { val: 100, label: "100", rim: "#fb7185", body: "#e11d48" },
  { val: 500, label: "500", rim: "#c084fc", body: "#7e22ce" },
  { val: 1000, label: "1K", rim: "#fde047", body: "#d97706" },
];

function rollToDiceFaces(val: number): [number, number] {
  const idx = Math.min(35, Math.max(0, Math.floor((val / 100) * 36)));
  return [Math.floor(idx / 6) + 1, (idx % 6) + 1];
}

function LuckyDiceStudioPage() {
  const { balance, bet: placeBet, credit, refresh, userId, loading: walletLoading } = useDemoWallet();
  const { data: cfg, isLoading: cfgLoading } = useGameConfig("dice");
  const { stats, record, reset: resetStats } = useGameStats("dice");
  const pf = useProvablyFair("dice");

  const maintenance = !cfgLoading && cfg && !cfg.is_enabled;
  const notLoggedIn = !walletLoading && !userId;
  const noCoins = !walletLoading && !!userId && balance <= 0;

  const minBet = cfg?.min_bet ?? 10;
  const maxBet = cfg?.max_bet ?? 10000;
  const edge = cfg?.house_edge ?? 0;
  const multScale = Number(cfg?.config?.payout_multiplier ?? 1);
  const maxCapMult = Number(cfg?.config?.max_payout_mult ?? 0);

  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<Direction>("under");
  const [rolling, setRolling] = useState(false);
  const [rollId, setRollId] = useState(0);
  const [roll, setRoll] = useState<number | null>(null);
  const [displayRoll, setDisplayRoll] = useState(0);
  const [diceFaces, setDiceFaces] = useState<[number, number]>([4, 6]);
  const [outcome, setOutcome] = useState<"idle" | "win" | "lose">("idle");
  const [banner, setBanner] = useState<{ title: string; sub: string; win: boolean } | null>(null);
  const [turbo, setTurbo] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [recentRolls, setRecentRolls] = useState<RecentRoll[]>([]);
  const [deskTab, setDeskTab] = useState<DeskTab>("live");
  const [fairOpen, setFairOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [myHistory, setMyHistory] = useState<BetHistoryEntry[]>([]);

  const stageRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<ParticleBurstHandle>(null);
  const rollingRef = useRef(false);

  useEffect(() => subscribeLiveBets(setLiveBets), []);
  useEffect(() => subscribeBetHistory(setMyHistory), []);

  const diceHistory = useMemo(
    () => myHistory.filter((h) => h.game === "dice").slice(0, 18),
    [myHistory],
  );

  // Respect dynamic admin min/max changes cleanly
  useEffect(() => {
    setBet((prev) => Math.max(minBet, Math.min(maxBet, prev)));
  }, [minBet, maxBet]);

  const winChance = Math.min(98, Math.max(2, direction === "under" ? target : 100 - target));
  const basePayout = winChance > 0 ? +(99 / winChance).toFixed(4) : 0;
  const scaledPayout =
    basePayout * (1 - edge) * (Number.isFinite(multScale) && multScale > 0 ? multScale : 1);
  const effectivePayout =
    Number.isFinite(maxCapMult) && maxCapMult > 0 ? Math.min(scaledPayout, maxCapMult) : scaledPayout;
  const expectedReturn = Math.floor(bet * effectivePayout);
  const expectedProfit = Math.max(0, expectedReturn - bet);

  const clampBet = (v: number) => setBet(Math.max(minBet, Math.min(maxBet, Math.round(v) || minBet)));

  const toggleFullscreen = async () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement && stageRef.current) {
      await stageRef.current.requestFullscreen().catch(() => {});
      setFullscreen(true);
    } else if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const flipDirection = () => {
    if (rolling) return;
    setDirection((d) => (d === "under" ? "over" : "under"));
    setTarget((t) => Math.min(98, Math.max(2, 100 - t)));
  };

  const applyWinChance = (pct: number) => {
    if (rolling || !Number.isFinite(pct)) return;
    const clamped = Math.min(98, Math.max(2, Math.round(pct)));
    setTarget(direction === "under" ? clamped : 100 - clamped);
  };

  const runRound = useCallback(
    async (roundBet: number) => {
      if (!pf.ready || rollingRef.current) return { pnl: 0 };
      if (!placeBet(roundBet)) {
        setBanner({ title: "পর্যাপ্ত কয়েন নেই", sub: "দয়া করে ব্যালেন্স রিচার্জ করুন", win: false });
        return { pnl: 0 };
      }

      rollingRef.current = true;
      setRolling(true);
      setOutcome("idle");
      setBanner(null);
      setRollId((r) => r + 1);

      const finalPromise = fairDice(pf.serverSeed, pf.clientSeed, pf.nonce);

      try {
        sfxDiceShake();
      } catch {
        /* noop */
      }

      const animMs = turbo ? 260 : 820;
      const steps = turbo ? 5 : 13;
      const delay = Math.floor(animMs / steps);

      for (let i = 0; i < steps; i++) {
        setDisplayRoll(+(Math.random() * 99.99).toFixed(2));
        if (!turbo && i === Math.floor(steps * 0.4)) {
          try {
            sfxDiceLand(0.45);
          } catch {
            /* noop */
          }
        } else if (!turbo && i === Math.floor(steps * 0.72)) {
          try {
            sfxDiceLand(0.65);
          } catch {
            /* noop */
          }
        } else if (i % 3 === 1) {
          try {
            sfxDiceShake();
          } catch {
            /* noop */
          }
        }
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
      }

      const final = await finalPromise;
      const [d1, d2] = rollToDiceFaces(final);
      setDiceFaces([d1, d2]);
      setRoll(final);
      setDisplayRoll(final);

      try {
        sfxDiceLand(1);
      } catch {
        /* noop */
      }

      const isWin = direction === "under" ? final < target : final > target;
      let pnl = -roundBet;
      let won = 0;
      let mult = 0;

      if (isWin) {
        const rawWon = Math.floor(roundBet * basePayout * (1 - edge));
        credit(rawWon);
        const capMult = maxCapMult > 0 ? maxCapMult : Infinity;
        const scale = Number.isFinite(multScale) && multScale > 0 ? multScale : 1;
        won = Math.min(Math.floor(rawWon * scale), Math.floor(roundBet * capMult));
        pnl = won - roundBet;
        mult = +(won / roundBet).toFixed(2);
        setOutcome("win");
        setBanner({
          title: `WINNER +৳${pnl.toLocaleString()}`,
          sub: `${mult.toFixed(2)}× · রোল ${final.toFixed(2)} (${d1}+${d2})`,
          win: true,
        });
        record({ pnl, multiplier: mult });
        fxRef.current?.burst({ count: turbo ? 36 : 80, kind: "confetti", speed: 10 });
        try {
          sfxWin(mult);
        } catch {
          /* noop */
        }
      } else {
        setOutcome("lose");
        setBanner({
          title: `BUST -৳${roundBet.toLocaleString()}`,
          sub: `রোল ${final.toFixed(2)} · টার্গেট ${direction === "under" ? `< ${target}` : `> ${target}`}`,
          win: false,
        });
        record({ pnl, multiplier: 0 });
        fxRef.current?.burst({ count: 22, kind: "smoke", color: "#fb7185", speed: 4 });
        try {
          sfxBust();
        } catch {
          /* noop */
        }
      }

      setRecentRolls((prev) => [{ id: Date.now() + Math.random(), value: final, win: isWin, mult }, ...prev].slice(0, 16));
      pf.consume(`roll=${final} ${direction === "under" ? "<" : ">"}${target}`);
      recordMyBet({ game: "dice", bet: roundBet, multiplier: mult, payout: won });
      pushMultiplierHistory("dice", mult);

      rollingRef.current = false;
      setRolling(false);
      return { pnl };
    },
    [pf, placeBet, turbo, direction, target, basePayout, edge, credit, maxCapMult, multScale, record],
  );

  const auto = useAutoBet({ runRound, baseBet: bet });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || deskTab === "auto" || auto.running || fairOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (!rollingRef.current && !notLoggedIn && !noCoins && !maintenance) {
        void runRound(bet);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [deskTab, auto.running, fairOpen, bet, runRound, notLoggedIn, noCoins, maintenance]);

  const activeRollVal = rolling ? displayRoll : roll ?? 0;
  const rollPct = roll ?? 0;

  // SVG Speedometer Arc math (180deg semi-circle sweep)
  const arcRadius = 92;
  const arcLen = Math.PI * arcRadius; // ~289
  const winFrac = winChance / 100;
  const needleAngle = -90 + (activeRollVal / 100) * 180; // -90deg (left) to +90deg (right)

  const winZoneLeft = direction === "under" ? "0%" : `${target}%`;
  const winZoneWidth = direction === "under" ? `${target}%` : `${100 - target}%`;
  const loseZoneLeft = direction === "under" ? `${target}%` : "0%";
  const loseZoneWidth = direction === "under" ? `${100 - target}%` : `${target}%`;

  const onlinePlayers = 138 + (recentRolls.length % 19);

  return (
    <SiteShell>
      <div
        ref={stageRef}
        className="relative min-h-[calc(100vh-105px)] overflow-x-hidden text-slate-100"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.14), transparent 50%), radial-gradient(ellipse at 15% 45%, rgba(16,185,129,0.14), transparent 50%), linear-gradient(180deg, #070b0f 0%, #0b1116 45%, #05080b 100%)",
        }}
      >
        {/* Fine architectural gold pin-grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />

        {/* STUDIO TOP BROADCAST BAR */}
        <header className="relative z-20 border-b border-amber-400/20 bg-black/65 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-5 lg:pr-20">
            {/* Left: Back + Brand */}
            <div className="flex items-center gap-3">
              <Link
                to="/esports"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:border-amber-400/50 hover:text-amber-200"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> লবি
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl border border-amber-400/50 bg-gradient-to-br from-amber-400/25 via-amber-600/20 to-black text-lg shadow-[0_0_20px_rgba(212,175,55,0.25)]">
                  🎲
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black tracking-wide text-white uppercase">
                      Lucky Dice
                    </span>
                    <span className="rounded bg-gradient-to-r from-amber-300 to-yellow-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-black">
                      LIVE STUDIO
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                      {onlinePlayers} টেবিলে খেলছেন
                    </span>
                    <span>·</span>
                    <span>RTP 99%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Center: Evolution Bead-Road Roll History */}
            <div className="hidden xl:flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 max-w-md overflow-x-auto no-scrollbar">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-widest text-amber-300/80 shrink-0">
                ROAD
              </span>
              {recentRolls.length === 0 ? (
                <span className="text-[11px] text-slate-500">রোল রেজাল্ট এখানে আসবে…</span>
              ) : (
                recentRolls.map((item, idx) => (
                  <span
                    key={item.id}
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums ${
                      item.win
                        ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/50"
                        : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
                    } ${idx === 0 ? "ring-2 ring-amber-300/70" : "opacity-80"}`}
                  >
                    {item.value.toFixed(1)}
                  </span>
                ))
              )}
            </div>

            {/* Right: Tools + Wallet */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setTurbo((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-bold transition ${
                  turbo
                    ? "border-amber-400 bg-amber-400/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                    : "border-white/15 bg-white/5 text-slate-300 hover:text-white"
                }`}
                title="Turbo Spin"
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Turbo</span>
              </button>

              <button
                type="button"
                onClick={() => setFairOpen(true)}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 transition hover:bg-emerald-500/20"
                title="Provably Fair"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Fair</span>
              </button>

              <button
                type="button"
                onClick={() => setMutedState(toggleMuted())}
                className="rounded-xl border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
                title={muted ? "Unmute" : "Mute"}
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="hidden sm:inline-flex rounded-xl border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:text-white"
                title="Fullscreen"
              >
                {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>

              <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/35 bg-black/70 px-3 py-1.5">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-black tabular-nums text-white">৳{balance.toLocaleString()}</span>
                {userId && (
                  <button
                    type="button"
                    onClick={refresh}
                    className="ml-0.5 text-slate-400 hover:text-amber-300"
                    title="Refresh Balance"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                )}
              </div>

              <Link
                to="/wallet"
                search={{ tab: "deposit" }}
                className="inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 px-3 py-1.5 text-xs font-black text-black shadow-[0_0_16px_rgba(245,158,11,0.4)] hover:brightness-110"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> ডিপোজিট
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="relative z-10 mx-auto max-w-[1440px] px-3 py-4 sm:px-5 lg:pr-20">
          {maintenance ? (
            <StudioGuard
              icon={<Wrench className="h-11 w-11 text-amber-400" />}
              title="টেবিল মেইনটেন্যান্স চলছে"
              desc="অ্যাডমিন সাময়িকভাবে এই স্টুডিও টেবিলটি বন্ধ রেখেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।"
            />
          ) : notLoggedIn ? (
            <StudioGuard
              icon={<LogIn className="h-11 w-11 text-emerald-400" />}
              title="লাইভ স্টুডিওতে প্রবেশ করুন"
              desc="Lucky Dice স্টুডিও খেলতে আপনার অ্যাকাউন্টে লগইন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।"
              cta={
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 px-6 py-2.5 text-sm font-black text-black shadow-lg hover:brightness-110"
                  >
                    লগইন করুন
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-xl border border-amber-400/40 bg-white/5 px-6 py-2.5 text-sm font-black text-amber-200 hover:bg-white/10"
                  >
                    রেজিস্টার
                  </Link>
                </div>
              }
            />
          ) : noCoins ? (
            <StudioGuard
              icon={<Coins className="h-11 w-11 text-amber-400" />}
              title="ব্যালেন্স শূন্য"
              desc="বাজি ধরতে হলে আগে আপনার ওয়ালেটে কয়েন ডিপোজিট করুন।"
              cta={
                <Link
                  to="/wallet"
                  search={{ tab: "deposit" }}
                  className="rounded-xl bg-gradient-to-r from-amber-300 to-amber-500 px-6 py-2.5 text-sm font-black text-black shadow-lg hover:brightness-110"
                >
                  কয়েন কিনুন
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              {/* ════════════════════════════════════════════════════════════════
                  TOP 60%: EVOLUTION STUDIO BROADCAST VIEWPORT
                 ════════════════════════════════════════════════════════════════ */}
              <section
                className="relative overflow-hidden rounded-3xl border border-amber-400/30 p-4 sm:p-6"
                style={{
                  background:
                    "radial-gradient(circle at 50% 18%, rgba(250,204,21,0.12) 0%, rgba(16,185,129,0.14) 26%, rgba(8,22,20,0.92) 65%, #05090c 100%)",
                  boxShadow:
                    "0 25px 70px -20px rgba(0,0,0,0.85), inset 0 1px 0 rgba(250,204,21,0.28)",
                }}
              >
                {/* Studio Overhead Spotlight Cone */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[520px] -translate-x-1/2 rounded-full opacity-35 blur-3xl"
                  style={{
                    background: rolling
                      ? "radial-gradient(circle, rgba(251,191,36,0.55), transparent 70%)"
                      : outcome === "win"
                        ? "radial-gradient(circle, rgba(16,185,129,0.6), transparent 70%)"
                        : outcome === "lose"
                          ? "radial-gradient(circle, rgba(244,63,94,0.45), transparent 70%)"
                          : "radial-gradient(circle, rgba(212,175,55,0.35), transparent 70%)",
                  }}
                />

                {/* Dealer Studio Phase Indicator */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-black/55 px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.18em]">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        rolling
                          ? "bg-amber-400 animate-ping"
                          : outcome === "win"
                            ? "bg-emerald-400"
                            : "bg-emerald-400/75"
                      }`}
                    />
                    <span className={rolling ? "text-amber-300" : outcome === "win" ? "text-emerald-300" : "text-slate-200"}>
                      {rolling
                        ? "NO MORE BETS · TOWER DROP!"
                        : outcome === "win"
                          ? "PAYING WINNERS!"
                          : "PLACE YOUR BETS"}
                    </span>
                  </div>

                  {/* Mobile-visible recent chips */}
                  <div className="flex xl:hidden items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                    {recentRolls.slice(0, 8).map((item, idx) => (
                      <span
                        key={item.id}
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black tabular-nums ${
                          item.win ? "bg-emerald-500/25 text-emerald-300" : "bg-rose-500/25 text-rose-300"
                        } ${idx === 0 ? "ring-1 ring-amber-300" : "opacity-80"}`}
                      >
                        {item.value.toFixed(1)}
                      </span>
                    ))}
                  </div>

                  <div className="hidden sm:flex items-center gap-3 text-[11px] font-bold text-slate-400">
                    <span>
                      Win Chance: <strong className="text-emerald-300">{winChance}%</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Payout: <strong className="text-amber-300">{effectivePayout.toFixed(2)}×</strong>
                    </span>
                    {effectivePayout >= 3 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black text-amber-300">
                        <Flame className="h-3 w-3" /> HIGH MULT
                      </span>
                    )}
                  </div>
                </div>

                {/* DUAL STAGE CENTERPIECE: LEFT CRYSTAL TOWER + RIGHT PRECISION ARC DIAL */}
                <div className="relative z-10 grid items-center gap-6 py-2 lg:grid-cols-2">
                  {/* LEFT: Evolution-style 3D Glass Crystal Dice Tower & Velvet Landing Mat */}
                  <div className="relative flex flex-col items-center justify-center">
                    {/* Acrylic Glass Tower Housing */}
                    <div className="relative flex w-full max-w-[330px] flex-col items-center rounded-3xl border border-amber-300/25 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-black/55 px-6 pt-6 pb-5 shadow-inner backdrop-blur-sm">
                      {/* Glass Chute Rails */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute top-0 left-1/2 h-24 w-44 -translate-x-1/2 rounded-b-2xl border-x border-b border-cyan-200/20 bg-gradient-to-b from-cyan-300/10 to-transparent"
                      >
                        <div className="mx-3 mt-5 h-1 rounded-full bg-white/15 rotate-6" />
                        <div className="mx-5 mt-5 h-1 rounded-full bg-white/15 -rotate-6" />
                      </div>

                      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300/75">
                        Crystal Dice Chute
                      </div>

                      {/* Twin 3D Dice inside Chute -> Velvet Tray */}
                      <div className="relative flex items-center justify-center gap-3 pt-6 pb-2">
                        <Die3D
                          value={diceFaces[0]}
                          rolling={rolling}
                          rollId={rollId}
                          turbo={turbo}
                          size={76}
                          theme="emerald-gold"
                          phaseOffset={0}
                          outcome={outcome}
                          dropHeight={84}
                        />
                        <Die3D
                          value={diceFaces[1]}
                          rolling={rolling}
                          rollId={rollId}
                          turbo={turbo}
                          size={76}
                          theme="obsidian-gold"
                          phaseOffset={1}
                          outcome={outcome}
                          dropHeight={94}
                        />
                      </div>

                      {/* Velvet Baize Landing Rim */}
                      <div
                        className={`mt-2 flex w-full items-center justify-between rounded-2xl border px-4 py-2 text-xs font-bold transition-colors ${
                          outcome === "win" && !rolling
                            ? "border-emerald-400/50 bg-emerald-950/60 text-emerald-200"
                            : outcome === "lose" && !rolling
                              ? "border-rose-400/40 bg-rose-950/50 text-rose-200"
                              : "border-amber-400/25 bg-[#061812]/90 text-slate-300"
                        }`}
                      >
                        <span>ডাইস ফেস: {diceFaces[0]} &amp; {diceFaces[1]}</span>
                        <span className="rounded-md bg-black/40 px-2 py-0.5 text-[11px] font-black text-amber-300">
                          মোট {diceFaces[0] + diceFaces[1]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Precision Speedometer Roll Arc & Digital Hero */}
                  <div className="relative flex flex-col items-center justify-center">
                    <div className="relative flex flex-col items-center">
                      <svg viewBox="0 0 240 142" className="w-[270px] sm:w-[320px] overflow-visible">
                        <defs>
                          <linearGradient id="winArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#34d399" />
                          </linearGradient>
                          <linearGradient id="loseArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#be123c" />
                            <stop offset="100%" stopColor="#fb7185" />
                          </linearGradient>
                        </defs>

                        {/* Base Track Arc */}
                        <path
                          d="M 28 118 A 92 92 0 0 1 212 118"
                          fill="none"
                          stroke="rgba(255,255,255,0.1)"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />

                        {/* Lose Zone Background */}
                        <path
                          d="M 28 118 A 92 92 0 0 1 212 118"
                          fill="none"
                          stroke="url(#loseArcGrad)"
                          strokeOpacity="0.4"
                          strokeWidth="16"
                          strokeLinecap="round"
                        />

                        {/* Active Win Zone Arc */}
                        {direction === "under" ? (
                          <path
                            d="M 28 118 A 92 92 0 0 1 212 118"
                            fill="none"
                            stroke="url(#winArcGrad)"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray={`${arcLen * winFrac} ${arcLen}`}
                          />
                        ) : (
                          <path
                            d="M 28 118 A 92 92 0 0 1 212 118"
                            fill="none"
                            stroke="url(#winArcGrad)"
                            strokeWidth="16"
                            strokeLinecap="round"
                            strokeDasharray={`${arcLen * winFrac} ${arcLen}`}
                            strokeDashoffset={-(arcLen * (1 - winFrac))}
                          />
                        )}

                        {/* Precision Needle */}
                        <g
                          style={{
                            transform: `rotate(${needleAngle}deg)`,
                            transformOrigin: "120px 118px",
                            transition: rolling
                              ? "transform 90ms linear"
                              : "transform 480ms cubic-bezier(0.22, 1.35, 0.36, 1)",
                          }}
                        >
                          <polygon points="117,118 120,26 123,118" fill="#fde047" />
                          <circle cx="120" cy="118" r="7" fill="#f59e0b" stroke="#fffbeb" strokeWidth="2" />
                        </g>
                      </svg>

                      {/* Digital Studio Roll Readout centered beneath needle */}
                      <div className="-mt-3 flex flex-col items-center">
                        <div
                          className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${
                            rolling
                              ? "text-amber-200"
                              : outcome === "win"
                                ? "text-emerald-300 drop-shadow-[0_0_24px_rgba(16,185,129,0.65)] animate-cash-pop"
                                : outcome === "lose"
                                  ? "text-rose-300 drop-shadow-[0_0_20px_rgba(244,63,94,0.55)]"
                                  : "text-white"
                          }`}
                        >
                          {activeRollVal.toFixed(2)}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-bold">
                          <span className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-0.5 text-slate-300">
                            {direction === "under" ? `Under < ${target}` : `Over > ${target}`}
                          </span>
                          <span className="rounded-lg border border-amber-400/35 bg-amber-400/15 px-2.5 py-0.5 font-black text-amber-300">
                            {effectivePayout.toFixed(2)}×
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Result Banner Pill */}
                    <div className="mt-3 min-h-[34px]">
                      {banner ? (
                        <div
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-black shadow-lg animate-fade-in ${
                            banner.win
                              ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                              : "border-rose-400/50 bg-rose-500/20 text-rose-200"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{banner.title}</span>
                          <span className="opacity-75">· {banner.sub}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          প্রিডিকশন বেছে <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px]">Space</kbd> চাপুন অথবা চিপ দিয়ে রোল করুন
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* FULL-WIDTH PRECISION TARGET TRACK BAR */}
                <div className="relative z-10 mt-4 rounded-2xl border border-white/10 bg-black/50 px-4 pt-8 pb-3">
                  {roll !== null && (
                    <div
                      className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 transition-[left] duration-500"
                      style={{
                        left: `${Math.min(98, Math.max(2, rollPct))}%`,
                        transitionTimingFunction: "cubic-bezier(0.22, 1.35, 0.36, 1)",
                      }}
                    >
                      <div
                        className={`rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums shadow ${
                          outcome === "win" ? "bg-emerald-400 text-black" : "bg-rose-500 text-white"
                        }`}
                      >
                        {rollPct.toFixed(2)}
                      </div>
                    </div>
                  )}

                  <div className="relative flex h-6 items-center">
                    <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/15">
                      <div
                        className="absolute inset-y-0 transition-all duration-200"
                        style={{
                          left: loseZoneLeft,
                          width: loseZoneWidth,
                          background: "linear-gradient(90deg, rgba(225,29,72,0.5), rgba(244,63,94,0.7))",
                        }}
                      />
                      <div
                        className="absolute inset-y-0 transition-all duration-200"
                        style={{
                          left: winZoneLeft,
                          width: winZoneWidth,
                          background: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                          boxShadow: "0 0 16px rgba(16,185,129,0.7)",
                        }}
                      />
                    </div>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border-2 border-amber-100 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 shadow-[0_0_16px_rgba(251,191,36,0.9)]"
                      style={{ left: `${target}%` }}
                    />
                    <input
                      type="range"
                      min={2}
                      max={98}
                      value={target}
                      disabled={rolling || auto.running}
                      onChange={(e) => setTarget(Number(e.target.value))}
                      aria-label="Roll Target Slider"
                      className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] font-bold text-slate-400">
                    <span>0</span>
                    <span>25</span>
                    <span className="text-amber-300/80">50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>

                <ParticleLayer ref={fxRef} />
              </section>

              {/* ════════════════════════════════════════════════════════════════
                  BOTTOM 40%: 3-WING CASINO BETTING DESK
                 ════════════════════════════════════════════════════════════════ */}
              <section className="grid gap-4 lg:grid-cols-12">
                {/* WING 1 (4 cols): CASINO FELT BETTING TILES & DIRECTION */}
                <div className="flex flex-col justify-between gap-3 rounded-3xl border border-amber-400/20 bg-black/55 p-4 backdrop-blur-md lg:col-span-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                      বেটিং বোর্ড · প্রিডিকশন
                    </span>
                    <button
                      type="button"
                      disabled={rolling || auto.running}
                      onClick={flipDirection}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/35 bg-amber-400/10 px-2.5 py-1 text-[11px] font-black text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-45"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      {direction === "under" ? "ROLL UNDER" : "ROLL OVER"}
                    </button>
                  </div>

                  {/* Glowing Betting Tiles */}
                  <div className="grid grid-cols-3 gap-2">
                    {BETTING_TILES.map((tile) => {
                      const active = direction === tile.dir && target === tile.target;
                      const wc = tile.dir === "under" ? tile.target : 100 - tile.target;
                      const tileMult = ((99 / wc) * (1 - edge) * (multScale > 0 ? multScale : 1)).toFixed(2);
                      return (
                        <button
                          key={tile.id}
                          type="button"
                          disabled={rolling || auto.running}
                          onClick={() => {
                            setDirection(tile.dir);
                            setTarget(tile.target);
                          }}
                          className={`group flex flex-col items-center justify-center rounded-2xl border bg-gradient-to-b ${tile.accent} p-2.5 text-center transition hover:scale-[1.03] active:scale-95 disabled:opacity-45 ${
                            active ? "ring-2 ring-amber-300 shadow-[0_0_20px_rgba(251,191,36,0.3)]" : "opacity-85 hover:opacity-100"
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/65">
                            {tile.label}
                          </span>
                          <span className="mt-0.5 text-sm font-black text-white">{tile.sub}</span>
                          <span className="mt-0.5 text-[11px] font-black text-amber-300">{tileMult}×</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Fine Target / Win % inputs */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">টার্গেট ({direction === "under" ? "<" : ">"})</div>
                      <input
                        type="number"
                        min={2}
                        max={98}
                        value={target}
                        disabled={rolling || auto.running}
                        onChange={(e) => setTarget(Math.min(98, Math.max(2, Math.round(Number(e.target.value) || 50))))}
                        className="mt-0.5 w-full bg-transparent text-base font-black text-white outline-none"
                      />
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">জয়ের %</div>
                      <input
                        type="number"
                        min={2}
                        max={98}
                        value={winChance}
                        disabled={rolling || auto.running}
                        onChange={(e) => applyWinChance(Number(e.target.value))}
                        className="mt-0.5 w-full bg-transparent text-base font-black text-emerald-300 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* WING 2 (4 cols): POKER CHIP RACK & PRIMARY ACTION */}
                <div className="flex flex-col justify-between gap-3 rounded-3xl border border-amber-400/30 bg-gradient-to-b from-[#11191f]/90 to-black/85 p-4 shadow-xl lg:col-span-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-300">
                      চিপ র‍্যাক ও বাজি (৳{minBet}–৳{maxBet})
                    </span>
                    <span className="text-[11px] font-bold text-emerald-300">
                      লাভ: +৳{expectedProfit.toLocaleString()}
                    </span>
                  </div>

                  {/* Clay Casino Poker Chips */}
                  <div className="grid grid-cols-5 gap-2">
                    {POKER_CHIPS.map((chip) => {
                      const val = Math.max(minBet, Math.min(maxBet, chip.val));
                      const active = bet === val;
                      return (
                        <button
                          key={chip.label}
                          type="button"
                          disabled={rolling || auto.running}
                          onClick={() => setBet(val)}
                          className={`relative flex aspect-square max-h-14 w-full items-center justify-center rounded-full text-xs font-black text-white shadow-lg transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-40 ${
                            active ? "ring-2 ring-amber-300 -translate-y-1 shadow-[0_0_18px_rgba(251,191,36,0.5)]" : "opacity-85 hover:opacity-100"
                          }`}
                          style={{
                            background: `radial-gradient(circle at 35% 30%, ${chip.rim}, ${chip.body} 72%)`,
                            border: "3px dashed rgba(255,255,255,0.65)",
                            boxShadow: "inset 0 2px 5px rgba(255,255,255,0.35), 0 6px 12px rgba(0,0,0,0.6)",
                          }}
                        >
                          <span className="rounded-full bg-black/35 px-1.5 py-0.5 text-[10px]">
                            ৳{chip.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Bet Stepper Input */}
                  <div className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-black/60 p-1.5">
                    <button
                      type="button"
                      disabled={rolling || auto.running}
                      onClick={() => clampBet(bet / 2)}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      ½
                    </button>
                    <div className="flex flex-1 items-center justify-center gap-1 px-2">
                      <span className="text-sm font-black text-amber-300">৳</span>
                      <input
                        type="number"
                        min={minBet}
                        max={maxBet}
                        value={bet}
                        disabled={rolling || auto.running}
                        onChange={(e) => clampBet(Number(e.target.value))}
                        className="w-full bg-transparent text-center text-lg font-black tabular-nums text-white outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={rolling || auto.running}
                      onClick={() => clampBet(bet * 2)}
                      className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white hover:bg-white/20 disabled:opacity-40"
                    >
                      2×
                    </button>
                    <button
                      type="button"
                      disabled={rolling || auto.running}
                      onClick={() => clampBet(maxBet)}
                      className="rounded-xl bg-amber-400/20 border border-amber-400/40 px-2.5 py-2 text-[10px] font-black text-amber-200 hover:bg-amber-400/30 disabled:opacity-40"
                    >
                      MAX
                    </button>
                  </div>

                  {/* Giant Sculpted Studio Roll Button */}
                  {deskTab === "auto" ? (
                    <button
                      type="button"
                      onClick={() => (auto.running ? auto.stop() : auto.start())}
                      disabled={!pf.ready}
                      className={`w-full rounded-2xl py-4 text-lg font-black uppercase tracking-wider transition active:translate-y-0.5 disabled:opacity-45 ${
                        auto.running
                          ? "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-[0_6px_0_0_#7f1d1d]"
                          : "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-black shadow-[0_6px_0_0_#92400e]"
                      }`}
                    >
                      {auto.running
                        ? `STOP AUTO (${auto.progress.done}${auto.cfg.numberOfBets ? `/${auto.cfg.numberOfBets}` : ""})`
                        : "START AUTO BET"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={rolling}
                      onClick={() => void runRound(bet)}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 py-4 text-lg font-black uppercase tracking-wider text-[#021a0e] shadow-[0_6px_0_0_#065f46,0_0_32px_rgba(16,185,129,0.45)] transition hover:brightness-110 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {rolling ? "রোল হচ্ছে..." : `ROLL DICE · ৳${expectedReturn.toLocaleString()}`}
                    </button>
                  )}
                </div>

                {/* WING 3 (4 cols): INTEGRATED LIVE FEED / MY BETS / AUTO STRATEGY */}
                <div className="flex flex-col rounded-3xl border border-white/10 bg-black/55 p-4 backdrop-blur-md lg:col-span-4">
                  {/* Tab Switcher + Session Summary */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                      <button
                        type="button"
                        onClick={() => setDeskTab("live")}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                          deskTab === "live" ? "bg-emerald-500 text-black" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        <Users className="h-3 w-3" /> Live
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeskTab("history")}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                          deskTab === "history" ? "bg-amber-400 text-black" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        <History className="h-3 w-3" /> My Bets
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeskTab("auto")}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-black transition ${
                          deskTab === "auto" ? "bg-cyan-400 text-black" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        <Bot className="h-3 w-3" /> Auto
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-400">
                        Bets: <strong className="text-white">{stats.bets}</strong>
                      </span>
                      <span className={`font-black ${stats.net >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {stats.net >= 0 ? `+৳${stats.net.toLocaleString()}` : `-৳${Math.abs(stats.net).toLocaleString()}`}
                      </span>
                      {stats.bets > 0 && (
                        <button
                          type="button"
                          onClick={resetStats}
                          className="text-[10px] text-slate-500 hover:text-slate-300"
                          title="Reset Session Stats"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tab Body */}
                  {deskTab === "auto" ? (
                    <div className="max-h-[215px] overflow-y-auto pr-1">
                      <AutoBetPanel auto={auto} canStart={pf.ready} />
                    </div>
                  ) : deskTab === "history" ? (
                    <div className="max-h-[215px] overflow-y-auto">
                      {diceHistory.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-500">
                          এখনও কোনো ডাইস বেট হয়নি
                        </div>
                      ) : (
                        <table className="w-full text-[11px]">
                          <thead className="sticky top-0 bg-[#0b1014] text-slate-400">
                            <tr>
                              <th className="py-1.5 text-left">Bet</th>
                              <th className="py-1.5 text-right">Mult</th>
                              <th className="py-1.5 text-right">Payout</th>
                            </tr>
                          </thead>
                          <tbody>
                            {diceHistory.map((h) => {
                              const won = h.payout > 0;
                              return (
                                <tr key={h.id} className="border-t border-white/5">
                                  <td className="py-1.5 font-mono text-slate-200">৳{h.bet}</td>
                                  <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-slate-500"}`}>
                                    {h.multiplier > 0 ? `${h.multiplier.toFixed(2)}×` : "—"}
                                  </td>
                                  <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-400" : "text-rose-400"}`}>
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
                    <div className="max-h-[215px] overflow-y-auto">
                      <table className="w-full text-[11px]">
                        <thead className="sticky top-0 bg-[#0b1014] text-slate-400">
                          <tr>
                            <th className="py-1.5 text-left">Player</th>
                            <th className="py-1.5 text-right">Bet</th>
                            <th className="py-1.5 text-right">Mult</th>
                            <th className="py-1.5 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {liveBets.slice(0, 14).map((b) => {
                            const won = b.payout > 0;
                            return (
                              <tr key={b.id} className={`border-t border-white/5 ${b.isMe ? "bg-amber-400/10" : ""}`}>
                                <td className="py-1.5 font-mono text-slate-200">
                                  {b.isMe && (
                                    <span className="mr-1 rounded bg-amber-400 px-1 text-[9px] font-black text-black">
                                      YOU
                                    </span>
                                  )}
                                  {b.user}
                                </td>
                                <td className="py-1.5 text-right font-mono text-slate-300">৳{b.bet}</td>
                                <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-slate-500"}`}>
                                  {b.multiplier > 0 ? `${b.multiplier}×` : "—"}
                                </td>
                                <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-400" : "text-rose-400"}`}>
                                  {won ? `+৳${b.payout}` : `-৳${b.bet}`}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </main>

        {/* PROVABLY FAIR MODAL DRAWER */}
        {fairOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setFairOpen(false)}
          >
            <div
              className="w-full max-w-lg rounded-3xl border border-amber-400/35 bg-[#0a1015] p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-300">
                  <Activity className="h-4 w-4" /> Provably Fair Verification — Lucky Dice
                </div>
                <button
                  type="button"
                  onClick={() => setFairOpen(false)}
                  className="rounded-lg bg-white/10 p-1 text-slate-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ProvablyFairPanel pf={pf} gameKey="dice" />
            </div>
          </div>
        )}
      </div>
    </SiteShell>
  );
}

function StudioGuard({
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
    <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-amber-400/30 bg-black/65 p-10 text-center shadow-2xl backdrop-blur-md">
      <div className="grid h-20 w-20 place-items-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
        {icon}
      </div>
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="text-sm text-slate-300">{desc}</p>
      {cta}
    </div>
  );
}
