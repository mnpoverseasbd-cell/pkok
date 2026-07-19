import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairFloats } from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/color-prediction")({
  head: () => ({ meta: [
    { title: "Color Prediction — Asik Game" },
    { name: "description", content: "Predict the next color: red, green, or violet." },
  ]}),
  component: ColorPredictionGame,
});

type Color = "red" | "green" | "violet";
const WHEEL: Color[] = ["red","green","red","green","red","green","violet","red","green","red"];

function ColorPredictionGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("color-prediction");
  const { data: cfg } = useGameConfig("color-prediction");
  const pf = useProvablyFair("color-prediction");
  const edge = cfg?.house_edge ?? 0.03;
  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Color>("red");
  const [result, setResult] = useState<Color | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const play = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setResult(null);
    const [f] = await fairFloats(pf.serverSeed, pf.clientSeed, pf.nonce, 1);
    await new Promise((r) => setTimeout(r, 500));
    const c = WHEEL[Math.floor(f * WHEEL.length)];
    setResult(c);
    const rawMult = pick === c ? (c === "violet" ? 5 : 2) : 0;
    const mult = +(rawMult * (1 - edge)).toFixed(3);
    if (mult > 0) {
      const w = Math.floor(bet * mult); credit(w);
      const pnl = w - bet;
      setMsg(`🎉 জয় +${pnl} · ${mult}×`);
      record({ pnl, multiplier: mult });
      pushMultiplierHistory("color-prediction", mult);
      recordMyBet({ game: "color-prediction", bet, multiplier: mult, payout: w });
      try { sfxWin(mult); } catch {}
    } else {
      const pnl = -bet;
      setMsg(`💥 হার ${pnl}`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("color-prediction", 0);
      recordMyBet({ game: "color-prediction", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
    pf.consume(`result=${c} · pick=${pick}`);
    setBusy(false);
  }, [busy, bet, pick, edge, placeBet, credit, record, pf]);

  const swatch = (c: Color) =>
    c === "red" ? "bg-rose-500" : c === "green" ? "bg-emerald-500" : "bg-fuchsia-500";

  return (
    <GameShell title="Color Prediction" emoji="🎨" gameKey="color-prediction">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#3a1050] bg-gradient-to-b from-[#160829] via-[#080215] to-[#020008] p-6 min-h-[340px]">
          <div className={`grid h-40 w-40 place-items-center rounded-full border-4 border-white/30 shadow-2xl transition-all ${
            result ? swatch(result) : "bg-gradient-to-br from-slate-700 to-slate-900"
          } ${busy ? "animate-spin" : ""}`}>
            <span className="text-4xl font-black text-white drop-shadow">
              {result ? (result === "red" ? "R" : result === "green" ? "G" : "V") : "?"}
            </span>
          </div>
          {msg && <div className="text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>
        <ControlsPanel>
          <MultDisplay label="পেআউট" value={pick === "violet" ? "5.00×" : "2.00×"} sub={<>ভায়োলেট = 5×, লাল/সবুজ = 2×</>} />
          <div className="grid grid-cols-3 gap-2">
            {(["red","green","violet"] as Color[]).map((c) => (
              <button key={c} disabled={busy} onClick={() => setPick(c)}
                className={`rounded-lg py-3 text-xs font-black uppercase text-white transition ${swatch(c)} ${
                  pick === c ? "ring-2 ring-white" : "opacity-70 hover:opacity-100"
                } disabled:cursor-default`}>
                {c === "red" ? "লাল" : c === "green" ? "সবুজ" : "ভায়োলেট"}
              </button>
            ))}
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={play} disabled={busy}>{busy ? "স্পিন..." : "স্পিন"}</PrimaryButton>
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3"><MultiplierHistoryStrip gameKey="color-prediction" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
