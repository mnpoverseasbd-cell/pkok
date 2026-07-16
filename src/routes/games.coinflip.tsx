import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairCoinflip } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/coinflip")({
  head: () => ({ meta: [{ title: "Coin Flip — Asik Game" }, { name: "description", content: "Heads or Tails, 2× payout." }] }),
  component: CoinFlip,
});

type Side = "H" | "T";

const HISTORY_KEY = "coinflip:sides";
function pushSideHistory(s: Side) {
  try {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Side[];
    const next = [s, ...prev].slice(0, 24);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("coinflip:sides"));
  } catch { /* ignore */ }
}
function readSideHistory(): Side[] {
  try { return (JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]") as Side[]) ?? []; } catch { return []; }
}

function CoinFlip() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("coinflip");
  const { data: cfg } = useGameConfig("coinflip");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("coinflip");
  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Side>("H");
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState<Side>("H");
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [outcome, setOutcome] = useState<"idle" | "win" | "lose">("idle");
  const [sides, setSides] = useState<Side[]>(() => readSideHistory());
  const fxRef = useRef<ParticleBurstHandle>(null);

  useEffect(() => {
    const h = () => setSides(readSideHistory());
    window.addEventListener("coinflip:sides", h);
    return () => window.removeEventListener("coinflip:sides", h);
  }, []);

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setFlipping(true); setMsg(""); setOutcome("idle");
    // shuffle face + tick sfx
    for (let i = 0; i < 10; i++) {
      setFace(Math.random() < 0.5 ? "H" : "T");
      if (i % 2 === 0) { try { sfxPeg(0.35); } catch { /* noop */ } }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 60));
    }
    const isHeads = await fairCoinflip(pf.serverSeed, pf.clientSeed, pf.nonce);
    const result: Side = isHeads ? "H" : "T";
    setFace(result);
    let pnl: number;
    let won = 0, mult = 0;
    if (result === pick) {
      won = Math.floor(roundBet * 2 * (1 - edge)); credit(won);
      pnl = won - roundBet; mult = won / roundBet;
      setMsg(`🎉 জয় +${pnl} · ${result}`);
      record({ pnl, multiplier: mult });
      setOutcome("win");
      fxRef.current?.burst({ count: 60, kind: "confetti", speed: 8 });
      try { sfxWin(mult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -roundBet;
      setMsg(`💥 হার ${pnl} · ${result}`);
      record({ pnl, multiplier: 0 });
      setOutcome("lose");
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 4 });
      try { sfxBust(); } catch { /* noop */ }
    }
    pf.consume(`flip=${result} pick=${pick}`);
    recordMyBet({ game: "coinflip", bet: roundBet, multiplier: mult, payout: won });
    pushMultiplierHistory("coinflip", mult);
    pushSideHistory(result);
    setFlipping(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, pick, record]);

  const auto = useAutoBet({ runRound, baseBet: bet });

  const glow =
    outcome === "win" ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
    outcome === "lose" ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.45)] border-[#3a1414]" :
    "border-[#1a3321]";

  return (
    <GameShell title="Coin Flip" emoji="🪙" gameKey="coinflip">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0a120b] via-[#070f08] to-[#020604] p-6 min-h-[340px] transition-shadow duration-500 ${glow}`}>
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,215,0,0.08),transparent_65%)]" />
          <div className="relative z-10 flex flex-col items-center gap-4" style={{ perspective: "800px" }}>
            <div
              key={`coin-${flipping ? "spin" : face + outcome}`}
              className={`grid h-52 w-52 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-gold)] via-[#ffd54a] to-yellow-800 text-7xl font-black text-[#050a06] shadow-[0_0_50px_rgba(255,215,0,0.4),inset_0_-10px_25px_rgba(0,0,0,0.4),inset_0_10px_20px_rgba(255,255,255,0.35)] ring-4 ${
                outcome === "win" ? "ring-[#00ff88]/70" : outcome === "lose" ? "ring-[#ff4d4d]/60" : "ring-[#00ff88]/40"
              } ${flipping ? "animate-coin-flip" : "animate-coin-idle"}`}
            >
              <span className="drop-shadow-[0_2px_0_rgba(0,0,0,0.35)]">{face === "H" ? "H" : "T"}</span>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
              পিক: <span className="text-[var(--neon-gold)]">{pick === "H" ? "HEADS" : "TAILS"}</span>
            </div>
            {msg && (
              <div className={`animate-fade-in text-lg font-black ${
                outcome === "win" ? "text-[#00ff88]" : outcome === "lose" ? "text-[#ff4d4d]" : "text-[var(--neon-gold)]"
              }`}>{msg}</div>
            )}
          </div>
          <ParticleLayer ref={fxRef} />
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={flipping || auto.running} />
          <MultDisplay label="পেআউট" value="2.00×" sub={<>সম্ভাব্য জয়: <span className="text-[#00ff88]">{bet * 2}</span></>} />
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">পিক করুন</label>
            <div className="grid grid-cols-2 gap-2">
              {(["H", "T"] as Side[]).map(s => (
                <button
                  key={s} disabled={flipping || auto.running} onClick={() => setPick(s)}
                  className={`rounded-lg border-2 px-4 py-3 font-black transition-all active:scale-95 ${
                    pick === s
                      ? "border-[#00ff88] bg-[#00ff88]/15 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.4)]"
                      : "border-[#1a3321] bg-[#112216] text-white/70 hover:border-[#254a30]"
                  }`}
                >
                  {s === "H" ? "HEADS" : "TAILS"}
                </button>
              ))}
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={flipping || auto.running} />
          {mode === "manual" ? (
            <PrimaryButton onClick={() => runRound(bet)} disabled={flipping}>
              {flipping ? "ফ্লিপ হচ্ছে..." : `ফ্লিপ · ${bet}`}
            </PrimaryButton>
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready} />
          )}
          <ProvablyFairPanel pf={pf} gameKey="coinflip" />
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <MultiplierHistoryStrip gameKey="coinflip" />
        {sides.length > 0 && (
          <div className="flex items-center gap-1 rounded-full border border-white/5 bg-black/30 px-2 py-1.5 no-scrollbar overflow-x-auto">
            {sides.slice(0, 16).map((s, i) => (
              <span
                key={i}
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black tabular-nums ring-1 ${
                  s === "H"
                    ? "bg-[var(--neon-gold)]/20 text-[var(--neon-gold)] ring-[var(--neon-gold)]/40"
                    : "bg-[#4dc9ff]/15 text-[#4dc9ff] ring-[#4dc9ff]/30"
                } ${i === 0 ? "scale-110" : ""}`}
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
