import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Coins,
  HelpCircle,
  History,
  Info,
  RotateCw,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import templeBg from "@/assets/fg2/temple-bg.jpg";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameConfig } from "@/hooks/useGameConfig";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import {
  fairFortuneGems2Spin,
  FG2_PAYLINES,
  FG2_PAYTABLE,
  type Fg2SpecialItem,
  type Fg2SpinResult,
  type Fg2Symbol,
} from "@/lib/provablyFair";
import {
  Fg2SpecialBadge,
  Fg2SymbolTile,
  LUCKY_WHEEL_WEDGES,
  LuckyWheelGraphic,
} from "@/components/games/fx/FortuneGems2Art";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxBust, sfxCashout, sfxPeg, sfxWin } from "@/lib/sound";

export const Route = createFileRoute("/games/fortune-gems-2")({
  head: () => ({
    meta: [
      { title: "Fortune Gems 2 — JILI Special Wheel | PKOK" },
      { name: "description", content: "JILI Fortune Gems 2 · 3×3 + 4th Special Multiplier Reel · Lucky Wheel 1000× · Extra Bet." },
    ],
  }),
  component: FortuneGems2Page,
});

const JILI_BET_LEVELS = [1, 2, 3, 5, 10, 20, 30, 50, 80, 100, 200, 400, 500, 800, 1000] as const;

const SHOWCASE_GRID: Fg2Symbol[][] = [
  ["WILD", "WILD", "WILD"],
  ["RED", "RED", "RED"],
  ["BLUE", "BLUE", "BLUE"],
];

const SHOWCASE_SPECIAL: [Fg2SpecialItem, Fg2SpecialItem, Fg2SpecialItem] = [5, 10, 15];

type Fg2HistoryRow = {
  id: string;
  ts: string;
  stake: number;
  win: number;
  mult: number;
  special: Fg2SpecialItem;
  wheelBonus: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function StonePillar({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`hidden sm:flex w-4 shrink-0 flex-col justify-between rounded-[3px] border-x border-[#2B1408] bg-[linear-gradient(90deg,#4A2C19_0%,#9E724F_42%,#B58660_55%,#442614_100%)] py-1.5 shadow-[inset_0_0_8px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="mx-0.5 h-3.5 rounded-[2px] border border-[#2B1408] bg-[linear-gradient(180deg,#A57A57,#634029)]" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="mx-0.5 h-2.5 rounded-[1px] border-y border-[#2B1408]/70 bg-[#5C3A23]/75"
        />
      ))}
      <div className="mx-0.5 h-4 rounded-[2px] border border-[#2B1408] bg-[linear-gradient(180deg,#A57A57,#5C3A23)]" />
    </div>
  );
}

function FortuneGems2Page() {
  const { balance, bet: placeBet, credit } = useDemoWallet();
  const { data: cfg } = useGameConfig("fortune-gems-2");
  const { stats, record } = useGameStats("fortune-gems-2");
  const pf = useProvablyFair("fortune-gems-2");

  const minBet = cfg?.min_bet ?? 1;
  const maxBet = cfg?.max_bet ?? 10000;
  const edge = cfg?.house_edge ?? 0.03;
  const maxPayoutMult = cfg?.config?.max_payout_mult ?? 0;
  const gameDisabled = cfg ? !cfg.is_enabled : false;

  const [extraBet, setExtraBet] = useState(false);

  const allowedBets = useMemo(() => {
    const valid = JILI_BET_LEVELS.filter((v) => {
      const stake = extraBet ? v * 1.5 : v;
      return stake >= minBet && stake <= maxBet;
    });
    return valid.length > 0 ? valid : [Math.max(1, Math.min(maxBet, minBet))];
  }, [minBet, maxBet, extraBet]);

  const [baseBet, setBaseBet] = useState<number>(() => {
    return allowedBets.find((v) => v >= 10) ?? allowedBets[0] ?? 10;
  });

  useEffect(() => {
    if (!allowedBets.includes(baseBet)) {
      setBaseBet(allowedBets.find((v) => v >= 10) ?? allowedBets[0]);
    }
  }, [allowedBets, baseBet]);

  const actualStake = +(baseBet * (extraBet ? 1.5 : 1)).toFixed(2);

  const [grid, setGrid] = useState<Fg2Symbol[][]>(() => SHOWCASE_GRID);
  const [specialReel, setSpecialReel] = useState<[Fg2SpecialItem, Fg2SpecialItem, Fg2SpecialItem]>(() => SHOWCASE_SPECIAL);
  const [reelSpinning, setReelSpinning] = useState<[boolean, boolean, boolean, boolean]>([false, false, false, false]);
  const [spinning, setSpinning] = useState(false);
  const [winningCells, setWinningCells] = useState<Set<string>>(new Set());
  const [winDisplay, setWinDisplay] = useState(0);
  const [lastResult, setLastResult] = useState<Fg2SpinResult | null>(null);

  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelRot, setWheelRot] = useState(18);
  const [wheelBanner, setWheelBanner] = useState<string | null>(null);

  const [turboMode, setTurboMode] = useState<0 | 1 | 2>(0);
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openBetGrid, setOpenBetGrid] = useState(false);
  const [openAutoModal, setOpenAutoModal] = useState(false);
  const [openInfo, setOpenInfo] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openFair, setOpenFair] = useState(false);
  const [showExHelp, setShowExHelp] = useState(false);
  const [history, setHistory] = useState<Fg2HistoryRow[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fxRef = useRef<ParticleBurstHandle>(null);
  const mountedRef = useRef(true);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  const speedScale = turboMode === 2 ? 0.35 : turboMode === 1 ? 0.6 : 1;

  const spinNow = useCallback(async () => {
    if (spinning || wheelModalOpen || !pf.ready || gameDisabled) return;

    const stake = +(baseBet * (extraBet ? 1.5 : 1)).toFixed(2);
    if (!placeBet(stake)) {
      setAutoSpinsLeft(0);
      setToastMsg(balance < stake ? "পর্যাপ্ত ব্যালেন্স নেই" : "লগইন করুন বা সীমার মধ্যে বাজি দিন");
      setTimeout(() => mountedRef.current && setToastMsg(null), 2200);
      return;
    }

    setSpinning(true);
    setOpenBetGrid(false);
    setOpenDrawer(false);
    setOpenAutoModal(false);
    setWinningCells(new Set());
    setWinDisplay(0);
    setLastResult(null);
    setWheelBanner(null);
    setReelSpinning([true, true, true, true]);

    const res = await fairFortuneGems2Spin(pf.serverSeed, pf.clientSeed, pf.nonce, {
      extraBet,
      edge,
    });

    await sleep(Math.round(220 * speedScale));
    if (!mountedRef.current) return;

    setGrid(res.grid);
    setSpecialReel(res.specialReel);

    for (let col = 0; col < 4; col++) {
      await sleep(Math.round((col === 3 ? 210 : 120) * speedScale));
      if (!mountedRef.current) return;
      if (soundOn) {
        try { sfxPeg(0.45 + col * 0.1); } catch { /* noop */ }
      }
      setReelSpinning((prev) => {
        const next = [...prev] as [boolean, boolean, boolean, boolean];
        next[col] = false;
        return next;
      });
    }

    const winSet = new Set<string>();
    for (const wl of res.winLines) {
      const rows = FG2_PAYLINES[wl.lineIndex];
      winSet.add(`0-${rows[0]}`);
      winSet.add(`1-${rows[1]}`);
      winSet.add(`2-${rows[2]}`);
    }
    setWinningCells(winSet);
    setLastResult(res);

    if (res.wheelTriggered && res.wheelPrizeMult > 0) {
      setWheelModalOpen(true);
      setWheelSpinning(true);
      const wedgeIdx = LUCKY_WHEEL_WEDGES.indexOf(res.wheelPrizeMult as (typeof LUCKY_WHEEL_WEDGES)[number]);
      const idx = wedgeIdx >= 0 ? wedgeIdx : 1;
      const sliceDeg = 360 / LUCKY_WHEEL_WEDGES.length;
      const targetDeg = wheelRot - (wheelRot % 360) + 360 * 5 - idx * sliceDeg;
      setWheelRot(targetDeg);
      if (soundOn) {
        try { sfxWin(4); } catch { /* noop */ }
      }
      await sleep(2700);
      if (!mountedRef.current) return;
      setWheelSpinning(false);
      const wTotal = +(baseBet * res.wheelPrizeMult * res.wheelExtraMult).toFixed(2);
      setWheelBanner(
        res.wheelExtraMult > 1
          ? `🎡 WHEEL ${res.wheelPrizeMult}× × ${res.wheelExtraMult} EX = ৳${wTotal.toLocaleString("en-US")}`
          : `🎡 LUCKY WHEEL ${res.wheelPrizeMult}× = ৳${wTotal.toLocaleString("en-US")}`,
      );
      if (soundOn) {
        try { sfxCashout(); } catch { /* noop */ }
      }
      fxRef.current?.burst({ count: 95, kind: "confetti", speed: 9 });
      await sleep(1400);
      if (!mountedRef.current) return;
      setWheelModalOpen(false);
    }

    const cappedMult =
      maxPayoutMult > 0
        ? Math.min(res.totalBaseBetMult, maxPayoutMult)
        : res.totalBaseBetMult;
    const wonAmount = Math.round(baseBet * cappedMult * 100) / 100;
    if (wonAmount > 0) {
      credit(wonAmount);
      setWinDisplay(wonAmount);
      if (!res.wheelTriggered) {
        if (soundOn) {
          try { cappedMult >= 5 ? sfxCashout() : sfxWin(cappedMult); } catch { /* noop */ }
        }
        if (cappedMult >= 3) {
          fxRef.current?.burst({ count: 55, kind: "confetti", speed: 7 });
        }
      }
    } else if (soundOn) {
      try { sfxBust(); } catch { /* noop */ }
    }

    const effectiveMultOnStake = stake > 0 ? +(wonAmount / stake).toFixed(4) : 0;
    const pnl = +(wonAmount - stake).toFixed(2);
    record({ pnl, multiplier: effectiveMultOnStake });
    recordMyBet({
      game: "fortune-gems-2",
      bet: stake,
      multiplier: effectiveMultOnStake,
      payout: wonAmount,
    });
    pushMultiplierHistory("fortune-gems-2", effectiveMultOnStake);

    setHistory((prev) =>
      [
        {
          id: `fg2-${pf.nonce}-${Date.now()}`,
          ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          stake,
          win: wonAmount,
          mult: effectiveMultOnStake,
          special: res.centerSpecial,
          wheelBonus: res.wheelPrizeMult * res.wheelExtraMult,
        },
        ...prev,
      ].slice(0, 30),
    );

    pf.consume(
      `fg2 stake=${stake} r4=${String(res.centerSpecial)} wheel=${res.wheelPrizeMult}x win=${wonAmount}`,
    );
    setSpinning(false);
  }, [
    spinning,
    wheelModalOpen,
    pf,
    gameDisabled,
    baseBet,
    extraBet,
    placeBet,
    balance,
    edge,
    speedScale,
    soundOn,
    wheelRot,
    maxPayoutMult,
    credit,
    record,
  ]);

  useEffect(() => {
    if (spinning || wheelModalOpen || !pf.ready || gameDisabled) return;
    if (autoSpinsLeft > 0) {
      autoTimerRef.current = setTimeout(() => {
        setAutoSpinsLeft((n) => Math.max(0, n - 1));
        spinNow();
      }, 480);
      return () => {
        if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      };
    }
  }, [spinning, wheelModalOpen, pf.ready, gameDisabled, autoSpinsLeft, spinNow]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        spinNow();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [spinNow]);

  const hasWins = winningCells.size > 0;

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-[#1D2D12] select-none">
      {/* Real Studio Painted Aztec Sunset Jungle Backdrop */}
      <img
        src={templeBg}
        alt=""
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_55%_45%,rgba(255,215,120,0.06),rgba(0,0,0,0.28))]"
      />

      {/* Compact Top PKOK Strip */}
      <header className="z-30 flex h-9 shrink-0 items-center justify-between border-b border-white/15 bg-black/55 px-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link
            to="/esports"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Lobby
          </Link>
          <span className="hidden text-[11px] font-black tracking-wide text-[#FFE066] sm:inline">
            JILI · FORTUNE GEMS 2 · 5 PAYLINES
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#111827]/85 px-2.5 py-0.5 font-mono text-xs font-bold text-[#4be125] ring-1 ring-[#4be125]/40">
            ৳{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <Link
            to="/wallet"
            className="rounded-full bg-[linear-gradient(180deg,#28a909,#187203)] px-2.5 py-0.5 text-xs font-black text-white shadow ring-1 ring-[#4be125]/60 hover:brightness-110"
          >
            + Deposit
          </Link>
        </div>
      </header>

      {/* 100vh Zero-Scroll JILI Stage */}
      <main className="relative z-10 flex flex-1 min-h-0 items-center justify-center p-1 sm:px-4 sm:py-2">
        <div className="relative flex h-full max-h-[600px] w-full max-w-[1080px] items-center justify-center">
          {/* Left Peeking Lucky Wheel (overlapping neatly under left stone pillar) */}
          <div className="pointer-events-none relative z-0 -mr-36 hidden w-[410px] shrink-0 lg:block xl:w-[435px]">
            <LuckyWheelGraphic bet={baseBet} rotationDeg={wheelRot} spinning={wheelSpinning} />
          </div>

          {/* Left Collapsible Gear Drawer (hidden overlap on narrow <640px mobile; tucked cleanly!) */}
          <div className="fixed left-0 top-1/2 z-40 hidden -translate-y-1/2 items-center sm:flex">
            {openDrawer && (
              <div className="flex flex-col gap-1.5 rounded-r-xl border border-l-0 border-[#D4A024] bg-[#2D1A0E]/95 p-2 shadow-2xl backdrop-blur">
                <button
                  type="button"
                  onClick={() => { setOpenInfo(true); setOpenDrawer(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  <Info className="h-4 w-4 text-[#FFD65A]" /> Paytable (i)
                </button>
                <button
                  type="button"
                  onClick={() => { setOpenHistory(true); setOpenDrawer(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  <History className="h-4 w-4 text-[#FFD65A]" /> History ({history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSoundOn((s) => !s)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  {soundOn ? <Volume2 className="h-4 w-4 text-[#4be125]" /> : <VolumeX className="h-4 w-4 text-rose-400" />}
                  Sound {soundOn ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpenFair(true); setOpenDrawer(false); }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Provably Fair
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setOpenDrawer((o) => !o)}
              aria-label="Toggle game drawer"
              className="flex h-11 w-8 items-center justify-center rounded-r-xl border border-l-0 border-[#D4A024] bg-[#4E311D]/95 text-[#FFD65A] shadow-lg hover:bg-[#6E4932]"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Sculpted Aztec Sandstone Temple Cabinet */}
          <div className="relative z-10 flex h-full w-full max-w-[780px] flex-col rounded-t-2xl rounded-b-xl border-[3px] border-[#A3734E] bg-[linear-gradient(180deg,#8C5E3E_0%,#5C3923_88%,#331C0E_100%)] p-1.5 shadow-[0_26px_75px_rgba(0,0,0,0.8)] sm:p-2">
            {gameDisabled && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl bg-black/80 p-6 text-center backdrop-blur">
                <p className="text-lg font-black text-[#FFE066]">গেমটি সাময়িকভাবে বন্ধ আছে</p>
                <p className="mt-1 text-xs text-white/70">অ্যাডমিন প্যানেল থেকে পুনরায় চালু করুন।</p>
              </div>
            )}

            {/* 1) Sculpted Cornice Header */}
            <div className="mb-1 grid shrink-0 grid-cols-4 items-center gap-1.5 px-1 sm:gap-2">
              <div className="col-span-3 flex h-9 items-center justify-center rounded-md border border-[#D4A024]/85 bg-[linear-gradient(180deg,#4A2914_0%,#241207_100%)] px-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7)]">
                <h1 className="truncate font-serif text-xs font-black uppercase tracking-wider sm:text-lg">
                  {extraBet ? (
                    <span className="text-[#FFF3B0]">
                      Score multiplier will be <span className="text-[#FF6B6B]">2X</span> or more
                    </span>
                  ) : (
                    <>
                      <span
                        className="bg-[linear-gradient(180deg,#FFF8CC_0%,#F4C04A_50%,#B8760A_100%)] bg-clip-text text-transparent"
                        style={{ filter: "drop-shadow(0 2px 2px #000)" }}
                      >
                        FORTUNE GEMS{" "}
                      </span>
                      <span className="text-[#E02424]" style={{ textShadow: "0 2px 3px #000" }}>
                        2
                      </span>
                    </>
                  )}
                </h1>
              </div>

              <div className="col-span-1 flex h-9 flex-col items-center justify-center rounded-md border border-[#F5C52C] bg-[linear-gradient(180deg,#A61B1B,#590808)] text-center shadow">
                <span className="text-[8px] font-black uppercase leading-none text-[#FFD65A] sm:text-[10px]">
                  SPECIAL
                </span>
                <span className="text-[8px] font-black uppercase leading-none text-[#FFD65A] sm:text-[10px]">
                  WHEEL
                </span>
              </div>
            </div>

            {/* 2) Carved Stone Pillars + 3×3 Reels + Stone Divider + 4th Special Wheel */}
            <div className="relative flex flex-1 min-h-0 items-stretch gap-1 rounded-xl bg-[#2B150A] p-1 shadow-inner sm:gap-1.5 sm:p-1.5">
              {toastMsg && (
                <div className="pointer-events-none absolute inset-x-8 top-1/2 z-40 -translate-y-1/2 rounded-xl border-2 border-[#FFE066] bg-black/85 px-4 py-2 text-center text-sm font-black text-[#FFE066] shadow-2xl">
                  {toastMsg}
                </div>
              )}

              <StonePillar />

              {/* Reels 1, 2, 3 */}
              <div className="grid flex-[3] min-h-0 grid-cols-3 gap-1 sm:gap-1.5">
                {[0, 1, 2].map((colIdx) => {
                  const spinCol = reelSpinning[colIdx];
                  return (
                    <div
                      key={colIdx}
                      className={`grid h-full min-h-0 grid-rows-3 gap-1 rounded-md bg-[linear-gradient(180deg,#7B5836_0%,#5B3E22_100%)] p-1 shadow-inner sm:gap-1.5 ${
                        spinCol ? "animate-pulse opacity-85 blur-[1.5px]" : ""
                      }`}
                    >
                      {[0, 1, 2].map((rowIdx) => {
                        const sym = grid[colIdx][rowIdx];
                        const isWin = winningCells.has(`${colIdx}-${rowIdx}`);
                        return (
                          <Fg2SymbolTile
                            key={`${colIdx}-${rowIdx}`}
                            sym={sym}
                            winning={isWin}
                            dim={hasWins && !isWin}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Divider Stone Pillar */}
              <StonePillar />

              {/* 4th Special Multiplier Reel */}
              <div
                className={`relative grid flex-1 min-h-0 grid-rows-3 gap-1 rounded-md p-1 sm:gap-1.5 transition-all ${
                  extraBet
                    ? "bg-[radial-gradient(circle_at_50%_50%,#C21F27_0%,#61090E_100%)] ring-2 ring-[#FFE680] shadow-[0_0_28px_rgba(255,214,90,0.9)]"
                    : "bg-[radial-gradient(circle_at_50%_50%,#8F151C_0%,#47090D_100%)] ring-1 ring-[#C89B3C]/75"
                } ${reelSpinning[3] ? "animate-pulse blur-[1.5px]" : ""}`}
              >
                {extraBet && (
                  <span className="pointer-events-none absolute -left-4 top-1/2 z-30 -translate-y-1/2 rounded-full border border-[#FFE066] bg-[linear-gradient(180deg,#FFD54F,#D97706)] px-1.5 py-0.5 text-[9px] font-black text-black shadow-lg">
                    EX↑
                  </span>
                )}

                {specialReel.map((item, rowIdx) => {
                  const isCenter = rowIdx === 1;
                  return (
                    <div
                      key={rowIdx}
                      className={`relative h-full min-h-0 rounded-lg ${
                        isCenter
                          ? "border-[3px] border-[#FFF099] bg-black/25 shadow-[0_0_22px_rgba(255,214,70,0.9),inset_0_0_14px_rgba(255,190,40,0.45)]"
                          : ""
                      }`}
                    >
                      <Fg2SpecialBadge item={item} extraBet={extraBet} active={isCenter} />
                    </div>
                  );
                })}
              </div>

              <StonePillar />

              {/* Extra Bet Toggle Pill anchored bottom-left */}
              <div className="pointer-events-none absolute bottom-1.5 left-2 sm:left-5 z-30 flex items-center gap-2">
                <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border-2 border-[#D4A024] bg-[linear-gradient(180deg,#642691,#3B1259)] px-2 py-0.5 shadow-xl">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#FFE066] text-[9px] font-black text-[#4A1C00]">
                    EX↑
                  </span>
                  <span className="text-[11px] font-bold text-white">Extra Bet</span>
                  <button
                    type="button"
                    disabled={spinning}
                    onClick={() => setExtraBet((e) => !e)}
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-black transition ${
                      extraBet
                        ? "bg-[#22C55E] text-black shadow-[0_0_10px_rgba(34,197,94,0.85)]"
                        : "bg-black/45 text-white/80 hover:bg-black/65"
                    } disabled:opacity-60`}
                  >
                    {extraBet ? "ON" : "OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExHelp((s) => !s)}
                    className="text-white/75 hover:text-[#FFE066]"
                    title="What is Extra Bet?"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </div>

                {lastResult && lastResult.totalBaseBetMult > 0 && (
                  <div className="rounded-full border border-[#FFE066]/75 bg-black/80 px-2.5 py-0.5 text-[11px] font-black text-[#FFE066] shadow">
                    {lastResult.winLines.length} Line · {String(lastResult.centerSpecial)}
                    {lastResult.centerSpecial !== "WHEEL" ? "x" : ""}
                    {lastResult.wheelTriggered && ` + Wheel ${lastResult.wheelPrizeMult}×`}
                  </div>
                )}
              </div>

              {showExHelp && (
                <div className="absolute bottom-11 left-3 z-40 max-w-xs rounded-xl border border-[#D4A024] bg-[#2D1442]/95 p-2.5 text-[11px] text-white/95 shadow-2xl">
                  <strong className="text-[#FFE066]">Extra Bet (+50% stake):</strong> Removes <strong>1x</strong> from the 4th reel (guaranteed <strong>2x–15x</strong> or Wheel!) and multiplies Lucky Wheel prizes by <strong>1x–15x</strong> up to <strong>15,000×</strong>!
                </div>
              )}

              <ParticleLayer ref={fxRef} />
            </div>

            {/* 3) Stepped Stone Dock Base */}
            <div className="relative mt-1 flex shrink-0 items-center justify-between gap-2 rounded-b-lg border-t-2 border-[#D4A024]/75 bg-[linear-gradient(180deg,#644029_0%,#472B1A_65%,#2B180D_100%)] px-2.5 py-1.5 shadow-inner sm:px-6">
              {openBetGrid && (
                <div className="absolute bottom-16 left-2 right-2 z-40 rounded-xl border-2 border-[#D4A024] bg-[#221D18]/95 p-3 shadow-2xl backdrop-blur">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-[#FFE066]">
                      Select Base Bet {extraBet ? "(×1.5 Extra Bet Active)" : ""}
                    </span>
                    <button type="button" onClick={() => setOpenBetGrid(false)} className="text-white/70 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {JILI_BET_LEVELS.map((val) => {
                      const stake = extraBet ? val * 1.5 : val;
                      const ok = stake >= minBet && stake <= maxBet;
                      const active = baseBet === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={!ok}
                          onClick={() => { setBaseBet(val); setOpenBetGrid(false); }}
                          className={`rounded-lg py-1.5 text-xs font-black transition ${
                            active
                              ? "bg-[linear-gradient(180deg,#FFD54F,#D99B00)] text-black ring-2 ring-white"
                              : ok
                                ? "bg-[#3A3025] text-white hover:bg-[#524334]"
                                : "bg-black/30 text-white/25 cursor-not-allowed"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Left Stats + Mobile Settings button */}
              <div className="flex items-center gap-3 sm:gap-6">
                <button
                  type="button"
                  onClick={() => setOpenInfo(true)}
                  aria-label="Paytable and Info"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4A024] bg-[#3B2514] text-[#FFD65A] sm:hidden"
                >
                  <Info className="h-4 w-4" />
                </button>

                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold text-[#F2C94C] sm:text-[11px]">Balance</span>
                  <span className="font-mono text-xs font-black text-white sm:text-sm">
                    {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={spinning}
                  onClick={() => setOpenBetGrid((o) => !o)}
                  className="flex flex-col items-center rounded-lg px-2 py-0.5 hover:bg-white/10 disabled:opacity-60"
                >
                  <Coins className="h-4 w-4 text-[#F2C94C] sm:h-5 sm:w-5" />
                  <span className="text-[11px] font-black text-white sm:text-xs">
                    Bet {actualStake}
                  </span>
                </button>

                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-bold text-[#F2C94C] sm:text-[11px]">WIN</span>
                  <span className="font-mono text-xs font-black text-[#FFF3B0] sm:text-sm">
                    {winDisplay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Right Action Controls */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTurboMode((m) => ((m + 1) % 3) as 0 | 1 | 2)}
                  title="Turbo / Super Turbo"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition sm:h-10 sm:w-10 ${
                    turboMode === 2
                      ? "border-[#FFE066] bg-[#B81212] text-[#FFE066]"
                      : turboMode === 1
                        ? "border-[#FFE066] bg-[#855A18] text-[#FFE066]"
                        : "border-[#9C7A54] bg-[#3B2514] text-white/80"
                  }`}
                >
                  <Zap className="h-4 w-4 fill-current" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (autoSpinsLeft > 0) setAutoSpinsLeft(0);
                    else setOpenAutoModal(true);
                  }}
                  title="Auto Spin"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-mono text-[10px] font-black transition sm:h-10 sm:w-10 sm:text-xs ${
                    autoSpinsLeft > 0
                      ? "border-[#4be125] bg-[#165A16] text-white"
                      : "border-[#C89B3C] bg-[#3B2514] text-[#FFE066]"
                  }`}
                >
                  {autoSpinsLeft > 0 ? autoSpinsLeft : "AUTO"}
                </button>

                <button
                  type="button"
                  disabled={spinning || wheelModalOpen || !pf.ready || gameDisabled}
                  onClick={spinNow}
                  aria-label="Spin"
                  className={`relative -my-2 flex h-13 w-13 items-center justify-center rounded-full border-[3px] border-[#FFF3B0] bg-[radial-gradient(circle_at_35%_30%,#FFE57F_0%,#F2B705_58%,#B87800_100%)] shadow-[0_0_24px_rgba(242,183,5,0.75),inset_0_2px_4px_rgba(255,255,255,0.75)] transition hover:scale-105 active:scale-95 disabled:opacity-70 sm:h-16 sm:w-16 ${
                    spinning ? "animate-pulse" : ""
                  }`}
                >
                  <RotateCw className={`h-8 w-8 text-white drop-shadow sm:h-9 sm:w-9 ${spinning ? "animate-spin" : ""}`} />
                  <span className="pointer-events-none absolute text-[8px] font-black text-[#5E3800] sm:text-[9px]">
                    JILI
                  </span>
                </button>

                <Wifi className="hidden h-4 w-4 text-[#4be125] sm:block" />
              </div>
            </div>

            <div className="mt-1 flex shrink-0 items-center justify-between px-1 text-[10px] text-white/60">
              <span>v_6_8 · {stats.rounds} spins</span>
              <span>Transaction PF-{pf.nonce}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Lucky Wheel Modal when WHEEL triggers */}
      {wheelModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="mb-3 rounded-full border-2 border-[#FFE066] bg-[linear-gradient(180deg,#9E1818,#5A0B0B)] px-6 py-1.5 text-base font-black uppercase tracking-wider text-[#FFE066] shadow-2xl">
            SPECIAL LUCKY WHEEL!
          </div>
          <div className="w-72 sm:w-80">
            <LuckyWheelGraphic bet={baseBet} rotationDeg={wheelRot} spinning={wheelSpinning} />
          </div>
          {wheelBanner && (
            <div className="mt-4 animate-cash-pop rounded-xl border-2 border-[#FFE066] bg-[linear-gradient(180deg,#15803d,#052e16)] px-5 py-2.5 text-center text-base font-black text-[#FFE066] shadow-2xl">
              {wheelBanner}
            </div>
          )}
        </div>
      )}

      {/* Auto Spin Settings Modal */}
      {openAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-2 border-[#D4A024] bg-[#2D1A0E] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-black uppercase text-[#FFE066]">Auto Spin</h2>
              <button type="button" onClick={() => setOpenAutoModal(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setOpenAutoModal(false); setAutoSpinsLeft(n); }}
                  className="rounded-xl border border-[#D4A024] bg-[#4E311D] py-2.5 text-sm font-black text-[#FFE066] hover:bg-[#6E4932]"
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Paytable & 5 Paylines Modal */}
      {openInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#D4A024] bg-[#3B2313] p-5 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-2">
              <h2 className="text-base font-black text-[#FFE066]">Fortune Gems 2 — Paytable (Base Bet ৳{baseBet})</h2>
              <button type="button" onClick={() => setOpenInfo(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(Object.keys(FG2_PAYTABLE) as Fg2Symbol[]).map((sym) => {
                const m = FG2_PAYTABLE[sym];
                return (
                  <div key={sym} className="flex items-center justify-between rounded-xl bg-black/35 px-3 py-2 border border-white/10">
                    <span className="font-serif font-black text-[#FFE066]">{sym}</span>
                    <span className="font-mono font-bold text-white">
                      3× ৳{(baseBet * m).toFixed(2)} ({m}×)
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 rounded-xl bg-black/35 p-3 text-xs text-white/85">
              <p><strong className="text-[#FFE066]">5 Fixed Paylines:</strong> 3 Horizontal rows + Top-Left↘Bottom-Right & Bottom-Left↗Top-Right diagonals.</p>
              <p><strong className="text-[#FFE066]">4th Special Wheel Reel:</strong> Multiplies all line wins by <strong>1x, 2x, 3x, 5x, 10x, or 15x</strong>. Landing <strong>WHEEL</strong> in the center with a win triggers the <strong>Lucky Wheel</strong> (up to <strong>1,000×</strong>!).</p>
              <p><strong className="text-[#FFE066]">Extra Bet (+50%):</strong> Removes <strong>1x</strong> from the 4th reel and adds an extra <strong>1x–15x</strong> multiplier to Lucky Wheel prizes (up to <strong>15,000×</strong>!).</p>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {openHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#D4A024] bg-[#2D1A0E] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-black uppercase text-[#FFE066]">Spin History</h2>
              <button type="button" onClick={() => setOpenHistory(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="py-8 text-center text-xs text-white/50">No spins yet</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg bg-black/40 px-3 py-2">
                    <div>
                      <span className="font-mono text-white/60">{h.ts}</span>
                      <span className="ml-2 rounded bg-[#6B1218] px-1.5 py-0.5 text-[10px] font-bold text-[#FFE066]">
                        {String(h.special)}{h.special !== "WHEEL" ? "x" : ""}
                      </span>
                    </div>
                    <div className="font-mono">
                      ৳{h.stake} →{" "}
                      <span className={h.win > 0 ? "font-black text-[#4be125]" : "text-white/50"}>
                        ৳{h.win.toFixed(2)} ({h.mult.toFixed(2)}×)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Provably Fair Modal */}
      {openFair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#12141f] p-4 text-white shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase text-[#FFE066]">Provably Fair · Fortune Gems 2</h2>
              <button type="button" onClick={() => setOpenFair(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ProvablyFairPanel pf={pf} gameKey="fortune-gems-2" />
          </div>
        </div>
      )}
    </div>
  );
}
