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
import { fairDice } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg } from "@/lib/sound";

export const Route = createFileRoute("/games/dice")({
  head: () => ({ meta: [{ title: "Lucky Dice — Asik Game" }, { name: "description", content: "Predict the roll, win multiplier." }] }),
  component: DiceGame,
});

function DiceGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("dice");
  const { data: cfg } = useGameConfig("dice");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("dice");
  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(50);
  const [rolling, setRolling] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  const winChance = target;
  const payout = winChance > 0 ? +(99 / winChance).toFixed(4) : 0;

  const fxRef = useRef<ParticleBurstHandle>(null);

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setRolling(true); setMsg("");
    // quick shuffle animation with subtle tick SFX
    for (let i = 0; i < 8; i++) {
      setRoll(+(Math.random() * 100).toFixed(2));
      if (i % 2 === 0) { try { sfxPeg(0.4); } catch { /* noop */ } }
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 55));
    }
    const final = await fairDice(pf.serverSeed, pf.clientSeed, pf.nonce);
    setRoll(final);
    let pnl: number;
    let won = 0;
    let mult = 0;
    if (final < target) {
      won = Math.floor(roundBet * payout * (1 - edge)); credit(won);
      pnl = won - roundBet;
      mult = won / roundBet;
      setMsg(`🎉 জয় +${pnl} · roll ${final}`);
      record({ pnl, multiplier: mult });
      fxRef.current?.burst({ count: 60, kind: "confetti", speed: 8 });
      try { sfxWin(mult); } catch { /* noop */ }
    } else {
      pnl = -roundBet;
      setMsg(`💥 হার ${pnl} · roll ${final}`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 4 });
      try { sfxBust(); } catch { /* noop */ }
    }
    pf.consume(`roll=${final} target<${target}`);
    recordMyBet({ game: "dice", bet: roundBet, multiplier: mult, payout: won });
    pushMultiplierHistory("dice", mult);
    setRolling(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, payout, target, record]);

  const auto = useAutoBet({ runRound, baseBet: bet });

  const win = roll !== null && roll < target;
  const rollPct = roll ?? 0;

  return (
    <GameShell title="Lucky Dice" emoji="🎲" gameKey="dice">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#1a3321] bg-gradient-to-b from-[#0a120b] via-[#070f08] to-[#020604] p-6 min-h-[340px]">
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.08),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div
              className={`grid h-56 w-56 place-items-center rounded-3xl border-2 bg-gradient-to-br text-6xl font-black tabular-nums shadow-2xl transition-all duration-300 ${
                roll === null
                  ? "border-[#1a3321] from-[#112216] to-[#0a120b] text-white/70"
                  : win
                    ? "border-[#00ff88] from-[#00ff88]/20 to-[#004d2a] text-[#00ff88] shadow-[0_0_50px_rgba(0,255,136,0.5)] animate-cash-pop"
                    : "border-[#ff4d4d]/60 from-[#3a1414]/40 to-[#0a120b] text-[#ff8a8a] shadow-[0_0_40px_rgba(255,77,77,0.35)] animate-crash-shake"
              } ${rolling ? "animate-pulse" : ""}`}
            >
              {roll?.toFixed(2) ?? "0.00"}
            </div>
            <div className="w-full max-w-md">
              <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-widest">
                <span className="text-white/50">0</span>
                <span className="text-[#00ff88]">টার্গেট {target}</span>
                <span className="text-white/50">100</span>
              </div>
              <div className="relative h-3 rounded-full bg-[#112216] ring-1 ring-[#1a3321]">
                <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00884a] to-[#00ff88] transition-[width] duration-300" style={{ width: `${target}%` }} />
                <div className="absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--neon-gold)] shadow-[0_0_8px_var(--neon-gold)]" style={{ left: `${target}%` }} />
                {roll !== null && (
                  <div
                    className={`absolute -top-1 h-5 w-5 -translate-x-1/2 rounded-full border-2 transition-[left] duration-300 ${
                      win ? "border-[#00ff88] bg-[#00ff88]/40 shadow-[0_0_12px_#00ff88]" : "border-[#ff4d4d] bg-[#ff4d4d]/40 shadow-[0_0_12px_#ff4d4d]"
                    }`}
                    style={{ left: `${rollPct}%` }}
                  />
                )}
              </div>
            </div>
            {msg && <div className="animate-fade-in text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
          </div>
          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={rolling || auto.running} />
          <MultDisplay
            label="পেআউট"
            value={`${payout.toFixed(2)}×`}
            sub={<>জয়ের সম্ভাবনা: <span className="text-[#00ff88]">{winChance}%</span></>}
          />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-white/60">রোল আন্ডার</label>
              <span className="font-bold text-[#00ff88]">{target}</span>
            </div>
            <input
              type="range" min={2} max={98} value={target}
              onChange={e => setTarget(Number(e.target.value))} disabled={rolling || auto.running}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#112216] accent-[#00ff88] disabled:opacity-50"
            />
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={rolling || auto.running} />
          {mode === "manual" ? (
            <PrimaryButton onClick={() => runRound(bet)} disabled={rolling}>
              {rolling ? "রোলিং..." : `রোল · ${Math.floor(bet * payout)}`}
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
