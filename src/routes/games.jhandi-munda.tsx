import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairJhandi, jhandiCount, jhandiNetMult, JHANDI_SYMBOLS } from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/jhandi-munda")({
  head: () => ({ meta: [
    { title: "Jhandi Munda · Crown & Anchor — Asik Game" },
    { name: "description", content: "৬টি ডাইস · ৬টি প্রতীক। আপনার প্রতীক যত দিতে বেশি দেখাবে, তত বড় জয়!" },
    { property: "og:title", content: "Jhandi Munda · Crown & Anchor — Asik Game" },
    { property: "og:description", content: "Classic 6-symbol arcade dice. Pick a symbol, roll 6 dice — win 1×–6× per match." },
  ]}),
  component: JhandiGame,
});

type Phase = "idle" | "rolling" | "settled";
type State =
  | { phase: "idle" }
  | { phase: "rolling"; pickIdx: number; bet: number }
  | { phase: "settled"; pickIdx: number; bet: number; dice: number[]; count: number; payout: number; mult: number };

const ROLL_MS = 1400;

function JhandiGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("jhandi-munda");
  const pf = useProvablyFair("jhandi-munda");

  const [bet, setBet] = useState(50);
  const [pickIdx, setPickIdx] = useState(0);
  const [state, setState] = useState<State>({ phase: "idle" });
  const [msg, setMsg] = useState("");
  const [shownDice, setShownDice] = useState<number[]>([0, 1, 2, 3, 4, 5]);

  const roll = useCallback(async () => {
    if (state.phase === "rolling") return;
    if (!pf.ready) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setState({ phase: "rolling", pickIdx, bet });
    setMsg("");

    // shuffle animation
    const startedAt = Date.now();
    const spin = setInterval(() => {
      setShownDice(Array.from({ length: 6 }, () => Math.floor(Math.random() * 6)));
      if (Date.now() - startedAt >= ROLL_MS - 60) clearInterval(spin);
    }, 90);

    const r = await fairJhandi(pf.serverSeed, pf.clientSeed, pf.nonce);
    await new Promise((r) => setTimeout(r, ROLL_MS));
    clearInterval(spin);
    setShownDice(r.dice);

    const count = jhandiCount(r.dice, pickIdx);
    const mult = jhandiNetMult(count);
    const payout = Math.floor(bet * mult);
    if (payout > 0) credit(payout);
    const pnl = payout - bet;

    record({ pnl, multiplier: mult });
    pushMultiplierHistory("jhandi-munda", mult);
    recordMyBet({ game: "jhandi-munda", bet, multiplier: mult, payout });
    pf.consume(`dice=[${r.symbols.join("")}] · pick=${JHANDI_SYMBOLS[pickIdx]} · count=${count}`);
    try { count > 0 ? sfxWin(mult) : sfxBust(); } catch {}

    setState({ phase: "settled", pickIdx, bet, dice: r.dice, count, payout, mult });
    setMsg(count > 0 ? `🎉 ${count} মিল · +${pnl}` : `💥 কোন মিল নেই · ${pnl}`);
  }, [state.phase, pf, bet, pickIdx, placeBet, credit, record]);

  const rolling = state.phase === "rolling";

  return (
    <GameShell title="Jhandi Munda" emoji="🚩" gameKey="jhandi-munda">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-[#3a2410] bg-gradient-to-b from-[#1a0f04] via-[#0f0803] to-[#050201] p-6 min-h-[340px]">
          {/* Table felt */}
          <div className="pointer-events-none absolute inset-0 opacity-40"
            style={{ background: "radial-gradient(ellipse at center, rgba(255,180,80,0.25), transparent 70%)" }} />

          {/* Dice tray */}
          <div className="relative z-[1] grid grid-cols-6 gap-3">
            {shownDice.map((d, i) => {
              const matched = state.phase === "settled" && d === state.pickIdx;
              return (
                <div key={i}
                  className={`grid h-16 w-16 place-items-center rounded-xl border-2 text-3xl font-black transition-all duration-200 ${
                    matched
                      ? "border-yellow-300 bg-yellow-500/25 text-yellow-100 shadow-[0_0_18px_rgba(250,204,21,0.7)] scale-105"
                      : "border-white/25 bg-white/5 text-white/90"
                  } ${rolling ? "animate-pulse" : ""}`}>
                  {JHANDI_SYMBOLS[d]}
                </div>
              );
            })}
          </div>

          {/* Result */}
          <div className="relative z-[1] min-h-[36px] text-lg font-black text-[var(--neon-gold)]">
            {msg}
          </div>
        </div>

        <ControlsPanel>
          <MultDisplay
            label="আপনার পিক"
            value={JHANDI_SYMBOLS[pickIdx]}
            sub={<>জয়: <span className="text-cyan-300">×2 – ×7</span> (মিল অনুযায়ী)</>}
          />

          {/* Symbol picker */}
          <div className="grid grid-cols-6 gap-1.5">
            {JHANDI_SYMBOLS.map((s, i) => (
              <button
                key={s}
                disabled={rolling}
                onClick={() => setPickIdx(i)}
                className={`grid h-12 place-items-center rounded-lg border-2 text-2xl transition ${
                  pickIdx === i
                    ? "border-yellow-300 bg-yellow-500/25 text-yellow-100 shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                    : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
                } disabled:opacity-50`}>
                {s}
              </button>
            ))}
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={rolling} />

          <PrimaryButton onClick={roll} tone="gold" disabled={rolling || !pf.ready}>
            {rolling ? "🎲 ঘুরছে..." : `🎲 রোল · বাজি ${bet}`}
          </PrimaryButton>

          {/* Paytable */}
          <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
            <div className="mb-1.5 font-bold text-white/90">পেমেন্ট টেবিল</div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-1 font-mono">
              <div>০ মিল → হার</div>
              <div>১ মিল → ×2</div>
              <div>২ মিল → ×3</div>
              <div>৩ মিল → ×4</div>
              <div>৪ মিল → ×5</div>
              <div>৫ মিল → ×6</div>
              <div>৬ মিল → ×7</div>
            </div>
          </div>
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3"><MultiplierHistoryStrip gameKey="jhandi-munda" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="mt-3"><ProvablyFairPanel pf={pf} gameKey="jhandi-munda" /></div>
    </GameShell>
  );
}
