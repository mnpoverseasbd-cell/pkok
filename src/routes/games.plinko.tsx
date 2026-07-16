import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairPlinko } from "@/lib/provablyFair";
import { PlinkoBoard, type PlinkoBoardHandle } from "@/components/games/PlinkoBoard";
import { isMuted, toggleMuted, sfxWin, sfxBust } from "@/lib/sound";
import { recordMyBet } from "@/lib/liveFeed";

export const Route = createFileRoute("/games/plinko")({
  head: () => ({ meta: [{ title: "Plinko — Asik Game" }, { name: "description", content: "Drop the ball, hit multipliers." }] }),
  component: Plinko,
});

const ROWS = 10;
const BUCKETS = 11;

type Risk = "low" | "medium" | "high";
const MULT_TABLE: Record<Risk, number[]> = {
  low:    [5.6, 2.1, 1.1, 1.0, 0.9, 0.5, 0.9, 1.0, 1.1, 2.1, 5.6],
  medium: [8.9, 3.0, 1.4, 1.1, 1.0, 0.5, 1.0, 1.1, 1.4, 3.0, 8.9],
  high:   [29,  4.0, 1.5, 0.3, 0.2, 0.2, 0.2, 0.3, 1.5, 4.0, 29],
};

function Plinko() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("plinko");
  const { data: cfg } = useGameConfig("plinko");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("plinko");
  const [bet, setBet] = useState(50);
  const [risk, setRisk] = useState<Risk>("medium");
  const MULTS = MULT_TABLE[risk];
  const maxMult = Math.max(...MULTS);
  const [dropping, setDropping] = useState(false);
  const [bucket, setBucket] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [lastMult, setLastMult] = useState<number | null>(null);
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [muted, setMutedState] = useState(isMuted());
  const boardRef = useRef<PlinkoBoardHandle | null>(null);
  const landResolveRef = useRef<((b: number) => void) | null>(null);

  const onLand = useCallback((b: number) => {
    landResolveRef.current?.(b);
    landResolveRef.current = null;
  }, []);

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready || !boardRef.current) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setDropping(true); setMsg(""); setBucket(null); setLastMult(null);
    const path = await fairPlinko(pf.serverSeed, pf.clientSeed, pf.nonce, ROWS);
    const targetBucket = Math.min(BUCKETS - 1, path.reduce<number>((a, b) => a + b, 0));
    const landed = await new Promise<number>((res) => {
      landResolveRef.current = res;
      boardRef.current!.drop(path, targetBucket);
    });
    const b = landed; // physics-driven, PF-steered
    setBucket(b);
    const m = MULTS[b];
    setLastMult(m);
    const won = Math.floor(roundBet * m * (1 - edge));
    if (won > 0) credit(won);
    const pnl = won - roundBet;
    record({ pnl, multiplier: won / roundBet });
    if (m >= 2) sfxWin(m); else if (m < 1) sfxBust();
    setMsg(pnl >= 0 ? `🎯 ${m}× · +${pnl}` : `😅 ${m}× · ${pnl}`);
    pf.consume(`bucket=${b} mult=${m}× risk=${risk}`);
    recordMyBet({ game: "plinko", bet: roundBet, multiplier: m, payout: won });
    setDropping(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, record, MULTS, risk]);

  const auto = useAutoBet({ runRound, baseBet: bet, delayMs: 500 });

  const bucketColor = (m: number, active: boolean) => {
    if (active) return "bg-[var(--neon-gold)] text-[#050a06] shadow-[0_0_15px_var(--neon-gold)]";
    if (m >= 3) return "bg-gradient-to-b from-[#ff4444] to-[#8b0000] text-white";
    if (m >= 1.1) return "bg-gradient-to-b from-[#00ff88] to-[#004d2a] text-[#050a06]";
    return "bg-[#112216] text-white/60 border border-[#1a3321]";
  };

  return (
    <GameShell title="Plinko" emoji="🎯" gameKey="plinko">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className="mx-auto w-full max-w-md flex-1">
          <div className="relative">
            <button
              onClick={() => setMutedState(toggleMuted())}
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <PlinkoBoard ref={boardRef} rows={ROWS} buckets={BUCKETS} onLand={onLand} />
          </div>
          <div className="mt-3 grid grid-cols-11 gap-1">
            {MULTS.map((m, i) => (
              <div key={i} className={`rounded-md px-1 py-2 text-center text-[10px] font-black transition-all ${bucketColor(m, bucket === i)}`}>
                {m}×
              </div>
            ))}
          </div>
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={dropping || auto.running} />
          <MultDisplay
            label="শেষ ড্রপ"
            value={lastMult !== null ? `${lastMult}×` : "—"}
            sub={<>সম্ভাব্য সর্বোচ্চ: <span className="text-[var(--neon-gold)]">{Math.floor(bet * 8.9)}</span></>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={dropping || auto.running} />
          {mode === "manual" ? (
            <PrimaryButton onClick={() => runRound(bet)} disabled={dropping}>
              {dropping ? "ড্রপিং..." : `ড্রপ · ${bet}`}
            </PrimaryButton>
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready} />
          )}
          {msg && <div className="animate-fade-in text-center text-sm font-bold text-[var(--neon-gold)]">{msg}</div>}
          <ProvablyFairPanel pf={pf} gameKey="plinko" />
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}
