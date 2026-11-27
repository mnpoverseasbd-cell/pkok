import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Sparkles, Volume2, VolumeX, Zap } from "lucide-react";
import {
  BetControls,
  ControlsPanel,
  GameFrame,
  GameShell,
  MultDisplay,
  PrimaryButton,
} from "@/components/games/GameShell";
import { Die3D } from "@/components/games/Die3D";
import { StatsBar } from "@/components/games/StatsBar";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { useGameConfig } from "@/hooks/useGameConfig";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { fairDice } from "@/lib/provablyFair";
import { recordMyBet } from "@/lib/liveFeed";
import { isMuted, sfxBust, sfxDiceLand, sfxDiceShake, sfxWin, toggleMuted } from "@/lib/sound";

export const Route = createFileRoute("/games/dice")({
  head: () => ({
    meta: [
      { title: "Lucky Dice — Asik Game" },
      { name: "description", content: "3D লাইভ স্টুডিও ডাইস — Roll Over / Under প্রিডিক্ট করে ইনস্ট্যান্ট মাল্টিপ্লায়ার জিতুন।" },
    ],
  }),
  component: DiceGame,
});

type Direction = "under" | "over";
type RecentRoll = { id: number; value: number; win: boolean; mult: number };

const STRATEGY_PRESETS: Array<{ label: string; dir: Direction; target: number }> = [
  { label: "75% Safe", dir: "under", target: 75 },
  { label: "50 / 50", dir: "under", target: 50 },
  { label: "2.0×", dir: "under", target: 49 },
  { label: "3.0×", dir: "over", target: 67 },
  { label: "5.0×", dir: "over", target: 80 },
  { label: "10× Sniper", dir: "under", target: 10 },
];

const QUICK_CHIPS = [
  { val: 10, label: "10", bg: "from-sky-500 to-blue-700", ring: "border-sky-300" },
  { val: 50, label: "50", bg: "from-emerald-500 to-green-700", ring: "border-emerald-300" },
  { val: 100, label: "100", bg: "from-rose-500 to-red-700", ring: "border-rose-300" },
  { val: 500, label: "500", bg: "from-purple-500 to-violet-800", ring: "border-purple-300" },
  { val: 1000, label: "1K", bg: "from-amber-400 to-amber-700", ring: "border-yellow-200" },
];

function rollToDiceFaces(val: number): [number, number] {
  const idx = Math.min(35, Math.max(0, Math.floor((val / 100) * 36)));
  return [Math.floor(idx / 6) + 1, (idx % 6) + 1];
}

function DiceGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("dice");
  const { data: cfg } = useGameConfig("dice");
  const edge = cfg?.house_edge ?? 0;
  const multScale = Number(cfg?.config?.payout_multiplier ?? 1);
  const maxCapMult = Number(cfg?.config?.max_payout_mult ?? 0);

  const pf = useProvablyFair("dice");

  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(50);
  const [direction, setDirection] = useState<Direction>("under");
  const [rolling, setRolling] = useState(false);
  const [rollId, setRollId] = useState(0);
  const [roll, setRoll] = useState<number | null>(null);
  const [displayRoll, setDisplayRoll] = useState<number>(0);
  const [diceFaces, setDiceFaces] = useState<[number, number]>([3, 5]);
  const [outcome, setOutcome] = useState<"idle" | "win" | "lose">("idle");
  const [lastBanner, setLastBanner] = useState<{ text: string; sub: string; win: boolean } | null>(null);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [turbo, setTurbo] = useState(false);
  const [muted, setMutedState] = useState(() => isMuted());
  const [recentRolls, setRecentRolls] = useState<RecentRoll[]>([]);

  const fxRef = useRef<ParticleBurstHandle>(null);
  const rollingRef = useRef(false);

  const winChance = Math.min(98, Math.max(2, direction === "under" ? target : 100 - target));
  const basePayout = winChance > 0 ? +(99 / winChance).toFixed(4) : 0;
  const scaledPayout =
    basePayout * (1 - edge) * (Number.isFinite(multScale) && multScale > 0 ? multScale : 1);
  const effectivePayout =
    Number.isFinite(maxCapMult) && maxCapMult > 0 ? Math.min(scaledPayout, maxCapMult) : scaledPayout;

  const expectedReturn = Math.floor(bet * effectivePayout);
  const expectedProfit = Math.max(0, expectedReturn - bet);

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
        setLastBanner({ text: "পর্যাপ্ত ব্যালেন্স নেই", sub: "দয়া করে কয়েন ডিপোজিট করুন", win: false });
        return { pnl: 0 };
      }

      rollingRef.current = true;
      setRolling(true);
      setOutcome("idle");
      setLastBanner(null);
      setRollId((r) => r + 1);

      const finalPromise = fairDice(pf.serverSeed, pf.clientSeed, pf.nonce);

      try {
        sfxDiceShake();
      } catch {
        /* noop */
      }

      // Live odometer & mid-air dice rattle timeline
      const animMs = turbo ? 260 : 820;
      const steps = turbo ? 5 : 12;
      const stepDelay = Math.floor(animMs / steps);

      for (let i = 0; i < steps; i++) {
        const sim = +(Math.random() * 99.99).toFixed(2);
        setDisplayRoll(sim);
        if (!turbo && i === Math.floor(steps * 0.65)) {
          try {
            sfxDiceLand(0.6);
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
        await new Promise((r) => setTimeout(r, stepDelay));
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
      let pnl: number;
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
        setLastBanner({
          text: `+৳${pnl.toLocaleString()} জয়!`,
          sub: `${mult.toFixed(2)}× পেআউট · রোল ${final.toFixed(2)}`,
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
        pnl = -roundBet;
        setOutcome("lose");
        setLastBanner({
          text: `৳${roundBet.toLocaleString()} হার`,
          sub: `রোল ${final.toFixed(2)} · টার্গেট ${direction === "under" ? `< ${target}` : `> ${target}`}`,
          win: false,
        });
        record({ pnl, multiplier: 0 });
        fxRef.current?.burst({ count: 24, kind: "smoke", color: "#fb7185", speed: 4 });
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
    [pf, placeBet, turbo, direction, target, basePayout, edge, credit, maxCapMult, multScale, record],
  );

  const auto = useAutoBet({ runRound, baseBet: bet });

  // Spacebar quick-roll shortcut (Manual mode only, outside text inputs)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || mode !== "manual" || auto.running) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      if (!rollingRef.current) void runRound(bet);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, auto.running, bet, runRound]);

  const rollPct = roll ?? 0;
  const winZoneLeft = direction === "under" ? "0%" : `${target}%`;
  const winZoneWidth = direction === "under" ? `${target}%` : `${100 - target}%`;
  const loseZoneLeft = direction === "under" ? `${target}%` : "0%";
  const loseZoneWidth = direction === "under" ? `${100 - target}%` : `${target}%`;

  const lo = cfg?.min_bet ?? 10;
  const hi = cfg?.max_bet ?? 10000;

  return (
    <GameShell title="Lucky Dice Studio" emoji="🎲" gameKey="dice">
      <GameFrame>
        {/* Main Evolution / Stake Studio Felt Stage */}
        <div
          className="relative flex flex-1 flex-col justify-between overflow-hidden rounded-3xl border border-amber-400/25 p-4 sm:p-6 min-h-[470px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 25%, rgba(16, 185, 129, 0.20) 0%, rgba(6, 78, 59, 0.28) 38%, rgba(4, 24, 18, 0.94) 80%, #020c09 100%)",
            boxShadow:
              "inset 0 0 80px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(250, 204, 21, 0.25)",
          }}
        >
          {/* Decorative Casino Brass Corner Accents & Felt Arc */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 rounded-2xl border border-amber-300/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/10"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-300/[0.06]"
          />

          {/* Top Studio Header Strip */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-950/75 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                Live Studio Table
              </span>
              <button
                type="button"
                onClick={() => setTurbo((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  turbo
                    ? "border-amber-400 bg-amber-400/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                    : "border-white/15 bg-black/40 text-white/60 hover:text-white"
                }`}
                title="Fast roll animation"
              >
                <Zap className="h-3 w-3" /> Turbo
              </button>
              <button
                type="button"
                onClick={() => setMutedState(toggleMuted())}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/40 p-1.5 text-white/75 hover:border-white/30 hover:text-white"
                title={muted ? "Unmute SFX" : "Mute SFX"}
              >
                {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Live Recent Roll Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full py-0.5">
              {recentRolls.length === 0 ? (
                <span className="text-[11px] font-medium text-white/40">রোল হিস্ট্রি এখানে দেখাবে</span>
              ) : (
                recentRolls.map((item, idx) => (
                  <span
                    key={item.id}
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-black tabular-nums transition-all ${
                      item.win
                        ? "border border-emerald-400/50 bg-emerald-500/25 text-emerald-200"
                        : "border border-rose-400/35 bg-rose-500/20 text-rose-200"
                    } ${idx === 0 ? "ring-2 ring-amber-300/60 scale-105" : "opacity-80"}`}
                  >
                    {item.value.toFixed(2)}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Centerpiece: Twin 3D Physics Dice + Precision Numeric Dial */}
          <div className="relative z-10 my-4 flex flex-col items-center justify-center gap-4">
            <div className="relative flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
              {/* Table win/bust shockwave aura */}
              {!rolling && outcome !== "idle" && (
                <div
                  aria-hidden
                  className={`pointer-events-none absolute left-1/2 top-1/2 -z-10 h-44 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-500 ${
                    outcome === "win" ? "bg-emerald-500/30" : "bg-rose-500/25"
                  }`}
                />
              )}

              {/* Twin 3D VIP Casino Dice on Velvet Tray */}
              <div
                className={`relative flex items-center gap-3 rounded-3xl border px-5 py-4 transition-all duration-300 ${
                  outcome === "win" && !rolling
                    ? "border-emerald-400/60 bg-emerald-950/45 shadow-[0_0_40px_rgba(16,185,129,0.28)]"
                    : outcome === "lose" && !rolling
                      ? "border-rose-400/45 bg-rose-950/35 animate-crash-shake"
                      : "border-amber-300/20 bg-black/35"
                }`}
              >
                <Die3D
                  value={diceFaces[0]}
                  rolling={rolling}
                  rollId={rollId}
                  turbo={turbo}
                  size={74}
                  theme="emerald-gold"
                  phaseOffset={0}
                  outcome={outcome}
                />
                <Die3D
                  value={diceFaces[1]}
                  rolling={rolling}
                  rollId={rollId}
                  turbo={turbo}
                  size={74}
                  theme="obsidian-gold"
                  phaseOffset={1}
                  outcome={outcome}
                />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/40 bg-[#071c14] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300 shadow">
                  Pip {diceFaces[0] + diceFaces[1]}
                </div>
              </div>

              {/* Hero Digital Roll Gauge */}
              <div className="flex flex-col items-center sm:items-start">
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300/75">
                  {rolling ? "রোলিং চলছে..." : roll === null ? "Roll Ready" : outcome === "win" ? "Winning Roll" : "Result"}
                </span>
                <div
                  className={`mt-0.5 text-5xl sm:text-6xl font-black tracking-tight tabular-nums transition-transform duration-200 ${
                    rolling
                      ? "text-amber-200"
                      : outcome === "win"
                        ? "text-emerald-300 drop-shadow-[0_0_24px_rgba(16,185,129,0.65)] animate-cash-pop"
                        : outcome === "lose"
                          ? "text-rose-300 drop-shadow-[0_0_20px_rgba(244,63,94,0.55)]"
                          : "text-white/85"
                  }`}
                >
                  {(rolling ? displayRoll : roll ?? 0).toFixed(2)}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs font-bold text-white/70">
                  <span className="rounded-md bg-white/10 px-2 py-0.5">
                    {direction === "under" ? `রোল আন্ডার < ${target}` : `রোল ওভার > ${target}`}
                  </span>
                  <span className="text-amber-300">{effectivePayout.toFixed(2)}×</span>
                </div>
              </div>
            </div>

            {/* Result Toast Banner */}
            <div className="min-h-[34px] flex items-center justify-center">
              {lastBanner ? (
                <div
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1 text-xs font-black tracking-wide shadow-lg animate-fade-in ${
                    lastBanner.win
                      ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                      : "border-rose-400/50 bg-rose-500/20 text-rose-200"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{lastBanner.text}</span>
                  <span className="opacity-75">· {lastBanner.sub}</span>
                </div>
              ) : (
                <span className="text-xs text-white/45">
                  স্লাইডার সেট করে রোল করুন অথবা <kbd className="rounded border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px]">Space</kbd> চাপুন
                </span>
              )}
            </div>
          </div>

          {/* Interactive Dual-Zone Precision Roll Gauge */}
          <div className="relative z-10 mt-2 rounded-2xl border border-white/10 bg-black/45 px-4 pt-9 pb-4 backdrop-blur-sm">
            {/* Animated Pinpoint Roll Needle Marker */}
            {roll !== null && (
              <div
                className="pointer-events-none absolute top-1.5 z-20 -translate-x-1/2 transition-[left] duration-500"
                style={{
                  left: `calc(${Math.min(98, Math.max(2, rollPct))}% )`,
                  transitionTimingFunction: "cubic-bezier(0.22, 1.35, 0.36, 1)",
                }}
              >
                <div
                  className={`rounded-md border px-2 py-0.5 text-[11px] font-black tabular-nums shadow-lg ${
                    outcome === "win"
                      ? "border-emerald-300 bg-emerald-500 text-[#021a0e] shadow-emerald-500/40"
                      : "border-rose-300 bg-rose-500 text-white shadow-rose-500/40"
                  }`}
                >
                  {rollPct.toFixed(2)}
                </div>
                <div
                  className={`mx-auto h-2 w-0.5 ${
                    outcome === "win" ? "bg-emerald-300" : "bg-rose-300"
                  }`}
                />
              </div>
            )}

            {/* Gauge Track */}
            <div className="relative flex h-6 items-center">
              <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-900 ring-1 ring-white/15">
                {/* Lose Zone */}
                <div
                  className="absolute inset-y-0 transition-all duration-200"
                  style={{
                    left: loseZoneLeft,
                    width: loseZoneWidth,
                    background: "linear-gradient(90deg, rgba(225,29,72,0.45), rgba(244,63,94,0.65))",
                  }}
                />
                {/* Win Zone */}
                <div
                  className="absolute inset-y-0 transition-all duration-200"
                  style={{
                    left: winZoneLeft,
                    width: winZoneWidth,
                    background: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                    boxShadow: "0 0 18px rgba(16,185,129,0.7)",
                  }}
                />
              </div>

              {/* Gold Diamond Slider Handle */}
              <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 z-10 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-md border-2 border-amber-100 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 shadow-[0_0_16px_rgba(251,191,36,0.85)] transition-[left] duration-75"
                style={{ left: `${target}%` }}
              />

              {/* Accessible Range Input Overlay */}
              <input
                type="range"
                min={2}
                max={98}
                value={target}
                disabled={rolling || auto.running}
                onChange={(e) => setTarget(Number(e.target.value))}
                aria-label="Target Roll Threshold"
                className="absolute inset-0 z-20 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
            </div>

            {/* Scale Ticks */}
            <div className="mt-2 flex justify-between text-[10px] font-bold tracking-wider text-white/50">
              {[0, 25, 50, 75, 100].map((mark) => (
                <span key={mark} className={mark === 50 ? "text-amber-300/80" : ""}>
                  {mark}
                </span>
              ))}
            </div>

            {/* Bottom Studio Target / Direction / Strategy Bar */}
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3 sm:grid-cols-3">
              <button
                type="button"
                disabled={rolling || auto.running}
                onClick={flipDirection}
                className="flex items-center justify-between rounded-xl border border-amber-400/30 bg-emerald-950/60 px-3 py-2 text-left transition hover:border-amber-300 disabled:opacity-50"
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">মোড পাল্টান</div>
                  <div className="text-xs font-black text-amber-200">
                    {direction === "under" ? `রোল আন্ডার < ${target}` : `রোল ওভার > ${target}`}
                  </div>
                </div>
                <ArrowLeftRight className="h-4 w-4 text-amber-300" />
              </button>

              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-black/40 px-3 py-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">টার্গেট</div>
                  <input
                    type="number"
                    min={2}
                    max={98}
                    value={target}
                    disabled={rolling || auto.running}
                    onChange={(e) => setTarget(Math.min(98, Math.max(2, Math.round(Number(e.target.value) || 50))))}
                    className="w-16 bg-transparent text-sm font-black text-white outline-none"
                  />
                </div>
                <span className="text-[11px] font-bold text-emerald-300">{winChance}% Win</span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-white/15 bg-black/40 px-3 py-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">জয়ের % সেট</div>
                  <input
                    type="number"
                    min={2}
                    max={98}
                    value={winChance}
                    disabled={rolling || auto.running}
                    onChange={(e) => applyWinChance(Number(e.target.value))}
                    className="w-16 bg-transparent text-sm font-black text-cyan-300 outline-none"
                  />
                </div>
                <span className="text-xs font-black text-amber-300">{effectivePayout.toFixed(2)}×</span>
              </div>
            </div>

            {/* One-Click Strategy Presets */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-white/45">Preset:</span>
              {STRATEGY_PRESETS.map((p) => {
                const active = direction === p.dir && target === p.target;
                return (
                  <button
                    key={p.label}
                    type="button"
                    disabled={rolling || auto.running}
                    onClick={() => {
                      setDirection(p.dir);
                      setTarget(p.target);
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold transition disabled:opacity-45 ${
                      active
                        ? "border-emerald-400 bg-emerald-500/25 text-emerald-200"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ParticleLayer ref={fxRef} />
        </div>

        {/* Right Controls Panel */}
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={rolling || auto.running} />

          <MultDisplay
            label="পেআউট মাল্টিপ্লায়ার"
            value={`${effectivePayout.toFixed(2)}×`}
            sub={
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <span>
                  সম্ভাবনা: <strong className="text-emerald-300">{winChance}%</strong>
                </span>
                <span>
                  লাভ: <strong className="text-amber-300">+৳{expectedProfit.toLocaleString()}</strong>
                </span>
              </div>
            }
          />

          {/* Quick Casino Chip Selector */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-200/70">কুইক চিপস</span>
            <div className="grid grid-cols-5 gap-1.5">
              {QUICK_CHIPS.map((chip) => {
                const clampedVal = Math.max(lo, Math.min(hi, chip.val));
                const active = bet === clampedVal;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    disabled={rolling || auto.running}
                    onClick={() => setBet(clampedVal)}
                    className={`flex h-10 items-center justify-center rounded-full border-2 border-dashed bg-gradient-to-b ${chip.bg} ${chip.ring} text-[11px] font-black text-white shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-40 ${
                      active ? "ring-2 ring-amber-300 scale-105" : "opacity-85"
                    }`}
                  >
                    ৳{chip.label}
                  </button>
                );
              })}
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={rolling || auto.running} />

          {mode === "manual" ? (
            <PrimaryButton tone="gold" onClick={() => void runRound(bet)} disabled={rolling}>
              {rolling ? "রোল হচ্ছে..." : `রোল · ৳${expectedReturn.toLocaleString()}`}
            </PrimaryButton>
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready} />
          )}

          <ProvablyFairPanel pf={pf} gameKey="dice" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="dice" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
