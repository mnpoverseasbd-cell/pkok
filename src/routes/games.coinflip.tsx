import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";

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
  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Side>("H");
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState<Side>("H");
  const [msg, setMsg] = useState("");

  const play = async () => {
    if (flipping) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setFlipping(true); setMsg("");
    for (let i = 0; i < 14; i++) {
      setFace(Math.random() < 0.5 ? "H" : "T");
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 80));
    }
    const result: Side = Math.random() < 0.49 ? "H" : "T";
    setFace(result);
    if (result === pick) {
      const won = Math.floor(bet * 2 * (1 - edge)); credit(won);
      setMsg(`🎉 জয় +${won - bet}`);
      record({ pnl: won - bet, multiplier: won / bet });
    } else {
      setMsg(`💥 হার -${bet}`);
      record({ pnl: -bet, multiplier: 0 });
    }
    setFlipping(false);
  };

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
          <MultDisplay label="পেআউট" value="2.00×" sub={<>সম্ভাব্য জয়: <span className="text-[#00ff88]">{bet * 2}</span></>} />
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">পিক করুন</label>
            <div className="grid grid-cols-2 gap-2">
              {(["H", "T"] as Side[]).map(s => (
                <button
                  key={s} disabled={flipping} onClick={() => setPick(s)}
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
          <BetControls bet={bet} setBet={setBet} disabled={flipping} />
          <PrimaryButton onClick={play} disabled={flipping}>
            {flipping ? "ফ্লিপ হচ্ছে..." : `ফ্লিপ · ${bet}`}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}
