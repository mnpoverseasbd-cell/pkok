import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowLeftRight,
  Bot,
  Coins,
  History,
  LogIn,
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
import { serverPlayDice } from "@/lib/game-settlement.functions";
import { recordMyBet, subscribeLiveBets, type LiveBet } from "@/lib/liveFeed";
import { subscribeBetHistory, type BetHistoryEntry } from "@/lib/betHistory";
import { isMuted, sfxBust, sfxDiceLand, sfxDiceShake, sfxWin, toggleMuted } from "@/lib/sound";

export const Route = createFileRoute("/games/dice")({
  head: () => ({
    meta: [
      { title: "Lucky Dice — Asik Game" },
      {
        name: "description",
        content: "উপরে 3D লাইভ ডাইস ও নিচে সহজ বেটিং কন্ট্রোল — প্রিডিক্ট করে সাথে সাথে জিতুন।",
      },
    ],
  }),
  component: LuckyDicePage,
});

type Direction = "under" | "over";
type RecentRoll = { id: number; value: number; win: boolean; mult: number };
type FeedTab = "live" | "history" | "auto";

const QUICK_CHIPS = [10, 50, 100, 500, 1000];
const QUICK_TARGETS: Array<{ label: string; dir: Direction; target: number }> = [
  { label: "< 25", dir: "under", target: 25 },
  { label: "< 50", dir: "under", target: 50 },
  { label: "> 50", dir: "over", target: 50 },
  { label: "> 75", dir: "over", target: 75 },
  { label: "< 10 (9.9×)", dir: "under", target: 10 },
];

function rollToDiceFaces(val: number): [number, number] {
  const idx = Math.min(35, Math.max(0, Math.floor((val / 100) * 36)));
  return [Math.floor(idx / 6) + 1, (idx % 6) + 1];
}

function LuckyDicePage() {
  const { balance, syncBalance, userId, loading: walletLoading } = useDemoWallet();
  const doPlayDice = useServerFn(serverPlayDice);
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
  const [diceFaces, setDiceFaces] = useState<[number, number]>([3, 5]);
  const [outcome, setOutcome] = useState<"idle" | "win" | "lose">("idle");
  const [banner, setBanner] = useState<{ title: string; win: boolean } | null>(null);
  const [turbo, setTurbo] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [recentRolls, setRecentRolls] = useState<RecentRoll[]>([]);
  const [feedTab, setFeedTab] = useState<FeedTab>("live");
  const [fairOpen, setFairOpen] = useState(false);
  const [liveBets, setLiveBets] = useState<LiveBet[]>([]);
  const [myHistory, setMyHistory] = useState<BetHistoryEntry[]>([]);

  const fxRef = useRef<ParticleBurstHandle>(null);
  const rollingRef = useRef(false);

  useEffect(() => subscribeLiveBets(setLiveBets), []);
  useEffect(() => subscribeBetHistory(setMyHistory), []);

  const diceHistory = useMemo(
    () => myHistory.filter((h) => h.game === "dice").slice(0, 20),
    [myHistory],
  );

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
      if (!userId) {
        setBanner({ title: "খেলতে অনুগ্রহ করে লগইন করুন", win: false });
        return { pnl: 0 };
      }

      rollingRef.current = true;
      setRolling(true);
      setOutcome("idle");
      setBanner(null);
      setRollId((r) => r + 1);

      const serverPromise = doPlayDice({
        data: {
          bet: roundBet,
          target,
          direction,
          clientSeed: pf.clientSeed,
          nonce: pf.nonce,
        },
      });

      try {
        sfxDiceShake();
      } catch {
        /* noop */
      }

      const animMs = turbo ? 240 : 760;
      const steps = turbo ? 5 : 12;
      const delay = Math.floor(animMs / steps);

      for (let i = 0; i < steps; i++) {
        setDisplayRoll(+(Math.random() * 99.99).toFixed(2));
        if (!turbo && (i === 5 || i === 9)) {
          try {
            sfxDiceLand(i === 5 ? 0.5 : 0.7);
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

      let serverRes: Awaited<ReturnType<typeof doPlayDice>>;
      try {
        serverRes = await serverPromise;
      } catch (err: any) {
        setBanner({ title: err?.message || "সার্ভার যাচাই ব্যর্থ হয়েছে", win: false });
        rollingRef.current = false;
        setRolling(false);
        return { pnl: 0 };
      }

      syncBalance(serverRes.newBalance);
      const final = serverRes.roll;
      const [d1, d2] = rollToDiceFaces(final);
      setDiceFaces([d1, d2]);
      setRoll(final);
      setDisplayRoll(final);

      try {
        sfxDiceLand(1);
      } catch {
        /* noop */
      }

      const isWin = serverRes.isWin;
      const won = serverRes.won;
      const mult = serverRes.mult;
      const pnl = serverRes.pnl;

      if (isWin) {
        setOutcome("win");
        setBanner({
          title: `জয় +৳${pnl.toLocaleString()} (${mult.toFixed(2)}×)`,
          win: true,
        });
        record({ pnl, multiplier: mult });
        fxRef.current?.burst({ count: turbo ? 32 : 70, kind: "confetti", speed: 9 });
        try {
          sfxWin(mult);
        } catch {
          /* noop */
        }
      } else {
        setOutcome("lose");
        setBanner({
          title: `হার -৳${roundBet.toLocaleString()} · রোল ${final.toFixed(2)}`,
          win: false,
        });
        record({ pnl, multiplier: 0 });
        fxRef.current?.burst({ count: 20, kind: "smoke", color: "#fb7185", speed: 4 });
        try {
          sfxBust();
        } catch {
          /* noop */
        }
      }

      setRecentRolls((prev) => [{ id: Date.now() + Math.random(), value: final, win: isWin, mult }, ...prev].slice(0, 14));
      pf.consume(`roll=${final} ${direction === "under" ? "<" : ">"}${target}`);
      recordMyBet({ game: "dice", bet: roundBet, multiplier: mult, payout: won });
      pushMultiplierHistory("dice", mult);

      rollingRef.current = false;
      setRolling(false);
      return { pnl };
    },
    [pf, userId, doPlayDice, turbo, direction, target, syncBalance, record],
  );

  const auto = useAutoBet({ runRound, baseBet: bet });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || feedTab === "auto" || auto.running || fairOpen) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (!rollingRef.current && !notLoggedIn && !noCoins && !maintenance) {
        void runRound(bet);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [feedTab, auto.running, fairOpen, bet, runRound, notLoggedIn, noCoins, maintenance]);

  const activeRollVal = rolling ? displayRoll : roll ?? 0;
  const rollPct = roll ?? 0;
  const winZoneLeft = direction === "under" ? "0%" : `${target}%`;
  const winZoneWidth = direction === "under" ? `${target}%` : `${100 - target}%`;
  const loseZoneLeft = direction === "under" ? `${target}%` : "0%";
  const loseZoneWidth = direction === "under" ? `${100 - target}%` : `${target}%`;

  return (
    <SiteShell>
      {/* PKOK Signature Emerald Casino Shell */}
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
                <span className="text-xl">🎲</span>
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wide text-amber-300">
                  Lucky Dice
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setTurbo((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                  turbo
                    ? "border-amber-300 bg-amber-400 text-black"
                    : "border-white/15 bg-white/10 text-white/80 hover:text-white"
                }`}
              >
                <Zap className="h-3.5 w-3.5" /> Turbo
              </button>
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
              desc="অ্যাডমিন সাময়িকভাবে Lucky Dice বন্ধ রেখেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।"
            />
          ) : notLoggedIn ? (
            <GuardCard
              icon={<LogIn className="h-10 w-10 text-emerald-300" />}
              title="লগইন প্রয়োজন"
              desc="খেলতে হলে আপনার অ্যাকাউন্টে লগইন করুন।"
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
                  TOP SECTION ("উপরে ইমেজ / গেম ডিসপ্লে") — CLEAR, COMPACT, BRIGHT
                 ════════════════════════════════════════════════════════════════ */}
              <section
                className="relative overflow-hidden rounded-3xl border-2 border-emerald-400/35 p-4 sm:p-5 shadow-2xl"
                style={{
                  background:
                    "radial-gradient(circle at 50% 35%, rgba(22,163,74,0.38), rgba(6,64,36,0.92) 60%, #042213 100%)",
                }}
              >
                {/* Recent Rolls Bar */}
                <div className="relative z-10 mb-3 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {rolling ? "রোল হচ্ছে..." : direction === "under" ? `রোল আন্ডার < ${target}` : `রোল ওভার > ${target}`}
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[70%]">
                    {recentRolls.length === 0 ? (
                      <span className="text-[11px] text-emerald-100/55">রোল করার পর এখানে হিস্ট্রি দেখাবে</span>
                    ) : (
                      recentRolls.map((item, idx) => (
                        <span
                          key={item.id}
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black tabular-nums ${
                            item.win
                              ? "bg-emerald-400 text-[#032010]"
                              : "bg-rose-500/80 text-white"
                          } ${idx === 0 ? "ring-2 ring-amber-300" : "opacity-85"}`}
                        >
                          {item.value.toFixed(2)}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Main Game Visual Row: 3D Ivory Casino Dice + Clear Numeric Score */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10 py-1">
                  {/* Bright Velvet Pedestal with Two Solid Ivory-Gold 3D Dice */}
                  <div
                    className={`relative flex items-center justify-center gap-4 rounded-3xl border-2 px-6 py-4 transition-all ${
                      outcome === "win" && !rolling
                        ? "border-emerald-300 bg-emerald-900/55 shadow-[0_0_36px_rgba(52,211,153,0.45)]"
                        : outcome === "lose" && !rolling
                          ? "border-rose-400/70 bg-rose-950/45 animate-crash-shake"
                          : "border-amber-300/45 bg-[#06301b]/85 shadow-inner"
                    }`}
                  >
                    <Die3D
                      value={diceFaces[0]}
                      rolling={rolling}
                      rollId={rollId}
                      turbo={turbo}
                      size={74}
                      theme="ivory-gold"
                      phaseOffset={0}
                      outcome={outcome}
                      dropHeight={64}
                    />
                    <Die3D
                      value={diceFaces[1]}
                      rolling={rolling}
                      rollId={rollId}
                      turbo={turbo}
                      size={74}
                      theme="ivory-gold"
                      phaseOffset={1}
                      outcome={outcome}
                      dropHeight={72}
                    />
                  </div>

                  {/* Crisp High-Contrast Result Number & Banner */}
                  <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                    <div className="text-[11px] font-bold uppercase tracking-widest text-amber-200/80">
                      রোল রেজাল্ট · {effectivePayout.toFixed(2)}× পেআউট
                    </div>
                    <div
                      className={`text-5xl sm:text-6xl font-black tracking-tight tabular-nums ${
                        rolling
                          ? "text-amber-200"
                          : outcome === "win"
                            ? "text-emerald-300 drop-shadow-[0_0_20px_rgba(52,211,153,0.75)] animate-cash-pop"
                            : outcome === "lose"
                              ? "text-rose-300"
                              : "text-white"
                      }`}
                    >
                      {activeRollVal.toFixed(2)}
                    </div>
                    <div className="mt-1 min-h-[26px]">
                      {banner ? (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-black ${
                            banner.win
                              ? "bg-emerald-400 text-[#032010]"
                              : "bg-rose-500 text-white"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {banner.title}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-100/75">
                          টার্গেট {direction === "under" ? `< ${target}` : `> ${target}`} · জয়ের সম্ভাবনা {winChance}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Clear Interactive 0–100 Range Track */}
                <div className="relative z-10 mt-4 rounded-2xl bg-[#031a0e]/80 px-4 pt-7 pb-3 border border-white/15">
                  {roll !== null && (
                    <div
                      className="pointer-events-none absolute top-1 z-20 -translate-x-1/2 transition-[left] duration-500"
                      style={{
                        left: `${Math.min(98, Math.max(2, rollPct))}%`,
                        transitionTimingFunction: "cubic-bezier(0.22, 1.35, 0.36, 1)",
                      }}
                    >
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-black tabular-nums shadow ${
                          outcome === "win" ? "bg-emerald-400 text-black" : "bg-rose-500 text-white"
                        }`}
                      >
                        {rollPct.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="relative flex h-6 items-center">
                    <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-black/50 ring-1 ring-white/20">
                      <div
                        className="absolute inset-y-0 transition-all duration-150"
                        style={{
                          left: loseZoneLeft,
                          width: loseZoneWidth,
                          background: "linear-gradient(90deg, #be123c, #f43f5e)",
                        }}
                      />
                      <div
                        className="absolute inset-y-0 transition-all duration-150"
                        style={{
                          left: winZoneLeft,
                          width: winZoneWidth,
                          background: "linear-gradient(90deg, #10b981, #34d399)",
                        }}
                      />
                    </div>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]"
                      style={{ left: `${target}%` }}
                    />
                    <input
                      type="range"
                      min={2}
                      max={98}
                      value={target}
                      disabled={rolling || auto.running}
                      onChange={(e) => setTarget(Number(e.target.value))}
                      aria-label="Target Roll"
                      className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>

                  <div className="mt-1.5 flex justify-between text-[11px] font-bold text-emerald-100/70">
                    <span>0</span>
                    <span>25</span>
                    <span className="text-amber-300">50</span>
                    <span>75</span>
                    <span>100</span>
                  </div>
                </div>

                <ParticleLayer ref={fxRef} />
              </section>

              {/* ════════════════════════════════════════════════════════════════
                  BOTTOM SECTION ("নিচে টাইপ, কাস্টমার দেখবে অ্যান্ড খেলবে")
                 ════════════════════════════════════════════════════════════════ */}
              <section className="rounded-3xl border border-emerald-400/30 bg-[#052314]/90 p-4 sm:p-5 shadow-xl">
                {/* Row 1: Mode + Type Target / Win % + Presets */}
                <div className="grid gap-3 md:grid-cols-12 md:items-center">
                  <div className="grid grid-cols-3 gap-2 md:col-span-7">
                    <button
                      type="button"
                      disabled={rolling || auto.running}
                      onClick={flipDirection}
                      className="flex flex-col justify-center rounded-xl border border-amber-300/40 bg-[#0a3c23] px-3 py-2 text-left hover:bg-[#0d4a2c] disabled:opacity-50"
                    >
                      <span className="text-[10px] font-bold uppercase text-amber-200/80">মোড বদলান</span>
                      <span className="mt-0.5 inline-flex items-center gap-1 text-xs sm:text-sm font-black text-amber-300">
                        <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                        {direction === "under" ? "Roll Under" : "Roll Over"}
                      </span>
                    </button>

                    <label className="rounded-xl border border-white/15 bg-[#03180d] px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase text-emerald-200/75">
                        টার্গেট ({direction === "under" ? "<" : ">"})
                      </span>
                      <input
                        type="number"
                        min={2}
                        max={98}
                        value={target}
                        disabled={rolling || auto.running}
                        onChange={(e) => setTarget(Math.min(98, Math.max(2, Math.round(Number(e.target.value) || 50))))}
                        className="mt-0.5 w-full bg-transparent text-base font-black text-white outline-none"
                      />
                    </label>

                    <label className="rounded-xl border border-white/15 bg-[#03180d] px-3 py-2">
                      <span className="block text-[10px] font-bold uppercase text-emerald-200/75">
                        জয়ের % ({effectivePayout.toFixed(2)}×)
                      </span>
                      <input
                        type="number"
                        min={2}
                        max={98}
                        value={winChance}
                        disabled={rolling || auto.running}
                        onChange={(e) => applyWinChance(Number(e.target.value))}
                        className="mt-0.5 w-full bg-transparent text-base font-black text-emerald-300 outline-none"
                      />
                    </label>
                  </div>

                  {/* Quick Target Chips */}
                  <div className="flex flex-wrap gap-1.5 md:col-span-5 md:justify-end">
                    {QUICK_TARGETS.map((q) => {
                      const active = direction === q.dir && target === q.target;
                      return (
                        <button
                          key={q.label}
                          type="button"
                          disabled={rolling || auto.running}
                          onClick={() => {
                            setDirection(q.dir);
                            setTarget(q.target);
                          }}
                          className={`rounded-xl border px-3 py-2 text-xs font-black transition ${
                            active
                              ? "border-amber-300 bg-amber-400 text-black"
                              : "border-white/15 bg-white/10 text-white hover:bg-white/20"
                          }`}
                        >
                          {q.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Row 2: Type Bet Amount + Quick Chips + BIG ROLL BUTTON */}
                <div className="mt-3 grid gap-3 md:grid-cols-12 md:items-stretch">
                  {/* Type Bet + ½ / 2× + Quick Chips */}
                  <div className="flex flex-col gap-2 md:col-span-7">
                    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#03160c] p-1.5">
                      <span className="pl-2.5 text-xs font-bold uppercase text-emerald-200/80">বাজি ৳</span>
                      <input
                        type="number"
                        min={minBet}
                        max={maxBet}
                        value={bet}
                        disabled={rolling || auto.running}
                        onChange={(e) => clampBet(Number(e.target.value))}
                        className="min-w-0 flex-1 bg-transparent px-2 text-lg font-black tabular-nums text-white outline-none"
                      />
                      <button
                        type="button"
                        disabled={rolling || auto.running}
                        onClick={() => clampBet(bet / 2)}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20"
                      >
                        ½
                      </button>
                      <button
                        type="button"
                        disabled={rolling || auto.running}
                        onClick={() => clampBet(bet * 2)}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black hover:bg-white/20"
                      >
                        2×
                      </button>
                      <button
                        type="button"
                        disabled={rolling || auto.running}
                        onClick={() => clampBet(maxBet)}
                        className="rounded-xl bg-amber-400/20 px-2.5 py-2 text-[11px] font-black text-amber-300 hover:bg-amber-400/30"
                      >
                        MAX
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-200/65 mr-1">দ্রুত বাজি (৳{minBet}–৳{maxBet}):</span>
                      {QUICK_CHIPS.map((c) => {
                        const val = Math.max(minBet, Math.min(maxBet, c));
                        return (
                          <button
                            key={c}
                            type="button"
                            disabled={rolling || auto.running}
                            onClick={() => setBet(val)}
                            className={`rounded-lg border px-2.5 py-1 text-xs font-black transition ${
                              bet === val
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

                  {/* Giant Clear PLAY / ROLL Button */}
                  <div className="flex flex-col justify-between gap-1.5 md:col-span-5">
                    {feedTab === "auto" ? (
                      <button
                        type="button"
                        onClick={() => (auto.running ? auto.stop() : auto.start())}
                        disabled={!pf.ready}
                        className={`flex-1 rounded-2xl py-4 text-lg font-black uppercase tracking-wider shadow-lg transition active:translate-y-0.5 ${
                          auto.running
                            ? "bg-rose-500 text-white"
                            : "bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-black"
                        }`}
                      >
                        {auto.running
                          ? `STOP AUTO (${auto.progress.done}${auto.cfg.numberOfBets ? `/${auto.cfg.numberOfBets}` : ""})`
                          : "START AUTO"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={rolling}
                        onClick={() => void runRound(bet)}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-yellow-300 via-amber-400 to-amber-500 py-4 text-lg font-black uppercase tracking-wider text-black shadow-[0_5px_0_0_#92400e] transition hover:brightness-110 active:translate-y-1 active:shadow-none disabled:opacity-50"
                      >
                        {rolling ? "রোল হচ্ছে..." : `রোল করুন · জিতলে ৳${expectedReturn.toLocaleString()}`}
                      </button>
                    )}
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold text-emerald-100/75">
                      <span>লাভ: <strong className="text-emerald-300">+৳{expectedProfit.toLocaleString()}</strong></span>
                      <span>Space চাপলেও রোল হবে</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* CLEAN COMPACT HISTORY / LIVE BETS / AUTO TABS BELOW CONTROLS */}
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
                    <button
                      type="button"
                      onClick={() => setFeedTab("auto")}
                      className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-black ${
                        feedTab === "auto" ? "bg-cyan-400 text-black" : "bg-white/10 text-white/80"
                      }`}
                    >
                      <Bot className="h-3.5 w-3.5" /> Auto Bet
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-100/70">Bets: <strong className="text-white">{stats.rounds}</strong></span>
                    <span className={`font-black ${stats.pnl >= 0 ? "text-emerald-300" : "text-rose-400"}`}>
                      {stats.pnl >= 0 ? `+৳${stats.pnl.toLocaleString()}` : `-৳${Math.abs(stats.pnl).toLocaleString()}`}
                    </span>
                    {stats.rounds > 0 && (
                      <button type="button" onClick={resetStats} className="text-[11px] text-white/50 hover:text-white">
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {feedTab === "auto" ? (
                  <AutoBetPanel auto={auto} canStart={pf.ready} />
                ) : feedTab === "history" ? (
                  <div className="max-h-52 overflow-y-auto">
                    {diceHistory.length === 0 ? (
                      <div className="py-6 text-center text-xs text-white/50">এখনও কোনো বেট নেই</div>
                    ) : (
                      <table className="w-full text-xs">
                        <thead className="text-white/50">
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
                              <tr key={h.id} className="border-t border-white/10">
                                <td className="py-1.5 font-mono">৳{h.bet}</td>
                                <td className={`py-1.5 text-right font-mono font-black ${won ? "text-emerald-300" : "text-white/40"}`}>
                                  {h.multiplier > 0 ? `${h.multiplier.toFixed(2)}×` : "—"}
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
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="text-white/50">
                        <tr>
                          <th className="py-1.5 text-left">Player</th>
                          <th className="py-1.5 text-right">Bet</th>
                          <th className="py-1.5 text-right">Mult</th>
                          <th className="py-1.5 text-right">Result</th>
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
                  <Activity className="h-4 w-4" /> Provably Fair Verification
                </div>
                <button type="button" onClick={() => setFairOpen(false)} className="rounded-lg bg-white/10 p-1 text-white">
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
