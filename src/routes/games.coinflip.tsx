import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameShell, BetControls } from "@/components/games/GameShell";
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
  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Side>("H");
  const [flipping, setFlipping] = useState(false);
  const [face, setFace] = useState<Side>("H");
  const [msg, setMsg] = useState("");

  const play = async () => {
    if (flipping) return;
    if (!placeBet(bet)) { setMsg("Not enough balance"); return; }
    setFlipping(true);
    setMsg("");
    for (let i = 0; i < 14; i++) {
      setFace(Math.random() < 0.5 ? "H" : "T");
      // eslint-disable-next-line no-await-in-loop
      await new Promise(r => setTimeout(r, 80));
    }
    const result: Side = Math.random() < 0.49 ? "H" : "T"; // slight edge
    setFace(result);
    if (result === pick) {
      const won = bet * 2;
      credit(won);
      setMsg(`🎉 WIN +${won - bet}`);
      record({ pnl: won - bet, multiplier: 2 });
    } else {
      setMsg(`💥 LOSE -${bet}`);
      record({ pnl: -bet, multiplier: 0 });
    }
    setFlipping(false);
  };

  return (
    <GameShell title="Coin Flip" emoji="🪙">
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="grid gap-4 rounded-xl bg-black/40 p-6 ring-1 ring-white/10 md:grid-cols-2">
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className={`grid h-40 w-40 place-items-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 text-5xl font-black text-black shadow-2xl ring-4 ring-yellow-200/60 ${flipping ? "animate-spin" : ""}`}
          >
            {face === "H" ? "H" : "T"}
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)] animate-fade-in">{msg}</div>}
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-xs text-white/70">PICK</div>
            <div className="grid grid-cols-2 gap-2">
              {(["H", "T"] as Side[]).map(s => (
                <button
                  key={s} disabled={flipping} onClick={() => setPick(s)}
                  className={`rounded-lg px-4 py-3 font-black transition ${
                    pick === s
                      ? "bg-[var(--neon-gold)] text-black ring-2 ring-white/40"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {s === "H" ? "HEADS" : "TAILS"}
                </button>
              ))}
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={flipping} />
          <button
            onClick={play} disabled={flipping}
            className="rounded-lg bg-gradient-to-r from-[var(--neon-gold)] to-yellow-500 px-4 py-3 font-black text-black shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {flipping ? "Flipping..." : `FLIP · Win ${bet * 2}`}
          </button>
        </div>
      </div>
    </GameShell>
  );
}
