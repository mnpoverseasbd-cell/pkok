import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState, type CSSProperties } from "react";
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
import { isMuted, toggleMuted, sfxWin, sfxBust, sfxDrop, sfxCashout } from "@/lib/sound";
import { recordMyBet } from "@/lib/liveFeed";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";

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
  const fxRef = useRef<ParticleBurstHandle>(null);
  const bucketsWrapRef = useRef<HTMLDivElement>(null);

  const onLand = useCallback((b: number) => {
    landResolveRef.current?.(b);
    landResolveRef.current = null;
  }, []);

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready || !boardRef.current) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setDropping(true); setMsg(""); setBucket(null); setLastMult(null);
    try { sfxDrop(); } catch { /* noop */ }
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
    pushMultiplierHistory("plinko", m);
    // burst positioned above the landed bucket
    const wrap = bucketsWrapRef.current;
    const cell = wrap?.querySelector<HTMLElement>(`[data-bucket="${b}"]`);
    if (wrap && cell && fxRef.current) {
      const wr = wrap.getBoundingClientRect();
      const cr = cell.getBoundingClientRect();
      const x = cr.left - wr.left + cr.width / 2;
      const y = cr.top - wr.top + cr.height / 2;
      if (m >= 3) fxRef.current.burst({ x, y, count: 70, kind: "confetti", speed: 9 });
      else if (m >= 1.1) fxRef.current.burst({ x, y, count: 30, kind: "spark", color: "#00ff88", speed: 6 });
      else fxRef.current.burst({ x, y, count: 20, kind: "smoke", color: "#ff4d4d", speed: 4 });
    }
    if (m >= 2) { try { sfxWin(m); sfxCashout(); } catch { /* noop */ } }
    else if (m < 1) { try { sfxBust(); } catch { /* noop */ } }
    setMsg(pnl >= 0 ? `🎯 ${m}× · +${pnl}` : `😅 ${m}× · ${pnl}`);
    pf.consume(`bucket=${b} mult=${m}× risk=${risk}`);
    recordMyBet({ game: "plinko", bet: roundBet, multiplier: m, payout: won });
    setDropping(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, record, MULTS, risk]);

  const auto = useAutoBet({ runRound, baseBet: bet, delayMs: 500 });

  // Symmetric vibrant palette (edges hottest, center coolest) — casino pin style
  const PIN_PALETTES = [
    ["#ef4444", "#b91c1c"], // red
    ["#f97316", "#c2410c"], // orange
    ["#a855f7", "#7e22ce"], // purple
    ["#3b82f6", "#1d4ed8"], // blue
    ["#14b8a6", "#0f766e"], // teal
    ["#94a3b8", "#64748b"], // slate (lowest center)
    ["#14b8a6", "#0f766e"],
    ["#3b82f6", "#1d4ed8"],
    ["#a855f7", "#7e22ce"],
    ["#f97316", "#c2410c"],
    ["#ef4444", "#b91c1c"],
  ];
  const bucketStyle = (i: number, active: boolean): CSSProperties => {
    const [c1, c2] = PIN_PALETTES[i] ?? ["#64748b", "#334155"];
    return {
      background: `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`,
      color: "#fff",
      clipPath: "polygon(50% 100%, 100% 60%, 100% 0, 0 0, 0 60%)",
      boxShadow: active
        ? `0 0 24px ${c1}, 0 0 8px #fff inset`
        : `0 4px 10px -2px ${c2}80, 0 1px 0 rgba(255,255,255,0.35) inset`,
      textShadow: "0 1px 2px rgba(0,0,0,0.45)",
    };
  };

  return (
    <GameShell title="Plinko" emoji="🎯" gameKey="plinko">
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="mb-3">
        <MultiplierHistoryStrip gameKey="plinko" />
      </div>
      <GameFrame>
        <div className="mx-auto w-full max-w-md flex-1">
          <div ref={bucketsWrapRef} className="relative">
            <button
              onClick={() => setMutedState(toggleMuted())}
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white/80 backdrop-blur hover:bg-black/70"
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <PlinkoBoard ref={boardRef} rows={ROWS} buckets={BUCKETS} onLand={onLand} />
            <ParticleLayer ref={fxRef} />
            <div className="mt-3 grid grid-cols-11 gap-1.5 px-1">
              {MULTS.map((m, i) => (
                <div
                  key={i}
                  data-bucket={i}
                  style={bucketStyle(i, bucket === i)}
                  className={`grid h-9 place-items-center text-[10px] font-black tracking-tight transition-transform ${bucket === i ? "animate-cash-pop scale-110" : ""}`}
                >
                  {m}×
                </div>
              ))}
            </div>
          </div>
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={dropping || auto.running} />
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Risk Level</span>
            <div className="flex gap-1 rounded-lg bg-[#112216] p-1">
              {(["low", "medium", "high"] as Risk[]).map((r) => (
                <button
                  key={r}
                  disabled={dropping || auto.running}
                  onClick={() => setRisk(r)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-40 ${
                    risk === r
                      ? r === "high" ? "bg-[#ff4444] text-white shadow-[0_0_10px_rgba(255,68,68,0.5)]"
                        : r === "medium" ? "bg-[var(--neon-gold)] text-[#050a06]"
                        : "bg-[#00ff88] text-[#050a06]"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <MultDisplay
            label="শেষ ড্রপ"
            value={lastMult !== null ? `${lastMult}×` : "—"}
            sub={<>সম্ভাব্য সর্বোচ্চ: <span className="text-[var(--neon-gold)]">{Math.floor(bet * maxMult)}</span> ({maxMult}×)</>}
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
