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
import { fairDice } from "@/lib/provablyFair";

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

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setRolling(true); setMsg("");
    // quick shuffle animation
    for (let i = 0; i < 6; i++) {
      setRoll(+(Math.random() * 100).toFixed(2));
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 45));
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
    } else {
      pnl = -roundBet;
      setMsg(`💥 হার ${pnl} · roll ${final}`);
      record({ pnl, multiplier: 0 });
    }
    pf.consume(`roll=${final} target<${target}`);
    recordMyBet({ game: "dice", bet: roundBet, multiplier: mult, payout: won });
    setRolling(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, payout, target, record]);

  const auto = useAutoBet({ runRound, baseBet: bet });

  const win = roll !== null && roll < target;

  return (
    <GameShell title="Lucky Dice" emoji="🎲" gameKey="dice">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div
            className={`grid h-56 w-56 place-items-center rounded-3xl border-2 bg-gradient-to-br text-6xl font-black tabular-nums shadow-2xl transition-colors ${
              win ? "border-[#00ff88] from-[#00ff88]/15 to-[#004d2a] text-[#00ff88] shadow-[0_0_30px_rgba(0,255,136,0.4)]"
                  : "border-[#1a3321] from-[#112216] to-[#0a120b] text-white"
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
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#00884a] to-[#00ff88]" style={{ width: `${target}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 h-5 w-1 bg-[var(--neon-gold)] shadow-[0_0_8px_var(--neon-gold)]" style={{ left: `${target}%` }} />
            </div>
          </div>
          {msg && <div className="animate-fade-in text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
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
    </GameShell>
  );
}
