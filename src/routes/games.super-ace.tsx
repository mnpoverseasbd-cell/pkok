import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Info,
  RotateCw,
  Settings,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wifi,
  Zap,
  History,
  Coins,
  X,
} from "lucide-react";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameConfig } from "@/hooks/useGameConfig";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import {
  SUPER_ACE_BASE_COMBOS,
  SUPER_ACE_FREE_COMBOS,
  SUPER_ACE_PAYTABLE,
  SUPER_ACE_REGULAR_SYMS,
  type SuperAceCell,
  type SuperAceSpinResult,
} from "@/lib/provablyFair";
import { serverPlaySuperAce } from "@/lib/game-settlement.functions";
import { SuperAceCard, type CardVisualState } from "@/components/games/fx/SuperAceCards";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxBust, sfxCashout, sfxPeg, sfxWin } from "@/lib/sound";

export const Route = createFileRoute("/games/super-ace")({
  head: () => ({
    meta: [
      { title: "Super Ace — JILI 1024 Ways | PKOK" },
      { name: "description", content: "JILI Super Ace 5×4 1024 Ways — Golden Cards, Big/Little Joker Wild, Combo ×1–×10 & Free Spins." },
    ],
  }),
  component: SuperAcePage,
});

const JILI_BET_LEVELS = [0.5, 1, 2, 3, 5, 10, 20, 30, 40, 50, 80, 100, 200, 500, 1000] as const;
const MARQUEE_TIPS = [
  "Collect 3 SCATTER to receive 10 rounds of Free Games.",
  "Golden Cards appear on reels 2, 3 & 4 and flip into WILD Joker!",
  "Big Joker clones itself onto additional reel positions for massive combos.",
  "Base Combo: ×1 → ×2 → ×3 → ×5  |  Free Game Combo: ×2 → ×4 → ×6 → ×10",
];

function createShowcaseGrid(): SuperAceCell[][] {
  const layout: [SuperAceCell["sym"], boolean][][] = [
    [["Q", false], ["S", false], ["D", false], ["C", false]],
    [["H", false], ["H", false], ["J", true], ["A", false]],
    [["A", true], ["C", false], ["C", true], ["C", false]],
    [["C", false], ["J", false], ["C", false], ["D", true]],
    [["C", false], ["S", false], ["H", false], ["D", false]],
  ];
  return layout.map((col, c) =>
    col.map(([sym, golden], r) => ({
      id: `init-${c}-${r}`,
      sym,
      golden,
    })),
  );
}

type SpinHistoryItem = {
  id: string;
  ts: string;
  bet: number;
  payout: number;
  mult: number;
  freeSpin: boolean;
  maxCombo: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function SuperAcePage() {
  const { balance, syncBalance, userId } = useDemoWallet();
  const doPlaySuperAce = useServerFn(serverPlaySuperAce);
  const { data: cfg } = useGameConfig("super-ace");
  const { stats, record } = useGameStats("super-ace");
  const pf = useProvablyFair("super-ace");

  const minBet = cfg?.min_bet ?? 1;
  const maxBet = cfg?.max_bet ?? 10000;
  const edge = cfg?.house_edge ?? 0.03;
  const maxPayoutMult = cfg?.config?.max_payout_mult ?? 10000;
  const gameDisabled = cfg ? !cfg.is_enabled : false;

  const allowedBets = useMemo(() => {
    const valid = JILI_BET_LEVELS.filter((v) => v >= minBet && v <= maxBet);
    return valid.length > 0 ? valid : [Math.max(1, Math.min(maxBet, minBet))];
  }, [minBet, maxBet]);

  const [bet, setBet] = useState<number>(() => {
    const initial = allowedBets.find((v) => v >= 10) ?? allowedBets[0] ?? 10;
    return initial;
  });

  useEffect(() => {
    if (!allowedBets.includes(bet)) {
      setBet(allowedBets.find((v) => v >= 10) ?? allowedBets[0]);
    }
  }, [allowedBets, bet]);

  const [grid, setGrid] = useState<SuperAceCell[][]>(() => createShowcaseGrid());
  const [cellStates, setCellStates] = useState<Record<string, CardVisualState>>({});
  const [spinningReels, setSpinningReels] = useState<boolean[]>([false, false, false, false, false]);
  const [spinning, setSpinning] = useState(false);

  const [winDisplay, setWinDisplay] = useState(0);
  const [comboStep, setComboStep] = useState(0); // 0 = idle (tier 1), 1..4 active cascade
  const [comboOverlay, setComboOverlay] = useState<{ combo: number; winAmt: number } | null>(null);
  const [tipIdx, setTipIdx] = useState(0);

  // Free Game state
  const [freeSpinsLeft, setFreeSpinsLeft] = useState(0);
  const [inFreeGame, setInFreeGame] = useState(false);
  const [freeTotalWin, setFreeTotalWin] = useState(0);
  const [bannerMsg, setBannerMsg] = useState<string | null>(null);

  // Controls & Modals
  const [turboMode, setTurboMode] = useState<0 | 1 | 2>(0); // 0 Normal, 1 Turbo, 2 Super Turbo
  const [autoSpinsLeft, setAutoSpinsLeft] = useState(0);
  const [stopOnFreeGame, setStopOnFreeGame] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  const [openMenu, setOpenMenu] = useState(false);
  const [openBetGrid, setOpenBetGrid] = useState(false);
  const [openAutoModal, setOpenAutoModal] = useState(false);
  const [openBuyBonus, setOpenBuyBonus] = useState(false);
  const [buyBet, setBuyBet] = useState<number>(bet);
  const [openInfo, setOpenInfo] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);
  const [openFair, setOpenFair] = useState(false);

  const allowedBuyBets = useMemo(() => {
    const valid = allowedBets.filter((v) => v * 40.5 <= maxBet);
    return valid.length > 0 ? valid : [allowedBets[0] ?? minBet];
  }, [allowedBets, maxBet, minBet]);

  useEffect(() => {
    setBuyBet(
      allowedBuyBets.includes(bet)
        ? bet
        : allowedBuyBets[allowedBuyBets.length - 1] ?? minBet,
    );
  }, [bet, allowedBuyBets, minBet]);

  const [history, setHistory] = useState<SpinHistoryItem[]>([]);
  const fxRef = useRef<ParticleBurstHandle>(null);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pendingFreeQueueRef = useRef<{
    spins: SuperAceSpinResult[];
    bet: number;
    finalBalance: number;
  } | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIdx((p) => (p + 1) % MARQUEE_TIPS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const speedScale = turboMode === 2 ? 0.35 : turboMode === 1 ? 0.6 : 1;

  const animateResult = useCallback(
    async (
      spinBet: number,
      res: SuperAceSpinResult,
      isFreeMode: boolean,
    ) => {
      if (!mountedRef.current) return 0;

      // 1) Spin reels & drop them left-to-right into initialGrid
      setSpinningReels([true, true, true, true, true]);
      setCellStates({});
      setComboStep(0);
      setComboOverlay(null);

      await sleep(Math.round(280 * speedScale));
      if (!mountedRef.current) return 0;

      setGrid(res.initialGrid);
      for (let col = 0; col < 5; col++) {
        await sleep(Math.round(130 * speedScale));
        if (!mountedRef.current) return 0;
        if (soundOn) {
          try { sfxPeg(0.4 + col * 0.08); } catch { /* noop */ }
        }
        setSpinningReels((prev) => {
          const next = [...prev];
          next[col] = false;
          return next;
        });
      }

      // 2) Play cascade chain step-by-step
      let cumulativeMult = 0;
      for (let idx = 0; idx < res.cascades.length; idx++) {
        const step = res.cascades[idx];
        if (!mountedRef.current) return 0;

        setGrid(step.gridBefore);
        setComboStep(Math.min(idx + 1, 4));

        // Dim non-winners, glow winning positions
        const winSet = new Set(step.winningPositions.map(([c, r]) => `${c}-${r}`));
        const stepStates: Record<string, CardVisualState> = {};
        for (let c = 0; c < 5; c++) {
          for (let r = 0; r < 4; r++) {
            const k = `${c}-${r}`;
            stepStates[k] = winSet.has(k) ? "win" : "dim";
          }
        }
        setCellStates(stepStates);

        const stepCash = +(spinBet * step.stepMult).toFixed(3);
        cumulativeMult = +(cumulativeMult + step.stepMult).toFixed(4);
        const totalSoFar = +(spinBet * cumulativeMult).toFixed(3);
        setWinDisplay(totalSoFar);
        setComboOverlay({ combo: step.comboIndex, winAmt: stepCash });

        if (soundOn) {
          try {
            step.comboMult >= 4 ? sfxCashout() : sfxWin(step.comboMult);
          } catch { /* noop */ }
        }
        if (step.comboMult >= 3) {
          fxRef.current?.burst({ count: 35, kind: "confetti", speed: 6 });
        }

        await sleep(Math.round(680 * speedScale));
        if (!mountedRef.current) return 0;

        // Flip Golden Cards / Clone Big Jokers visual beat
        if (step.convertedGolden.length > 0 || step.clonedBigJokers.length > 0) {
          const flipStates: Record<string, CardVisualState> = { ...stepStates };
          for (const g of step.convertedGolden) flipStates[`${g.col}-${g.row}`] = "flip";
          for (const [bc, br] of step.clonedBigJokers) flipStates[`${bc}-${br}`] = "clone";
          setCellStates(flipStates);
          await sleep(Math.round(380 * speedScale));
          if (!mountedRef.current) return 0;
        }

        // Cascade drop new grid
        setComboOverlay(null);
        setCellStates({});
        setGrid(step.gridAfter);
        await sleep(Math.round(340 * speedScale));
      }

      setGrid(res.finalGrid);
      setCellStates({});
      setComboStep(0);
      setComboOverlay(null);
      if (isFreeMode) {
        setFreeTotalWin((prev) => +(prev + spinBet * res.totalMultiplier).toFixed(3));
      }
      return res.totalMultiplier;
    },
    [soundOn, speedScale],
  );

  const executeSpin = useCallback(
    async (opts?: { forceFreeTrigger?: boolean; overrideBet?: number }) => {
      if (spinning || !pf.ready || gameDisabled) return;

      const queue = pendingFreeQueueRef.current;
      const isUsingFreeSpin = freeSpinsLeft > 0 && queue && queue.spins.length > 0 && !opts?.forceFreeTrigger;

      if (isUsingFreeSpin && queue) {
        const nextFs = queue.spins.shift()!;
        const activeBet = queue.bet;
        setSpinning(true);
        setOpenMenu(false);
        setOpenBetGrid(false);
        setOpenAutoModal(false);
        setOpenBuyBonus(false);
        setFreeSpinsLeft(queue.spins.length);

        await animateResult(activeBet, nextFs, true);
        if (!mountedRef.current) return;

        const cappedMult =
          maxPayoutMult > 0 ? Math.min(nextFs.totalMultiplier, maxPayoutMult) : nextFs.totalMultiplier;
        const wonAmount = Math.round(activeBet * cappedMult * 100) / 100;
        const maxCombo = nextFs.cascades.length > 0 ? nextFs.cascades[nextFs.cascades.length - 1].comboMult : 1;

        setHistory((prev) =>
          [
            {
              id: `sa-fs-${pf.nonce}-${Date.now()}`,
              ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              bet: 0,
              payout: wonAmount,
              mult: cappedMult,
              freeSpin: true,
              maxCombo,
            },
            ...prev,
          ].slice(0, 30),
        );

        if (nextFs.freeSpinsAwarded > 0) {
          setBannerMsg(`🔥 +${nextFs.freeSpinsAwarded} FREE SPINS!`);
          fxRef.current?.burst({ count: 70, kind: "confetti", speed: 8 });
          if (soundOn) {
            try { sfxCashout(); } catch { /* noop */ }
          }
          setTimeout(() => mountedRef.current && setBannerMsg(null), 2000);
        }

        if (queue.spins.length === 0) {
          const finalBal = queue.finalBalance;
          pendingFreeQueueRef.current = null;
          setInFreeGame(false);
          syncBalance(finalBal);
          setBannerMsg(`🏆 FREE GAME ENDED · TOTAL WIN ৳${(freeTotalWin + wonAmount).toFixed(2)}`);
          setTimeout(() => mountedRef.current && setBannerMsg(null), 2600);
        }

        setSpinning(false);
        return;
      }

      if (!userId) {
        setAutoSpinsLeft(0);
        setBannerMsg("খেলতে অনুগ্রহ করে লগইন করুন");
        setTimeout(() => mountedRef.current && setBannerMsg(null), 2200);
        return;
      }

      const activeBet = opts?.overrideBet ?? bet;
      const buyCost = opts?.forceFreeTrigger ? +(activeBet * 40.5).toFixed(2) : activeBet;

      if (balance < buyCost) {
        setAutoSpinsLeft(0);
        setBannerMsg("পর্যাপ্ত ব্যালেন্স নেই");
        setTimeout(() => mountedRef.current && setBannerMsg(null), 2200);
        return;
      }

      setSpinning(true);
      setOpenMenu(false);
      setOpenBetGrid(false);
      setOpenAutoModal(false);
      setOpenBuyBonus(false);
      setWinDisplay(0);
      setFreeTotalWin(0);

      let serverData: Awaited<ReturnType<typeof doPlaySuperAce>>;
      try {
        serverData = await doPlaySuperAce({
          data: {
            bet: activeBet,
            buyBonus: !!opts?.forceFreeTrigger,
            clientSeed: pf.clientSeed,
            nonce: pf.nonce,
          },
        });
      } catch (err: any) {
        setAutoSpinsLeft(0);
        setSpinning(false);
        setBannerMsg(err?.message || "সার্ভার যাচাই ব্যর্থ হয়েছে");
        setTimeout(() => mountedRef.current && setBannerMsg(null), 2400);
        return;
      }

      syncBalance(Math.max(0, +(balance - serverData.stake).toFixed(2)));
      const res = serverData.baseSpin;

      await animateResult(activeBet, res, false);
      if (!mountedRef.current) return;

      const cappedMult =
        maxPayoutMult > 0 ? Math.min(res.totalMultiplier, maxPayoutMult) : res.totalMultiplier;
      const wonAmount = serverData.baseWin;
      const pnl = +(serverData.totalWin - serverData.stake).toFixed(2);
      if (res.totalMultiplier === 0 && soundOn && res.freeSpinsAwarded === 0) {
        try { sfxBust(); } catch { /* noop */ }
      }

      const maxCombo = res.cascades.length > 0 ? res.cascades[res.cascades.length - 1].comboMult : 1;

      const totalMult = serverData.stake > 0 ? +(serverData.totalWin / serverData.stake).toFixed(2) : 0;
      record({ pnl, multiplier: totalMult });
      recordMyBet({
        game: "super-ace",
        bet: serverData.stake,
        multiplier: totalMult,
        payout: serverData.totalWin,
      });
      pushMultiplierHistory("super-ace", totalMult);

      setHistory((prev) =>
        [
          {
            id: `sa-${pf.nonce}-${Date.now()}`,
            ts: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            bet: serverData.stake,
            payout: wonAmount,
            mult: cappedMult,
            freeSpin: false,
            maxCombo,
          },
          ...prev,
        ].slice(0, 30),
      );

      pf.consume(`super-ace mult=${totalMult}× cascades=${res.cascades.length} scatters=${res.scatterCount}`);

      if (serverData.freeSpins.length > 0) {
        pendingFreeQueueRef.current = {
          spins: [...serverData.freeSpins],
          bet: activeBet,
          finalBalance: serverData.newBalance,
        };
        setInFreeGame(true);
        setFreeSpinsLeft(serverData.freeSpins.length);
        setBannerMsg(`🎉 3 SCATTERS! ${serverData.freeSpins.length} FREE SPINS!`);
        fxRef.current?.burst({ count: 90, kind: "confetti", speed: 9 });
        if (soundOn) {
          try { sfxCashout(); } catch { /* noop */ }
        }
        if (stopOnFreeGame && !opts?.forceFreeTrigger) {
          setAutoSpinsLeft(0);
        }
        setTimeout(() => mountedRef.current && setBannerMsg(null), 2200);
      } else {
        syncBalance(serverData.newBalance);
      }

      setSpinning(false);
    },
    [
      spinning,
      pf,
      gameDisabled,
      freeSpinsLeft,
      userId,
      bet,
      balance,
      doPlaySuperAce,
      syncBalance,
      animateResult,
      maxPayoutMult,
      soundOn,
      record,
      stopOnFreeGame,
      freeTotalWin,
    ],
  );

  // Auto-run loop for Free Spins or Auto Spin queue
  useEffect(() => {
    if (spinning || !pf.ready || gameDisabled) return;
    if (freeSpinsLeft > 0) {
      autoTimerRef.current = setTimeout(() => {
        executeSpin();
      }, 650);
      return () => {
        if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      };
    }
    if (autoSpinsLeft > 0) {
      autoTimerRef.current = setTimeout(() => {
        setAutoSpinsLeft((n) => Math.max(0, n - 1));
        executeSpin();
      }, 500);
      return () => {
        if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
      };
    }
  }, [spinning, pf.ready, gameDisabled, freeSpinsLeft, autoSpinsLeft, executeSpin]);

  // Keyboard Space to Spin
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        executeSpin();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [executeSpin]);

  const ladders = inFreeGame || freeSpinsLeft > 0 ? SUPER_ACE_FREE_COMBOS : SUPER_ACE_BASE_COMBOS;
  const activeLadderIdx = comboStep > 0 ? Math.min(comboStep - 1, 3) : -1;
  const isFreeUI = inFreeGame || freeSpinsLeft > 0;
  const buyBonusPrice = +(buyBet * 40.5).toFixed(2);

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-between overflow-x-hidden select-none"
      style={{
        background:
          "radial-gradient(circle at 18% 22%, rgba(255,215,64,0.35), transparent 26%), radial-gradient(circle at 82% 78%, rgba(255,205,50,0.28), transparent 28%), radial-gradient(circle at 22% 85%, rgba(185,205,40,0.4), transparent 34%), linear-gradient(135deg, #556217 0%, #7B8E23 48%, #9EB42E 75%, #4A5513 100%)",
      }}
    >
      {/* Top PKOK quick bar so users can jump back / check deposit cleanly */}
      <header className="z-20 flex w-full items-center justify-between bg-black/45 px-3 py-1.5 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <Link
            to="/hot"
            className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white hover:bg-white/20 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Lobby
          </Link>
          <span className="hidden text-xs font-black tracking-wide text-[#FFE066] sm:inline">
            JILI · SUPER ACE · 1024 WAYS
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#111827]/85 px-3 py-1 font-mono text-xs font-bold text-[#4be125] ring-1 ring-[#4be125]/40">
            ৳{balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
          </span>
          <Link
            to="/wallet"
            className="rounded-full bg-[linear-gradient(180deg,#28a909,#187203)] px-3 py-1 text-xs font-black text-white shadow ring-1 ring-[#4be125]/60 hover:brightness-110"
          >
            + Deposit
          </Link>
        </div>
      </header>

      {/* Main Centered 9:16 JILI Super Ace Portrait Cabinet */}
      <main className="relative flex w-full flex-1 items-center justify-center p-0 sm:py-3">
        <div
          className="relative flex w-full max-w-[436px] flex-col overflow-hidden sm:rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.75)] sm:border-2 sm:border-[#C89B3C]/80"
          style={{
            minHeight: "min(760px, calc(100vh - 44px))",
            background: "linear-gradient(180deg, #3B110B 0%, #1C0805 12%, #07333A 28%, #07333A 76%, #111126 100%)",
          }}
        >
          {gameDisabled && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur">
              <p className="text-lg font-black text-[#FFE066]">গেমটি সাময়িকভাবে বন্ধ আছে</p>
              <p className="mt-1 text-xs text-white/70">অ্যাডমিন প্যানেল থেকে পুনরায় চালু করুন।</p>
            </div>
          )}

          {/* 1) Mahogany Top Arch + Wordmark + BUY BONUS */}
          <div className="relative flex items-center justify-center border-b-2 border-[#C89B3C]/80 bg-[linear-gradient(180deg,#5C1C10_0%,#3B110B_65%,#280A06_100%)] px-3 pt-2.5 pb-2 shadow-md">
            {isFreeUI ? (
              <div className="flex items-center gap-2">
                <span
                  className="text-lg font-black uppercase tracking-wider text-white sm:text-xl"
                  style={{ textShadow: "0 2px 6px rgba(0,0,0,0.8)" }}
                >
                  FREE SPIN
                </span>
                <span
                  className="text-2xl font-black text-[#FF8800] sm:text-3xl"
                  style={{ textShadow: "0 0 14px rgba(255,69,0,0.95), 0 2px 4px #000" }}
                >
                  {freeSpinsLeft}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-lg text-[#FFD966] drop-shadow">♠</span>
                <h1
                  className="bg-[linear-gradient(180deg,#FFF3B0_0%,#FFD966_48%,#C48A1E_100%)] bg-clip-text font-serif text-2xl font-black italic tracking-wide text-transparent sm:text-[28px]"
                  style={{ filter: "drop-shadow(0 2px 3px #1A0805)" }}
                >
                  SuperAce
                </h1>
                <span className="text-lg text-[#FFD966] drop-shadow">♥</span>
              </div>
            )}

            {/* Top-right BUY BONUS coin emblem */}
            <button
              type="button"
              onClick={() => !spinning && !isFreeUI && setOpenBuyBonus(true)}
              disabled={spinning || isFreeUI}
              className="absolute right-2.5 top-1.5 flex h-11 w-11 flex-col items-center justify-center rounded-full border-2 border-[#FFE066] bg-[radial-gradient(circle_at_35%_30%,#FF4444_0%,#B81212_65%,#6D0606_100%)] shadow-[0_3px_10px_rgba(0,0,0,0.7)] transition hover:scale-105 active:scale-95 disabled:opacity-75"
              title="Buy Free Spins Bonus"
            >
              {isFreeUI ? (
                <>
                  <span className="absolute -top-1 -left-1 rounded bg-black/80 px-1 text-[9px] font-black text-[#FFE066] ring-1 ring-[#FFE066]">
                    {freeSpinsLeft}
                  </span>
                  <Coins className="h-5 w-5 text-[#FFE066]" />
                </>
              ) : (
                <>
                  <span className="text-[7px] font-black uppercase leading-none text-[#FFE066]">BUY</span>
                  <span className="text-[8px] font-black uppercase leading-none text-white">BONUS</span>
                </>
              )}
            </button>
          </div>

          {/* 2) Combo Multiplier Capsule Bar */}
          <div className="relative z-10 flex flex-col items-center bg-[linear-gradient(180deg,#2D0B07_0%,#12282D_100%)] pt-1.5 pb-1">
            <div
              className={`flex items-center gap-3 rounded-full border-2 px-5 py-1 shadow-[0_4px_14px_rgba(0,0,0,0.65)] transition-colors sm:gap-5 ${
                isFreeUI
                  ? "border-[#E63946] bg-[linear-gradient(180deg,#B81220,#6B0811)]"
                  : "border-[#E8B84B] bg-[linear-gradient(180deg,#C5922C,#7A5411)]"
              }`}
            >
              {ladders.map((mult, idx) => {
                const isActive =
                  activeLadderIdx === idx || (activeLadderIdx === -1 && idx === 0);
                return (
                  <span
                    key={mult}
                    className={`font-serif text-base font-black transition-all duration-200 sm:text-lg ${
                      isActive
                        ? "scale-125 text-[#FFDF4D]"
                        : "text-[#FFF8DC]/45"
                    }`}
                    style={
                      isActive
                        ? { textShadow: "0 0 12px rgba(255,153,0,0.95), 0 1px 2px #000" }
                        : undefined
                    }
                  >
                    ×{mult}
                  </span>
                );
              })}
            </div>

            {/* Scrolling tip strip */}
            <div className="mt-1 w-full overflow-hidden px-3 text-center">
              <p className="truncate text-[10px] font-semibold tracking-wide text-[#FFE082]/90">
                {MARQUEE_TIPS[tipIdx]}
              </p>
            </div>
          </div>

          {/* 3) 5 Metallic Card-Shoe Feeders */}
          <div className="grid grid-cols-5 gap-1.5 bg-[#09383E] px-2 pt-1 pb-1.5 border-b border-[#1D6B73]/50">
            {[0, 1, 2, 3, 4].map((c) => (
              <div
                key={c}
                className="relative flex h-5 items-end justify-center overflow-hidden rounded-t-md border border-[#BAC2CB]/60 bg-[linear-gradient(180deg,#9EA8B3_0%,#5D656E_55%,#394047_100%)] shadow-inner"
              >
                <div className="h-2 w-[78%] rounded-t-[2px] border border-[#FFE066]/70 bg-[linear-gradient(180deg,#C82424,#7D0E0E)]" />
                {spinningReels[c] && (
                  <div className="absolute inset-0 animate-pulse bg-[#FFE066]/30" />
                )}
              </div>
            ))}
          </div>

          {/* 4) 5×4 Deep Teal Baize Card Grid */}
          <div
            className="relative flex flex-1 flex-col justify-center px-2 py-2"
            style={{
              background:
                "radial-gradient(circle at 50% 48%, #136770 0%, #0B4A52 60%, #062B31 100%)",
            }}
          >
            {/* Subtle SuperAce watermark */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-[0.07]"
            >
              <span className="font-serif text-4xl font-black italic text-[#FFE066]">SuperAce</span>
              <span className="mt-1 text-2xl tracking-[0.5em] text-[#FFE066]">♠♥♦♣</span>
            </div>

            {/* Banner / Free Spins Popup */}
            {bannerMsg && (
              <div className="pointer-events-none absolute inset-x-4 top-1/2 z-40 -translate-y-1/2 rounded-xl border-2 border-[#FFE066] bg-[linear-gradient(180deg,#9E0B14,#520308)] px-4 py-3 text-center shadow-[0_0_32px_rgba(255,215,64,0.85)] animate-cash-pop">
                <p className="text-base font-black tracking-wide text-[#FFE66D] sm:text-lg">
                  {bannerMsg}
                </p>
              </div>
            )}

            {/* Floating COMBO Win Overlay (matches live JILI COMBO 2 + golden number) */}
            {comboOverlay && (
              <div className="pointer-events-none absolute inset-x-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center">
                <div className="rounded-full border border-[#FFE066] bg-[linear-gradient(180deg,#D91616,#7A0707)] px-4 py-0.5 shadow-[0_0_16px_rgba(255,80,0,0.85)]">
                  <span className="font-serif text-sm font-black uppercase italic tracking-wider text-[#FFE066] sm:text-base">
                    COMBO {comboOverlay.combo}
                  </span>
                </div>
                <div
                  className="mt-0.5 font-serif text-4xl font-black text-[#FFDF4D] sm:text-5xl"
                  style={{
                    textShadow:
                      "0 0 18px rgba(255,140,0,0.95), 0 3px 0 #7C2D00, 0 5px 14px rgba(0,0,0,0.9)",
                  }}
                >
                  {comboOverlay.winAmt >= 1
                    ? comboOverlay.winAmt.toLocaleString("en-US", {
                        minimumFractionDigits: comboOverlay.winAmt % 1 === 0 ? 0 : 2,
                        maximumFractionDigits: 3,
                      })
                    : comboOverlay.winAmt.toFixed(3)}
                </div>
              </div>
            )}

            {/* 5 Columns × 4 Rows */}
            <div className="relative z-10 grid grid-cols-5 gap-1.5 sm:gap-2">
              {[0, 1, 2, 3, 4].map((colIdx) => {
                const isReelSpinning = spinningReels[colIdx];
                return (
                  <div
                    key={colIdx}
                    className={`flex flex-col gap-1.5 sm:gap-2 transition-transform duration-150 ${
                      isReelSpinning ? "animate-pulse opacity-85 scale-[0.98]" : ""
                    }`}
                  >
                    {[0, 1, 2, 3].map((rowIdx) => {
                      const cell = grid[colIdx][rowIdx];
                      const st = isReelSpinning ? "drop" : (cellStates[`${colIdx}-${rowIdx}`] ?? "normal");
                      return (
                        <div key={`${cell.id}-${colIdx}-${rowIdx}`} className={isReelSpinning ? "blur-[1.5px]" : ""}>
                          <SuperAceCard cell={cell} state={st} dropDelayMs={colIdx * 40} />
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            <ParticleLayer ref={fxRef} />
          </div>

          {/* 5) Curved Mahogany WIN Rail */}
          <div className="relative z-20 flex items-center justify-center border-t-2 border-[#D4A138]/80 border-b border-[#060714] bg-[linear-gradient(180deg,#702D17_0%,#4E1D0E_55%,#2F1006_100%)] py-1.5 shadow-[0_-4px_14px_rgba(0,0,0,0.45)]">
            <div className="flex items-baseline gap-2.5">
              <span className="text-xs font-black uppercase tracking-widest text-[#F2C94C]">
                {isFreeUI && freeTotalWin > winDisplay ? "TOTAL WIN" : "WIN"}
              </span>
              <span className="font-mono text-base font-black text-white drop-shadow sm:text-lg">
                {(isFreeUI && freeTotalWin > winDisplay ? freeTotalWin : winDisplay).toLocaleString("en-US", {
                  minimumFractionDigits: 3,
                  maximumFractionDigits: 3,
                })}
              </span>
            </div>
          </div>

          {/* 6) Dark Indigo Damask Control Dock */}
          <div
            className="relative z-20 flex flex-col justify-between px-3 pt-2.5 pb-2"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(125,82,124,0.22), transparent 65%), linear-gradient(180deg, #1B1734 0%, #111126 100%)",
            }}
          >
            {/* Option Vertical Menu */}
            {openMenu && (
              <div className="absolute bottom-24 left-3 z-40 flex w-44 flex-col gap-1 rounded-xl border border-[#8A733E] bg-[#16132B]/95 p-2 shadow-2xl backdrop-blur">
                <button
                  type="button"
                  onClick={() => {
                    setOpenInfo(true);
                    setOpenMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  <Info className="h-4 w-4 text-[#FFE066]" /> Info / Paytable (i)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenHistory(true);
                    setOpenMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  <History className="h-4 w-4 text-[#FFE066]" /> Spin History ({history.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSoundOn((s) => !s)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  {soundOn ? (
                    <Volume2 className="h-4 w-4 text-[#4be125]" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-rose-400" />
                  )}
                  Sound: {soundOn ? "ON" : "OFF"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenFair(true);
                    setOpenMenu(false);
                  }}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-white hover:bg-white/10"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Provably Fair
                </button>
              </div>
            )}

            {/* 3×5 Bet Grid Popup */}
            {openBetGrid && (
              <div className="absolute bottom-24 left-2 right-2 z-40 rounded-xl border-2 border-[#8A733E] bg-[#221D18]/95 p-3 shadow-2xl backdrop-blur">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFE066]">
                    Select Bet (Min ৳{minBet} · Max ৳{maxBet})
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenBetGrid(false)}
                    className="rounded p-0.5 text-white/70 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {JILI_BET_LEVELS.map((val) => {
                    const allowed = val >= minBet && val <= maxBet;
                    const active = bet === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={!allowed}
                        onClick={() => {
                          setBet(val);
                          setOpenBetGrid(false);
                        }}
                        className={`rounded-lg py-2 text-xs font-black transition ${
                          active
                            ? "bg-[linear-gradient(180deg,#FFD54F,#D99B00)] text-black ring-2 ring-white"
                            : allowed
                              ? "bg-[#342C24] text-white hover:bg-[#4B3E31]"
                              : "bg-black/30 text-white/25 cursor-not-allowed"
                        }`}
                      >
                        {val >= 1000 ? "1,000" : val}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5-Button Main Control Row */}
            <div className="flex items-center justify-between gap-1 px-1">
              {/* Gear */}
              <button
                type="button"
                onClick={() => {
                  setOpenMenu((o) => !o);
                  setOpenBetGrid(false);
                }}
                aria-label="Game menu"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#6D5B7B] text-white shadow-md transition hover:brightness-110 active:scale-95"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Bet Selector */}
              <button
                type="button"
                disabled={spinning || isFreeUI}
                onClick={() => {
                  setOpenBetGrid((o) => !o);
                  setOpenMenu(false);
                }}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 text-white transition hover:bg-white/10 disabled:opacity-50"
              >
                <Coins className="h-5 w-5 text-[#F2C94C]" />
                <span className="text-[11px] font-black text-white">Bet {bet}</span>
              </button>

              {/* Center Big Gold Coin Spin Button */}
              <button
                type="button"
                disabled={spinning || !pf.ready || gameDisabled}
                onClick={() => executeSpin()}
                aria-label="Spin"
                className={`relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#FFF3B0] bg-[radial-gradient(circle_at_35%_30%,#FFE57F_0%,#F2B705_58%,#B87800_100%)] shadow-[0_0_22px_rgba(242,183,5,0.55),inset_0_2px_4px_rgba(255,255,255,0.7)] transition hover:scale-105 active:scale-95 disabled:opacity-70 ${
                  spinning ? "animate-pulse" : ""
                }`}
              >
                <RotateCw
                  className={`h-9 w-9 text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.6)] ${
                    spinning ? "animate-spin" : ""
                  }`}
                />
                <span className="pointer-events-none absolute text-[9px] font-black tracking-tight text-[#5E3800]">
                  {isFreeUI ? freeSpinsLeft : "JILI"}
                </span>
              </button>

              {/* Auto Spin */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={gameDisabled}
                  onClick={() => {
                    if (autoSpinsLeft > 0) {
                      setAutoSpinsLeft(0);
                    } else {
                      setOpenAutoModal(true);
                    }
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-md transition active:scale-95 ${
                    autoSpinsLeft > 0
                      ? "border-[#4be125] bg-[#165A16] text-white"
                      : "border-[#C89B3C]/70 bg-[#231F42] text-[#FFE066] hover:bg-[#2F2A56]"
                  }`}
                  title="Auto Spin"
                >
                  {autoSpinsLeft > 0 ? (
                    <span className="font-mono text-xs font-black">{autoSpinsLeft}</span>
                  ) : (
                    <span className="text-[10px] font-black uppercase">AUTO</span>
                  )}
                </button>
              </div>

              {/* Turbo Spin */}
              <button
                type="button"
                onClick={() => setTurboMode((m) => ((m + 1) % 3) as 0 | 1 | 2)}
                className="flex flex-col items-center justify-center gap-0.5"
                title="Toggle Turbo / Super Turbo"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition ${
                    turboMode === 2
                      ? "border-[#FFE066] bg-[linear-gradient(180deg,#E02424,#7D0A0A)] text-[#FFE066] shadow-[0_0_12px_rgba(255,80,80,0.8)]"
                      : turboMode === 1
                        ? "border-[#F2C94C] bg-[#7D527C] text-[#FFE066] shadow-[0_0_10px_rgba(242,201,76,0.5)]"
                        : "border-[#8A733E]/60 bg-[#2C2447] text-white/75"
                  }`}
                >
                  <Zap className="h-4 w-4 fill-current" />
                </span>
                <span className="text-[9px] font-bold text-[#F2C94C]">
                  {turboMode === 2 ? "S-Turbo" : turboMode === 1 ? "Turbo ON" : "Turbo"}
                </span>
              </button>
            </div>

            {/* Footer Balance & Status Strip */}
            <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#F2C94C]">Balance</span>
                <span className="font-mono font-bold text-white">
                  {balance.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/55">
                <span className="text-[10px]">
                  Spins: {stats.rounds}
                </span>
                <Wifi className="h-3.5 w-3.5 text-[#4be125]" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Auto Spin Settings Modal */}
      {openAutoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-2 border-[#C89B3C] bg-[#19162E] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-[#FFE066]">Auto Spin Settings</h2>
              <button type="button" onClick={() => setOpenAutoModal(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[10, 25, 50, 100].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setOpenAutoModal(false);
                    setAutoSpinsLeft(n);
                  }}
                  className="rounded-xl border border-[#8A733E] bg-[#292347] py-2.5 text-sm font-black text-[#FFE066] hover:bg-[#3A3264]"
                >
                  {n}
                </button>
              ))}
            </div>
            <label className="mt-4 flex items-center justify-between rounded-xl bg-black/35 px-3 py-2.5 text-xs font-semibold">
              <span>Stop when Free Game triggers</span>
              <input
                type="checkbox"
                checked={stopOnFreeGame}
                onChange={(e) => setStopOnFreeGame(e.target.checked)}
                className="h-4 w-4 accent-[#F2B705]"
              />
            </label>
          </div>
        </div>
      )}

      {/* BUY BONUS Modal (matches JILI Super Ace Buy Bonus) */}
      {openBuyBonus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border-2 border-[#C89B3C] bg-[#221B15] p-5 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-black uppercase tracking-wider text-[#FFE066]">BUY BONUS</h2>
              <button type="button" onClick={() => setOpenBuyBonus(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-white/75">
              Click <strong className="text-white">Buy &amp; Play</strong> to trigger 3 Scatters and activate 10 Free Spins immediately (×2 to ×10 Combo Multipliers).
            </p>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-black/40 px-3 py-2">
              <span className="text-xs font-bold text-white/75">Base Bet</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const idx = allowedBuyBets.indexOf(buyBet);
                    if (idx > 0) setBuyBet(allowedBuyBets[idx - 1]);
                  }}
                  className="h-7 w-7 rounded bg-white/10 font-black hover:bg-white/20"
                >
                  -
                </button>
                <span className="min-w-12 text-center font-mono text-sm font-black text-[#FFE066]">{buyBet}</span>
                <button
                  type="button"
                  onClick={() => {
                    const idx = allowedBuyBets.indexOf(buyBet);
                    if (idx >= 0 && idx < allowedBuyBets.length - 1) setBuyBet(allowedBuyBets[idx + 1]);
                  }}
                  className="h-7 w-7 rounded bg-white/10 font-black hover:bg-white/20"
                >
                  +
                </button>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-black/40 px-3 py-2.5">
              <span className="text-xs font-bold text-white/75">Total Price (40.5× Bet)</span>
              <span className="font-mono text-base font-black text-[#4be125]">
                ৳{buyBonusPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setBet(buyBet);
                executeSpin({ forceFreeTrigger: true, overrideBet: buyBet });
              }}
              className="mt-4 w-full rounded-xl border border-[#4be125] bg-[linear-gradient(180deg,#28a909,#187203)] py-3 text-sm font-black uppercase tracking-wider text-white shadow-lg transition hover:brightness-110"
            >
              Buy &amp; Play · ৳{buyBonusPrice}
            </button>
          </div>
        </div>
      )}

      {/* Paytable / Rules Modal */}
      {openInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#C89B3C] bg-[#0B3C42] p-5 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/15 pb-2">
              <h2 className="text-base font-black text-[#FFE066]">Super Ace — Paytable (Bet ৳{bet})</h2>
              <button type="button" onClick={() => setOpenInfo(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {SUPER_ACE_REGULAR_SYMS.map((sym) => {
                const pt = SUPER_ACE_PAYTABLE[sym];
                return (
                  <div key={sym} className="flex items-center justify-between rounded-xl bg-black/35 px-3 py-2 border border-white/10">
                    <span className="font-serif text-base font-black text-[#FFE066]">{sym}</span>
                    <div className="text-right font-mono text-[11px] leading-tight">
                      <div>5: ৳{(bet * pt[5]).toFixed(2)}</div>
                      <div className="text-white/75">4: ৳{(bet * pt[4]).toFixed(2)}</div>
                      <div className="text-white/55">3: ৳{(bet * pt[3]).toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 space-y-2 rounded-xl bg-black/35 p-3 text-xs text-white/85">
              <p><strong className="text-[#FFE066]">1024 Ways:</strong> Winning combinations pay left to right on adjacent reels.</p>
              <p><strong className="text-[#FFE066]">Golden Cards (Reels 2–4):</strong> When eliminated in a win, Golden Cards flip into <strong>Little Joker</strong> (WILD) or <strong>Big Joker</strong> (WILD + clones itself to extra positions).</p>
              <p><strong className="text-[#FFE066]">Combo Multiplier:</strong> Base game climbs <strong>×1 → ×2 → ×3 → ×5</strong>; Free Game doubles to <strong>×2 → ×4 → ×6 → ×10</strong>.</p>
              <p><strong className="text-[#FFE066]">Free Game:</strong> 3 Scatters award <strong>10 Free Spins</strong> (3 Scatters during Free Game award <strong>+5 Spins</strong>).</p>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {openHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border-2 border-[#C89B3C] bg-[#141526] p-4 text-white shadow-2xl">
            <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-black uppercase text-[#FFE066]">Recent Spins</h2>
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
                      {h.freeSpin && (
                        <span className="ml-2 rounded bg-[#B81220] px-1.5 py-0.5 text-[10px] font-bold">FREE</span>
                      )}
                    </div>
                    <div className="font-mono">
                      Bet ৳{h.bet} →{" "}
                      <span className={h.payout > 0 ? "font-black text-[#4be125]" : "text-white/50"}>
                        ৳{h.payout.toFixed(2)} ({h.mult.toFixed(2)}×)
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
              <h2 className="text-sm font-black uppercase text-[#FFE066]">Provably Fair · Super Ace</h2>
              <button type="button" onClick={() => setOpenFair(false)} className="text-white/70 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ProvablyFairPanel pf={pf} gameKey="super-ace" />
          </div>
        </div>
      )}
    </div>
  );
}
