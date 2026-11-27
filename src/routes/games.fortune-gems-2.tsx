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

const SHOWCASE_SPECIAL: [Fg2SpecialItem, Fg2SpecialItem, Fg2SpecialItem] = [10, 15, "WHEEL"];

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

function FortuneGems2Page() {
  const { balance, bet: placeBet, credit } = useDemoWallet();
  const { data: cfg } = useGameConfig("fortune-gems-2");
  const { stats, record } = useGameStats("fortune-gems-2");
  const pf = useProvablyFair("fortune-gems-2");

  const minBet = cfg?.min_bet ?? 1;
  const maxBet = cfg?.max_bet ?? 10000;
  const edge = cfg?.house_edge ?? 0.03;
  const maxPayoutMult = cfg?.max_payout_mult ?? 0;
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

  // Lucky Wheel modal + rotation state
  const [wheelModalOpen, setWheelModalOpen] = useState(false);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [wheelRot, setWheelRot] = useState(18);
  const [wheelBanner, setWheelBanner] = useState<string | null>(null);

  // Controls
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

    // Sequential column stops: 3 main reels + 4th Special Wheel reel
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

    // Highlight winning 3×3 paylines
    const winSet = new Set<string>();
    for (const wl of res.winLines) {
      const rows = FG2_PAYLINES[wl.lineIndex];
      winSet.add(`0-${rows[0]}`);
      winSet.add(`1-${rows[1]}`);
      winSet.add(`2-${rows[2]}`);
    }
    setWinningCells(winSet);
    setLastResult(res);

    // If Special Wheel triggered, pop Lucky Wheel forward and spin to exact prize wedge!
    if (res.wheelTriggered && res.wheelPrizeMult > 0) {
      setWheelModalOpen(true);
      setWheelSpinning(true);
      const wedgeIdx = LUCKY_WHEEL_WEDGES.indexOf(res.wheelPrizeMult as (typeof LUCKY_WHEEL_WEDGES)[number]);
      const idx = wedgeIdx >= 0 ? wedgeIdx : 1;
      const sliceDeg = 360 / LUCKY_WHEEL_WEDGES.length;
      // Rotate so wedge idx stops under top pointer (-idx * sliceDeg) + 5 full rotations
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

  // Auto spin queue
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

  // Space hotkey
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
    <div
      className="relative flex min-h-screen w-full flex-col justify-between overflow-x-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at 78% 18%, rgba(252,227,138,0.85) 0%, rgba(247,150,107,0.72) 32%, transparent 62%), radial-gradient(circle at 18% 85%, rgba(74,122,44,0.8), transparent 45%), linear-gradient(180deg, #E8875E 0%, #FCE38A 46%, #4A7A2C 78%, #1E3B12 100%)",
      }}
    >
      {/* Subtle PKOK top bar */}
      <header className="z-30 flex w-full items-center justify-between bg-black/45 px-3 py-1.5 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link
            to="/esports"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Lobby
          </Link>
          <span className="hidden text-xs font-black tracking-wide text-[#FFE066] sm:inline">
            JILI · FORTUNE GEMS 2 · 5 PAYLINES
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#111827]/85 px-3 py-1 font-mono text-xs font-bold text-[#4be125] ring-1 ring-[#4be125]/40">
            ৳{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <Link
            to="/wallet"
            className="rounded-full bg-[linear-gradient(180deg,#28a909,#187203)] px-3 py-1 text-xs font-black text-white shadow ring-1 ring-[#4be125]/60 hover:brightness-110"
          >
            + Deposit
          </Link>
        </div>
      </header>

      {/* Main Centered Landscape Temple Stage (matching live 1049×610 JILI Fortune Gems 2) */}
      <main className="relative flex flex-1 items-center justify-center px-2 py-4 sm:px-6">
        <div className="relative flex w-full max-w-[1040px] items-center justify-center">
          {/* Left Side Peeking Lucky Wheel (desktop visible cleanly just like screenshot) */}
          <div className="pointer-events-none relative -mr-20 hidden w-[320px] shrink-0 lg:block xl:w-[360px]">
            <LuckyWheelGraphic bet={baseBet} rotationDeg={wheelRot} spinning={wheelSpinning} />
          </div>

          {/* Left Collapsible Gear Drawer Tab */}
          <div className="fixed left-0 top-1/2 z-40 -translate-y-1/2 flex items-center">
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
              className="flex h-12 w-9 items-center justify-center rounded-r-xl border border-l-0 border-[#D4A024] bg-[#4E311D]/90 text-[#FFD65A] shadow-lg hover:bg-[#6E4932]"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>

          {/* Carved Sandstone Temple Cabinet */}
          <div
            className="relative z-10 w-full max-w-[740px] rounded-2xl border-4 border-[#8C6245] bg-[linear-gradient(180deg,#6E4932_0%,#543421_100%)] p-2 shadow-[0_24px_65px_rgba(0,0,0,0.65)] sm:p-3"
          >
            {gameDisabled && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-xl bg-black/80 p-6 text-center backdrop-blur">
                <p className="text-lg font-black text-[#FFE066]">গেমটি সাময়িকভাবে বন্ধ আছে</p>
                <p className="mt-1 text-xs text-white/70">অ্যাডমিন প্যানেল থেকে পুনরায় চালু করুন।</p>
              </div>
            )}

            {/* Cabinet Top Header Bar: FORTUNE GEMS 2 + SPECIAL WHEEL */}
            <div className="mb-2 grid grid-cols-4 items-center gap-2 px-1">
              <div className="col-span-3 flex items-center justify-center rounded-lg bg-[#2C180B]/85 px-3 py-1.5 border border-[#D4A024]/60 shadow-inner">
                <h1 className="truncate font-serif text-sm font-black uppercase tracking-wider sm:text-lg">
                  {extraBet ? (
                    <span className="text-[#FFF3B0]">
                      Score multiplier will be{" "}
                      <span className="text-[#FF6B6B]">2X</span> or more
                    </span>
                  ) : (
                    <>
                      <span className="bg-[linear-gradient(180deg,#FFF5B8,#D49A12)] bg-clip-text text-transparent">
                        FORTUNE GEMS{" "}
                      </span>
                      <span className="text-[#D62828] drop-shadow">2</span>
                    </>
                  )}
                </h1>
              </div>

              <div className="col-span-1 flex flex-col items-center justify-center rounded-lg border border-[#F5C52C] bg-[linear-gradient(180deg,#9E1818,#5A0B0B)] py-1 text-center shadow">
                <span className="text-[9px] font-black uppercase leading-tight text-[#FFD65A] sm:text-[11px]">
                  SPECIAL
                </span>
                <span className="text-[9px] font-black uppercase leading-tight text-[#FFD65A] sm:text-[11px]">
                  WHEEL
                </span>
              </div>
            </div>

            {/* Reels Area: 3×3 Main Reels + 1×3 4th Special Multiplier Reel */}
            <div className="relative grid grid-cols-4 gap-1.5 rounded-xl bg-[#3D2415] p-1.5 sm:gap-2.5 sm:p-2.5 shadow-inner">
              {toastMsg && (
                <div className="pointer-events-none absolute inset-x-6 top-1/2 z-40 -translate-y-1/2 rounded-xl border-2 border-[#FFE066] bg-black/85 px-4 py-2.5 text-center text-sm font-black text-[#FFE066] shadow-2xl">
                  {toastMsg}
                </div>
              )}

              {/* Reels 1, 2, 3 */}
              {[0, 1, 2].map((colIdx) => {
                const spinCol = reelSpinning[colIdx];
                return (
                  <div
                    key={colIdx}
                    className={`flex flex-col gap-1.5 rounded-xl bg-[linear-gradient(180deg,#B08C62_0%,#8F6D48_100%)] p-1.5 shadow-inner sm:gap-2 ${
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

              {/* 4th Special Multiplier Reel */}
              <div
                className={`relative flex flex-col justify-between gap-1.5 rounded-xl p-1.5 sm:gap-2 transition-all ${
                  extraBet
                    ? "bg-[linear-gradient(180deg,#9E1818,#6B1218)] ring-2 ring-[#FFE066] shadow-[0_0_26px_rgba(255,214,90,0.75)]"
                    : "bg-[linear-gradient(180deg,#7B161C,#520C11)] ring-1 ring-[#C89B3C]/60"
                } ${reelSpinning[3] ? "animate-pulse blur-[1.5px]" : ""}`}
              >
                {extraBet && (
                  <span className="pointer-events-none absolute -left-3 top-1/2 z-30 -translate-y-1/2 rounded-full border border-[#FFE066] bg-[linear-gradient(180deg,#FFD54F,#D97706)] px-1.5 py-0.5 text-[10px] font-black text-black shadow-lg">
                    EX↑
                  </span>
                )}

                {specialReel.map((item, rowIdx) => {
                  const isCenter = rowIdx === 1;
                  return (
                    <div
                      key={rowIdx}
                      className={`relative rounded-xl ${
                        isCenter
                          ? "ring-2 ring-[#F5C52C] bg-black/25 shadow-[0_0_16px_rgba(245,197,44,0.6)]"
                          : ""
                      }`}
                    >
                      <Fg2SpecialBadge item={item} extraBet={extraBet} active={isCenter} />
                    </div>
                  );
                })}
              </div>

              {/* Extra Bet Toggle Pill overlaid at bottom-left matching screenshot */}
              <div className="relative col-span-4 mt-1 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 rounded-full border-2 border-[#D4A024] bg-[linear-gradient(180deg,#5A2382,#371252)] px-2.5 py-1 shadow-lg">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FFE066] text-[10px] font-black text-[#4A1C00]">
                    EX↑
                  </span>
                  <span className="text-xs font-bold text-white">Extra Bet</span>
                  <button
                    type="button"
                    disabled={spinning}
                    onClick={() => setExtraBet((e) => !e)}
                    className={`rounded-full px-3 py-0.5 text-xs font-black transition ${
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
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </div>

                {lastResult && lastResult.totalBaseBetMult > 0 && (
                  <div className="rounded-full border border-[#FFE066]/70 bg-black/55 px-3 py-1 text-xs font-black text-[#FFE066]">
                    {lastResult.winLines.length} Line Win · {String(lastResult.centerSpecial)}
                    {lastResult.centerSpecial !== "WHEEL" ? "x" : ""}
                    {lastResult.wheelTriggered && ` + Wheel ${lastResult.wheelPrizeMult}×`}
                  </div>
                )}
              </div>

              {showExHelp && (
                <div className="col-span-4 rounded-xl border border-[#D4A024] bg-[#2D1442]/95 p-2.5 text-[11px] text-white/90">
                  <strong className="text-[#FFE066]">Extra Bet (+50% stake):</strong> Removes <strong>1x</strong> from the 4th Special Wheel reel (guaranteed <strong>2x–15x</strong> or Wheel!) and adds an extra <strong>1x–15x</strong> multiplier onto Lucky Wheel prizes up to <strong>15,000×</strong>!
                </div>
              )}

              <ParticleLayer ref={fxRef} />
            </div>

            {/* Bottom Temple Step Dock (exact JILI controls left-to-right) */}
            <div className="relative mt-2.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border-t-2 border-[#C89B3C]/70 bg-[linear-gradient(180deg,#5C3B26_0%,#3C2415_100%)] px-3 py-2 shadow-inner">
              {/* Bet Grid Popup */}
              {openBetGrid && (
                <div className="absolute bottom-20 left-2 right-2 z-40 rounded-xl border-2 border-[#D4A024] bg-[#221D18]/95 p-3 shadow-2xl backdrop-blur">
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
                          className={`rounded-lg py-2 text-xs font-black transition ${
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

              {/* Left Readouts: Balance + Bet + WIN */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#F2C94C]">Balance</span>
                  <span className="font-mono text-sm font-black text-white">
                    {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="button"
                  disabled={spinning}
                  onClick={() => setOpenBetGrid((o) => !o)}
                  className="flex flex-col items-center rounded-lg px-2 py-0.5 hover:bg-white/10 disabled:opacity-60"
                >
                  <Coins className="h-5 w-5 text-[#F2C94C]" />
                  <span className="text-xs font-black text-white">
                    Bet {actualStake}
                  </span>
                </button>

                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#F2C94C]">WIN</span>
                  <span className="font-mono text-sm font-black text-[#FFF3B0]">
                    {winDisplay.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Right Action Buttons: Turbo + Auto + Gold JILI Spin */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTurboMode((m) => ((m + 1) % 3) as 0 | 1 | 2)}
                  title="Turbo / Super Turbo"
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
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
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-mono text-xs font-black transition ${
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
                  className={`relative flex h-14 w-14 items-center justify-center rounded-full border-[3px] border-[#FFF3B0] bg-[radial-gradient(circle_at_35%_30%,#FFE57F_0%,#F2B705_58%,#B87800_100%)] shadow-[0_0_22px_rgba(242,183,5,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] transition hover:scale-105 active:scale-95 disabled:opacity-70 ${
                    spinning ? "animate-pulse" : ""
                  }`}
                >
                  <RotateCw className={`h-8 w-8 text-white drop-shadow ${spinning ? "animate-spin" : ""}`} />
                  <span className="pointer-events-none absolute text-[9px] font-black text-[#5E3800]">
                    JILI
                  </span>
                </button>
              </div>
            </div>

            {/* Footer line */}
            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-white/60">
              <span>v_6_8 · {stats.rounds} spins</span>
              <span className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5 text-[#4be125]" /> Provably Fair
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Lucky Wheel Popover Modal when WHEEL triggers */}
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
