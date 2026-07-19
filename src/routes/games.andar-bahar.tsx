import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { fairAndarBahar } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/andar-bahar")({
  head: () => ({
    meta: [
      { title: "Andar Bahar — Asik Game" },
      { name: "description", content: "ক্লাসিক ভারতীয় কার্ড গেম — Andar না Bahar, কোন দিকে মিলবে?" },
      { property: "og:title", content: "Andar Bahar — Asik Game" },
      { property: "og:description", content: "Joker কার্ড, দুই পাশে ডিল, প্রথম মিল যে দিকে সে জেতে।" },
    ],
  }),
  component: AndarBahar,
});

type Side = "A" | "B";
type Phase = "idle" | "dealing" | "done";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
// suit = floor(card / 13), 0=♠(black) 1=♥(red) 2=♦(red) 3=♣(black)
const rankOf = (c: number) => RANKS[c % 13];
const suitOf = (c: number) => SUITS[Math.floor(c / 13)];
const isRed = (c: number) => {
  const s = Math.floor(c / 13);
  return s === 1 || s === 2;
};

// Payout ~1.95× → ~2.5% house edge on winning side, matches BD live-casino Andar Bahar.
const PAYOUT_MULT = 1.95;

function AndarBahar() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("andar-bahar");
  const { data: cfg } = useGameConfig("andar-bahar");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("andar-bahar");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Side>("A");
  const [phase, setPhase] = useState<Phase>("idle");
  const [joker, setJoker] = useState<number | null>(null);
  const [andar, setAndar] = useState<number[]>([]);
  const [bahar, setBahar] = useState<number[]>([]);
  const [winner, setWinner] = useState<Side | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const clearBoard = () => {
    setJoker(null); setAndar([]); setBahar([]); setWinner(null); setMsg("");
  };

  const runRound = useCallback(async () => {
    if (phase === "dealing") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    clearBoard();
    setPhase("dealing");

    const result = await fairAndarBahar(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Reveal joker first
    setJoker(result.joker);
    try { sfxPeg(0.5); } catch { /* noop */ }
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, 450));

    // Deal alternately Bahar → Andar to match the outcome
    const bList: number[] = [];
    const aList: number[] = [];
    const total = result.andar.length + result.bahar.length;
    // Reconstruct order: Bahar[0], Andar[0], Bahar[1], Andar[1], ...
    for (let i = 0; i < total; i++) {
      const toBahar = i % 2 === 0;
      if (toBahar) {
        const idx = Math.floor(i / 2);
        if (idx < result.bahar.length) {
          bList.push(result.bahar[idx]);
          setBahar([...bList]);
        }
      } else {
        const idx = Math.floor(i / 2);
        if (idx < result.andar.length) {
          aList.push(result.andar[idx]);
          setAndar([...aList]);
        }
      }
      try { sfxPeg(0.28); } catch { /* noop */ }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, 180));
    }

    setWinner(result.winner);
    let pnl: number;
    let won = 0;
    let mult = 0;
    if (result.winner === pick) {
      won = Math.floor(bet * PAYOUT_MULT * (1 - edge));
      credit(won);
      pnl = won - bet;
      mult = won / bet;
      setMsg(`🎉 জয় · ${result.winner === "A" ? "Andar" : "Bahar"} মিলেছে · +${pnl}`);
      record({ pnl, multiplier: mult });
      fxRef.current?.burst({ count: 70, kind: "confetti", speed: 8 });
      try { sfxWin(mult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      setMsg(`💥 হার · ${result.winner === "A" ? "Andar" : "Bahar"} জিতেছে`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`ab joker=${rankOf(result.joker)}${suitOf(result.joker)} winner=${result.winner} cards=${result.cardsDrawn}`);
    recordMyBet({ game: "andar-bahar", bet, multiplier: mult, payout: won });
    pushMultiplierHistory("andar-bahar", mult);
    setPhase("done");
  }, [phase, pf, placeBet, credit, edge, bet, pick, record]);

  const reset = () => { clearBoard(); setPhase("idle"); };
  const busy = phase === "dealing";

  const glow =
    winner && winner === pick ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
      winner && winner !== pick ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
        "border-[#1a3321]";

  return (
    <GameShell title="Andar Bahar" emoji="🃏" gameKey="andar-bahar">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b1a12] via-[#061008] to-[#020604] p-4 min-h-[420px] transition-shadow duration-500 ${glow}`}>
          {/* Table felt pattern */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.08),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          {/* Joker */}
          <div className="relative z-10 mb-4 flex flex-col items-center">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ffd166]">Joker Card</div>
            <div className="mt-2 min-h-[130px]">
              {joker !== null ? (
                <CardView card={joker} highlight />
              ) : (
                <CardBack />
              )}
            </div>
          </div>

          {/* Piles */}
          <div className="relative z-10 grid flex-1 grid-cols-2 gap-3">
            <Pile
              title="ANDAR"
              subtitle="আন্দর"
              cards={andar}
              pick={pick === "A"}
              won={winner === "A"}
              lost={winner === "B"}
              side="left"
            />
            <Pile
              title="BAHAR"
              subtitle="বাহার"
              cards={bahar}
              pick={pick === "B"}
              won={winner === "B"}
              lost={winner === "A"}
              side="right"
            />
          </div>

          {/* Status */}
          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              winner === pick ? "text-[#00ff88]" : winner ? "text-[#ff4d4d]" : "text-[#ffd166]"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          {/* Payout display */}
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">সম্ভাব্য জয়</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {Math.floor(bet * PAYOUT_MULT).toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">@ {PAYOUT_MULT}×</span>
            </div>
          </div>

          {/* Side pick */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#00ff88]">কোন দিকে বাজি?</label>
            <div className="grid grid-cols-2 gap-2">
              {(["A", "B"] as Side[]).map((s) => (
                <button
                  key={s}
                  disabled={busy}
                  onClick={() => setPick(s)}
                  className={`rounded-lg border-2 px-4 py-3 font-black transition-all active:scale-95 ${
                    pick === s
                      ? "border-[#00ff88] bg-[#00ff88]/15 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.4)]"
                      : "border-[#1a3321] bg-[#112216] text-white/70 hover:border-[#254a30]"
                  }`}
                >
                  <div className="text-sm">{s === "A" ? "ANDAR" : "BAHAR"}</div>
                  <div className="text-[10px] font-bold opacity-70">{s === "A" ? "আন্দর" : "বাহার"}</div>
                </button>
              ))}
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={busy} />

          {phase === "done" ? (
            <PrimaryButton onClick={reset}>আবার খেলুন</PrimaryButton>
          ) : (
            <PrimaryButton onClick={runRound} disabled={busy}>
              {busy ? "ডিল হচ্ছে..." : `ডিল করুন · ${bet}`}
            </PrimaryButton>
          )}

          <ProvablyFairPanel pf={pf} gameKey="andar-bahar" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="andar-bahar" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

// ---------- Card visuals ----------
function CardView({ card, small, highlight }: { card: number; small?: boolean; highlight?: boolean }) {
  const red = isRed(card);
  const sz = small ? "h-16 w-11" : "h-24 w-16";
  return (
    <div
      className={`relative ${sz} shrink-0 rounded-md border bg-white shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all animate-fade-in ${
        highlight ? "ring-2 ring-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.7)]" : "border-black/30"
      }`}
    >
      <div className={`absolute left-1 top-0.5 text-[10px] font-black leading-none ${red ? "text-red-600" : "text-black"}`}>
        {rankOf(card)}
      </div>
      <div className={`absolute right-1 bottom-0.5 rotate-180 text-[10px] font-black leading-none ${red ? "text-red-600" : "text-black"}`}>
        {rankOf(card)}
      </div>
      <div className={`grid h-full w-full place-items-center ${small ? "text-xl" : "text-3xl"} font-black ${red ? "text-red-600" : "text-black"}`}>
        {suitOf(card)}
      </div>
    </div>
  );
}

function CardBack() {
  return (
    <div className="h-24 w-16 rounded-md border border-white/10 bg-gradient-to-br from-[#1a3321] via-[#0a2015] to-[#050a06] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
      <div className="grid h-full w-full place-items-center text-2xl">🎴</div>
    </div>
  );
}

function Pile({
  title, subtitle, cards, pick, won, lost, side,
}: {
  title: string; subtitle: string; cards: number[];
  pick: boolean; won: boolean; lost: boolean; side: "left" | "right";
}) {
  const tone =
    won ? "border-[#00ff88]/70 bg-[#00ff88]/8 shadow-[0_0_25px_-8px_rgba(0,255,136,0.6)]" :
      lost ? "border-[#ff4d4d]/40 bg-[#ff4d4d]/5" :
        pick ? "border-[#ffd166]/60 bg-[#ffd166]/5" :
          "border-white/10 bg-black/30";
  return (
    <div className={`flex flex-col rounded-xl border p-3 transition-all ${tone}`}>
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className={`text-xs font-black tracking-widest ${won ? "text-[#00ff88]" : "text-white/80"}`}>{title}</div>
          <div className="text-[10px] font-bold text-white/50">{subtitle}</div>
        </div>
        <div className="text-[10px] font-bold text-white/40">{cards.length} cards</div>
      </div>
      <div className={`flex flex-wrap gap-1 ${side === "right" ? "justify-end" : "justify-start"}`}>
        {cards.map((c, i) => (
          <CardView key={`${c}-${i}`} card={c} small />
        ))}
        {cards.length === 0 && (
          <div className="text-[11px] italic text-white/30">—</div>
        )}
      </div>
    </div>
  );
}

