import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairLimbo } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { MultiplierHUD } from "@/components/games/hud/MultiplierHUD";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/limbo")({
  head: () => ({
    meta: [
      { title: "Limbo — Asik Game" },
      { name: "description", content: "Pick a target multiplier. If the round result is at or above your target, you win." },
    ],
  }),
  component: LimboGame,
});

function LimboGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("limbo");
  const { data: cfg } = useGameConfig("limbo");
  const edge = cfg?.house_edge ?? 0.01;
  const pf = useProvablyFair("limbo");
  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(2.0);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  const winChance = Math.min(99, +(99 / target).toFixed(2));
  const payout = target;

  const fxRef = useRef<ParticleBurstHandle>(null);
  const [phase, setPhase] = useState<"idle" | "flying" | "crashed" | "cashed">("idle");

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (target < 1.01) { setMsg("টার্গেট ≥ 1.01× হতে হবে"); return { pnl: 0 }; }
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setRolling(true); setMsg(""); setPhase("flying");
    for (let i = 0; i < 10; i++) {
      setResult(+(1 + Math.random() * (target * 2)).toFixed(2));
      if (i % 2 === 0) { try { sfxPeg(0.35); } catch { /* noop */ } }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 50));
    }
    const final = await fairLimbo(pf.serverSeed, pf.clientSeed, pf.nonce, edge);
    setResult(final);
    let pnl: number;
    let won = 0, mult = 0;
    if (final >= target) {
      won = Math.floor(roundBet * payout * (1 - edge)); credit(won);
      pnl = won - roundBet; mult = won / roundBet;
      setMsg(`🎉 জয় +${pnl} · ${final}×`);
      record({ pnl, multiplier: mult });
      setPhase("cashed");
      fxRef.current?.burst({ count: 70, kind: "confetti", speed: 8 });
      try { sfxWin(mult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -roundBet;
      setMsg(`💥 হার ${pnl} · ${final}×`);
      record({ pnl, multiplier: 0 });
      setPhase("crashed");
      fxRef.current?.burst({ count: 40, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }
    pf.consume(`crash=${final}× target≥${target}×`);
    recordMyBet({ game: "limbo", bet: roundBet, multiplier: mult, payout: won });
    pushMultiplierHistory("limbo", final);
    setRolling(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, payout, target, record]);

  const auto = useAutoBet({ runRound, baseBet: bet });
  const win = result !== null && result >= target;
  const frameGlow =
    phase === "crashed" ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.45)] border-[#3a1414]" :
    phase === "cashed" ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.5)] border-[#143a1f]" :
    phase === "flying" ? "shadow-[0_0_60px_-10px_rgba(255,209,102,0.4)] border-[#3a2f14]" :
    "border-[#1a3321]";

  return (
    <GameShell title="Limbo" emoji="🚀" gameKey="limbo">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0a120b] via-[#070f08] to-[#020604] p-6 min-h-[340px] transition-shadow duration-500 ${frameGlow}`}>
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.08),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
              টার্গেট <span className="text-[var(--neon-gold)]">{target.toFixed(2)}×</span>
            </div>
            <MultiplierHUD value={result ?? 1.0} state={phase} />
            <div className={`text-[11px] font-bold uppercase tracking-[0.25em] ${
              phase === "cashed" ? "text-[#00ff88]" :
              phase === "crashed" ? "text-[#ff4d4d]" :
              phase === "flying" ? "text-[var(--neon-gold)]" : "text-white/40"
            }`}>
              {phase === "cashed" && win ? "🎯 টার্গেট হিট" :
                phase === "crashed" ? "💥 টার্গেট মিস" :
                phase === "flying" ? "রোলিং…" : "প্লে দাও"}
            </div>
          </div>
          {msg && <div className="relative z-10 animate-fade-in text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
          <ParticleLayer ref={fxRef} />
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={rolling || auto.running} />
          <MultDisplay
            label="টার্গেট"
            value={`${target.toFixed(2)}×`}
            sub={<>সম্ভাবনা: <span className="text-[#00ff88]">{winChance}%</span> · জয়: <span className="text-[var(--neon-gold)]">{Math.floor(bet * payout)}</span></>}
          />
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">টার্গেট মাল্টিপ্লায়ার</label>
            <input
              type="number" step="0.01" min={1.01} max={1000} value={target} disabled={rolling || auto.running}
              onChange={(e) => setTarget(Math.max(1.01, Number(e.target.value) || 1.01))}
              className="w-full rounded-lg border border-[#1a3321] bg-[#112216] p-3 font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
            />
            <div className="flex gap-1">
              {[1.5, 2, 5, 10, 100].map((t) => (
                <button
                  key={t} onClick={() => setTarget(t)} disabled={rolling || auto.running}
                  className={`flex-1 rounded px-2 py-1.5 text-xs font-bold transition ${
                    target === t ? "bg-[#00ff88]/15 text-[#00ff88] ring-1 ring-[#00ff88]" : "bg-[#1a3321] text-white/80 hover:bg-[#254a30]"
                  } disabled:opacity-40`}
                >
                  {t}×
                </button>
              ))}
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={rolling || auto.running} />
          {mode === "manual" ? (
            <PrimaryButton onClick={() => runRound(bet)} disabled={rolling}>
              {rolling ? "রোলিং..." : `প্লে · ${Math.floor(bet * payout)}`}
            </PrimaryButton>
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready} />
          )}
          <ProvablyFairPanel pf={pf} gameKey="limbo" />
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="limbo" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
