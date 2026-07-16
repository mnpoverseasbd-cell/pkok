import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
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

export const Route = createFileRoute("/games/plinko")({
  head: () => ({ meta: [{ title: "Plinko — Asik Game" }, { name: "description", content: "Drop the ball, hit multipliers." }] }),
  component: Plinko,
});

const ROWS = 10;
const BUCKETS = 11;
const MULTS = [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9];

function Plinko() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("plinko");
  const { data: cfg } = useGameConfig("plinko");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("plinko");
  const [bet, setBet] = useState(50);
  const [dropping, setDropping] = useState(false);
  const [path, setPath] = useState<number[]>([]);
  const [bucket, setBucket] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [lastMult, setLastMult] = useState<number | null>(null);
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setDropping(true); setMsg(""); setBucket(null); setLastMult(null);
    const steps = await fairPlinko(pf.serverSeed, pf.clientSeed, pf.nonce, ROWS);
    const p: number[] = [];
    let col = 0;
    for (let r = 0; r < ROWS; r++) {
      p.push(steps[r]); col += steps[r];
      setPath([...p]);
      // eslint-disable-next-line no-await-in-loop
      await new Promise(res => setTimeout(res, 100));
    }
    const b = Math.min(BUCKETS - 1, Math.max(0, col));
    setBucket(b);
    const m = MULTS[b];
    setLastMult(m);
    const won = Math.floor(roundBet * m * (1 - edge));
    if (won > 0) credit(won);
    const pnl = won - roundBet;
    record({ pnl, multiplier: won / roundBet });
    setMsg(pnl >= 0 ? `🎯 ${m}× · +${pnl}` : `😅 ${m}× · ${pnl}`);
    pf.consume(`bucket=${b} mult=${m}×`);
    setDropping(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, record]);

  const auto = useAutoBet({ runRound, baseBet: bet, delayMs: 300 });

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
          <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#1a3321] bg-[#0a120b] p-4">
            {Array.from({ length: ROWS }).map((_, r) => {
              const pegs = r + 2;
              const activeCol = path.slice(0, r + 1).reduce((a, b) => a + b, 0);
              return (
                <div key={r} className="flex gap-2">
                  {Array.from({ length: pegs }).map((_, c) => {
                    const isBall = path.length > r && c === activeCol;
                    return (
                      <div key={c} className={`h-3 w-3 rounded-full transition-all ${
                        isBall
                          ? "bg-[var(--neon-gold)] ring-2 ring-yellow-200 shadow-[0_0_10px_var(--neon-gold)] scale-125"
                          : "bg-[#254a30]"
                      }`} />
                    );
                  })}
                </div>
              );
            })}
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
