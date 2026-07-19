import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import {
  fair32Cards,
  t32CardLabel,
  t32CardSuit,
  t32CardValue,
  T32_BASE,
  type ThirtyTwoPlayer,
} from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/32-cards")({
  head: () => ({
    meta: [
      { title: "32 Cards — Asik Game" },
      { name: "description", content: "চার প্লেয়ার · ৩২ কার্ড · সর্বোচ্চ স্কোর জেতে। বেছে নিন Player 8, 9, 10 বা 11 — প্রতি রাউন্ডে ৩.৮×!" },
      { property: "og:title", content: "32 Cards — Asik Game" },
      { property: "og:description", content: "Bangladeshi live casino ক্লাসিক — 32 Cards, provably-fair এবং instant payout।" },
    ],
  }),
  component: ThirtyTwoCards;
});

type Phase = "idle" | "dealing" | "done";

const PAYOUT = 3.85; // fair share for 4 players minus small edge

const PLAYERS: ThirtyTwoPlayer[] = ["A", "B", "C", "D"];
const LABEL: Record<ThirtyTwoPlayer, string> = { A: "Player 8", B: "Player 9", C: "Player 10", D: "Player 11" };
const TONE: Record<ThirtyTwoPlayer, string> = {
  A: "#ff6b9d",
  B: "#ffd166",
  C: "#00ff88",
  D: "#6ee7ff",
};

function CardChip({ card, delay }: { card: number; delay: number }) {
  const suit = t32CardSuit(card);
  const red = suit === 1 || suit === 2;
  return (
    <div
      className="relative flex h-10 w-8 shrink-0 items-center justify-center rounded-md border border-black/40 bg-gradient-to-br from-white via-[#f4f4f4] to-[#d8d8d8] text-[13px] font-black shadow-[0_4px_10px_rgba(0,0,0,0.55)] animate-fade-in"
      style={{ animationDelay: `${delay}ms`, color: red ? "#c8102e" : "#0a0a0a" }}
    >
      {t32CardLabel(card)}
    </div>
  );
}

function PlayerRow({
  p,
  cards,
  total,
  revealed,
  winner,
  picked,
}: {
  p: ThirtyTwoPlayer;
  cards: number[];
  total: number;
  revealed: number;
  winner: ThirtyTwoPlayer | "TIE" | null;
  picked: boolean;
}) {
  const isWin = winner === p;
  const isLoss = winner && winner !== p;
  const tone = TONE[p];
  const runningTotal = T32_BASE[p] + cards.slice(0, revealed).reduce((s, c) => s + t32CardValue(c), 0);

  return (
    <div
      className={`relative rounded-xl border-2 bg-black/40 p-2 transition-all ${
        isWin
          ? "shadow-[0_0_40px_-5px_rgba(255,209,102,0.6)]"
          : isLoss
            ? "opacity-50"
            : ""
      } ${picked ? "" : ""}`}
      style={{
        borderColor: isWin ? "#ffd166" : picked ? tone : "rgba(255,255,255,0.08)",
        boxShadow: picked && !winner ? `0 0 18px ${tone}55` : undefined,
      }}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-black text-black"
            style={{ background: tone }}
          >
            {T32_BASE[p]}
          </span>
          <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{LABEL[p]}</span>
          {picked && (
            <span className="rounded-full border border-white/20 px-1.5 py-0.5 text-[9px] font-black text-white/70">
              আপনার বাজি
            </span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-widest text-white/40">Total</div>
          <div
            className="text-lg font-black tabular-nums"
            style={{ color: winner === p ? "#ffd166" : "white" }}
          >
            {revealed === cards.length ? total : runningTotal}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {cards.slice(0, revealed).map((c, i) => (
          <CardChip key={i} card={c} delay={i * 30} />
        ))}
        {Array.from({ length: Math.max(0, cards.length - revealed) }).map((_, i) => (
          <div
            key={`b${i}`}
            className="h-10 w-8 shrink-0 rounded-md border border-white/10 bg-gradient-to-br from-[#101820] to-[#0a1116]"
          />
        ))}
      </div>
    </div>
  );
}

function ThirtyTwoCards() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("32-cards");
  const { data: cfg } = useGameConfig("32-cards");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("32-cards");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<ThirtyTwoPlayer>("A");
  const [phase, setPhase] = useState<Phase>("idle");
  const [hands, setHands] = useState<Record<ThirtyTwoPlayer, number[]>>({ A: [], B: [], C: [], D: [] });
  const [totals, setTotals] = useState<Record<ThirtyTwoPlayer, number>>({ A: 8, B: 9, C: 10, D: 11 });
  const [revealed, setRevealed] = useState(0);
  const [winner, setWinner] = useState<ThirtyTwoPlayer | "TIE" | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const runRound = useCallback(async () => {
    if (phase === "dealing") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }

    setMsg("");
    setWinner(null);
    setRevealed(0);
    setHands({ A: [], B: [], C: [], D: [] });
    setTotals({ A: T32_BASE.A, B: T32_BASE.B, C: T32_BASE.C, D: T32_BASE.D });
    setPhase("dealing");

    const r = await fair32Cards(pf.serverSeed, pf.clientSeed, pf.nonce);
    setHands(r.hands);

    // Reveal cards one round at a time (4 cards per round × 8 rounds = 32 cards).
    for (let round = 1; round <= 8; round++) {
      await new Promise((res) => setTimeout(res, 130));
      setRevealed(round);
      try { sfxPeg(0.35); } catch { /* noop */ }
    }
    await new Promise((res) => setTimeout(res, 250));

    setTotals(r.totals);
    setWinner(r.winner);

    const won = r.winner === pick;
    let pnl: number;
    let credited = 0;
    let winMult = 0;
    if (won) {
      credited = Math.floor(bet * PAYOUT * (1 - edge));
      credit(credited);
      pnl = credited - bet;
      winMult = credited / bet;
      setMsg(`🎉 জয় · ${LABEL[pick]} · Total ${r.totals[pick]} · +${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({ count: 100, kind: "confetti", speed: 7 });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      const wLabel = r.winner === "TIE" ? "TIE (House)" : LABEL[r.winner];
      setMsg(`💥 হার · ${wLabel} জিতেছে (Total ${r.winner === "TIE" ? Math.max(r.totals.A, r.totals.B, r.totals.C, r.totals.D) : r.totals[r.winner]})`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 26, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`32c winner=${r.winner} A=${r.totals.A} B=${r.totals.B} C=${r.totals.C} D=${r.totals.D}`);
    recordMyBet({ game: "32-cards", bet, multiplier: winMult, payout: credited });
    pushMultiplierHistory("32-cards", winMult);
    setPhase("done");
  }, [phase, pf, placeBet, credit, edge, bet, pick, record]);

  const resetRound = () => {
    setHands({ A: [], B: [], C: [], D: [] });
    setTotals({ A: T32_BASE.A, B: T32_BASE.B, C: T32_BASE.C, D: T32_BASE.D });
    setRevealed(0);
    setWinner(null);
    setMsg("");
    setPhase("idle");
  };
  const busy = phase === "dealing";
  const potential = Math.floor(bet * PAYOUT);

  return (
    <GameShell title="32 Cards" emoji="🃏" gameKey="32-cards">
      <GameFrame>
        <div
          className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b1f18] via-[#050d0a] to-[#020404] p-4 min-h-[440px] transition-shadow duration-500 ${
            winner && winner === pick
              ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]"
              : winner && winner !== pick
                ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]"
                : "border-[#1a3a2a]"
          }`}
        >
          {/* felt */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.10),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          <div className="relative z-10 mb-3 flex items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">
            <span>Round {Math.min(revealed, 8)} / 8</span>
            <span className="text-white/50">32-Card Deck</span>
            <span className="text-[#00ff88]">Pay {PAYOUT}×</span>
          </div>

          <div className="relative z-10 grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
            {PLAYERS.map((p) => (
              <PlayerRow
                key={p}
                p={p}
                cards={hands[p]}
                total={totals[p]}
                revealed={revealed}
                winner={winner}
                picked={pick === p}
              />
            ))}
          </div>

          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              winner === pick ? "text-[#00ff88]" : winner ? "text-[#ff4d4d]" : "text-[#ffd166]"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">সম্ভাব্য জয়</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {potential.toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">@ {PAYOUT}×</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">কোন প্লেয়ার জিতবে?</label>
            <div className="grid grid-cols-2 gap-2">
              {PLAYERS.map((p) => (
                <button
                  key={p}
                  disabled={busy}
                  onClick={() => setPick(p)}
                  style={
                    pick === p
                      ? { borderColor: TONE[p], boxShadow: `0 0 15px ${TONE[p]}66`, background: `${TONE[p]}18`, color: TONE[p] }
                      : undefined
                  }
                  className={`rounded-lg border-2 px-3 py-3 text-left font-black transition-all active:scale-95 ${
                    pick === p ? "" : "border-[#1a3a2a] bg-[#0c1a14] text-white/70 hover:border-[#2a5a3a]"
                  }`}
                >
                  <div className="text-sm leading-tight">{LABEL[p]}</div>
                  <div className="text-[10px] font-bold opacity-70 leading-tight">Base {T32_BASE[p]}</div>
                </button>
              ))}
            </div>
            <div className="text-[10px] text-white/40 leading-relaxed">
              টাই হলে হাউস জেতে · সব প্লেয়ারের পেআউট সমান {PAYOUT}×
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={busy} />

          {phase === "done" ? (
            <PrimaryButton onClick={resetRound}>আবার খেলুন</PrimaryButton>
          ) : (
            <PrimaryButton onClick={runRound} disabled={busy}>
              {busy ? "কার্ড ডিল হচ্ছে..." : `ডিল করুন · ${bet}`}
            </PrimaryButton>
          )}

          <ProvablyFairPanel pf={pf} gameKey="32-cards" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="32-cards" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
