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
import { fairCoinflip } from "@/lib/provablyFair";

export const Route = createFileRoute("/games/coinflip")({
  head: () => ({ meta: [{ title: "Coin Flip — Asik Game" }, { name: "description", content: "Heads or Tails, 2× payout." }] }),
  component: CoinFlip,
});

type Side = "H" | "T";

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

  const runRound = useCallback(async (roundBet: number) => {
    if (!pf.ready) return { pnl: 0 };
    if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return { pnl: 0 }; }
    setFlipping(true); setMsg("");
    for (let i = 0; i < 10; i++) {
      setFace(Math.random() < 0.5 ? "H" : "T");
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 60));
    }
    const isHeads = await fairCoinflip(pf.serverSeed, pf.clientSeed, pf.nonce);
    const result: Side = isHeads ? "H" : "T";
    setFace(result);
    let pnl: number;
    if (result === pick) {
      const won = Math.floor(roundBet * 2 * (1 - edge)); credit(won);
      pnl = won - roundBet;
      setMsg(`🎉 জয় +${pnl} · ${result}`);
      record({ pnl, multiplier: won / roundBet });
    } else {
      pnl = -roundBet;
      setMsg(`💥 হার ${pnl} · ${result}`);
      record({ pnl, multiplier: 0 });
    }
    pf.consume(`flip=${result} pick=${pick}`);
    setFlipping(false);
    return { pnl };
  }, [pf, placeBet, credit, edge, pick, record]);

  const auto = useAutoBet({ runRound, baseBet: bet });

  return (
    <GameShell title="Coin Flip" emoji="🪙" gameKey="coinflip">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div
            className={`grid h-48 w-48 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-gold)] to-yellow-700 text-6xl font-black text-[#050a06] shadow-[0_0_40px_rgba(255,215,0,0.35),inset_0_0_30px_rgba(0,0,0,0.4)] ring-4 ring-[#00ff88]/40 ${flipping ? "animate-spin" : ""}`}
          >
            {face === "H" ? "H" : "T"}
          </div>
          {msg && <div className="animate-fade-in text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
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
                  className={`rounded-lg border-2 px-4 py-3 font-black transition ${
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
    </GameShell>
  );
}
