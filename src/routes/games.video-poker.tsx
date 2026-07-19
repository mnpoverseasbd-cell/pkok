import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import {
  fairVideoPokerDeck,
  evaluateVideoPokerHand,
  VP_LABEL,
  VP_PAYOUTS,
  type VPRank,
} from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/games/video-poker")({
  head: () => ({
    meta: [
      { title: "Video Poker · Jacks or Better — Asik Game" },
      { name: "description", content: "৫-কার্ড পোকার · কার্ড হোল্ড করে ড্র করুন · Royal Flush 800× পর্যন্ত পেআউট।" },
      { property: "og:title", content: "Video Poker · Jacks or Better — Asik Game" },
      { property: "og:description", content: "Provably-fair Video Poker (9/6 full pay) — hold, draw এবং ২৫০× পর্যন্ত instant win।" },
    ],
  }),
  component: VideoPoker,
});

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];

type Phase = "idle" | "dealt" | "drawing" | "done";

function suitColor(s: number) {
  return s === 1 || s === 2 ? "#c8102e" : "#0a0a0a";
}

function Card({
  card,
  held,
  hidden,
  onClick,
  disabled,
  delay,
}: {
  card: number | null;
  held: boolean;
  hidden?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  delay?: number;
}) {
  if (card === null || hidden) {
    return (
      <div className="relative h-40 w-28 shrink-0 rounded-xl border-2 border-white/10 bg-gradient-to-br from-[#101820] to-[#0a1116] shadow-[0_6px_18px_rgba(0,0,0,0.6)]" />
    );
  }
  const suit = Math.floor(card / 13);
  const rank = card % 13;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ animationDelay: `${delay ?? 0}ms` }}
      className={`group relative h-40 w-28 shrink-0 rounded-xl border-2 bg-gradient-to-br from-white via-[#f4f4f4] to-[#dcdcdc] shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-all animate-fade-in ${
        held
          ? "border-[#ffd166] -translate-y-3 shadow-[0_0_25px_rgba(255,209,102,0.55)]"
          : "border-black/40 hover:-translate-y-1"
      } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div className="absolute left-2 top-1.5 text-left leading-none" style={{ color: suitColor(suit) }}>
        <div className="text-lg font-black">{RANKS[rank]}</div>
        <div className="text-lg font-black">{SUITS[suit]}</div>
      </div>
      <div className="absolute right-2 bottom-1.5 rotate-180 text-left leading-none" style={{ color: suitColor(suit) }}>
        <div className="text-lg font-black">{RANKS[rank]}</div>
        <div className="text-lg font-black">{SUITS[suit]}</div>
      </div>
      <div className="absolute inset-0 grid place-items-center text-5xl font-black" style={{ color: suitColor(suit) }}>
        {SUITS[suit]}
      </div>
      {held && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-[#ffd166] bg-[#ffd166] px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black shadow-[0_0_12px_rgba(255,209,102,0.7)]">
          <span className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Hold</span>
        </div>
      )}
    </button>
  );
}

const PAY_TABLE: { rank: VPRank; label: string; pay: number }[] = [
  { rank: "ROYAL_FLUSH", label: "Royal Flush", pay: VP_PAYOUTS.ROYAL_FLUSH },
  { rank: "STRAIGHT_FLUSH", label: "Straight Flush", pay: VP_PAYOUTS.STRAIGHT_FLUSH },
  { rank: "FOUR_KIND", label: "Four of a Kind", pay: VP_PAYOUTS.FOUR_KIND },
  { rank: "FULL_HOUSE", label: "Full House", pay: VP_PAYOUTS.FULL_HOUSE },
  { rank: "FLUSH", label: "Flush", pay: VP_PAYOUTS.FLUSH },
  { rank: "STRAIGHT", label: "Straight", pay: VP_PAYOUTS.STRAIGHT },
  { rank: "THREE_KIND", label: "Three of a Kind", pay: VP_PAYOUTS.THREE_KIND },
  { rank: "TWO_PAIR", label: "Two Pair", pay: VP_PAYOUTS.TWO_PAIR },
  { rank: "JACKS_BETTER", label: "Jacks or Better", pay: VP_PAYOUTS.JACKS_BETTER },
];

function VideoPoker() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("video-poker");
  const { data: cfg } = useGameConfig("video-poker");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("video-poker");

  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<Phase>("idle");
  const [deck, setDeck] = useState<number[]>([]);
  const [hand, setHand] = useState<(number | null)[]>([null, null, null, null, null]);
  const [held, setHeld] = useState<boolean[]>([false, false, false, false, false]);
  const [rankResult, setRankResult] = useState<VPRank | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const deal = useCallback(async () => {
    if (phase === "drawing") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }

    setMsg("");
    setRankResult(null);
    setHeld([false, false, false, false, false]);
    setHand([null, null, null, null, null]);
    setPhase("drawing");

    const d = await fairVideoPokerDeck(pf.serverSeed, pf.clientSeed, pf.nonce);
    setDeck(d);
    const initial = d.slice(0, 5);
    // Reveal cards one by one for polish.
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 90));
      setHand((prev) => {
        const next = [...prev];
        next[i] = initial[i];
        return next;
      });
      try { sfxPeg(0.3); } catch { /* noop */ }
    }
    setPhase("dealt");
  }, [phase, pf, placeBet, bet]);

  const toggleHold = (i: number) => {
    if (phase !== "dealt") return;
    setHeld((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const draw = useCallback(async () => {
    if (phase !== "dealt") return;
    setPhase("drawing");

    // Replacement pool = deck[5..9] in order, consumed for discarded slots
    // in ascending slot order.
    let cursor = 5;
    const finalHand = [...hand] as number[];
    for (let i = 0; i < 5; i++) {
      if (!held[i]) {
        await new Promise((r) => setTimeout(r, 130));
        finalHand[i] = deck[cursor++];
        setHand((prev) => {
          const next = [...prev];
          next[i] = finalHand[i];
          return next;
        });
        try { sfxPeg(0.35); } catch { /* noop */ }
      }
    }

    await new Promise((r) => setTimeout(r, 250));
    const rank = evaluateVideoPokerHand(finalHand);
    const pay = VP_PAYOUTS[rank];
    setRankResult(rank);

    let credited = 0;
    let pnl: number;
    let winMult = 0;
    if (pay > 0) {
      credited = Math.floor(bet * pay * (1 - edge));
      credit(credited);
      pnl = credited - bet;
      winMult = credited / bet;
      setMsg(`🎉 ${VP_LABEL[rank]} · ${pay}× · ${pnl >= 0 ? "+" : ""}${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({
        count: rank === "ROYAL_FLUSH" ? 220 : pay >= 25 ? 140 : 70,
        kind: "confetti",
        speed: 7,
      });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      setMsg(`💥 ${VP_LABEL[rank]} · হার · ${pnl}`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 22, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`vp rank=${rank} pay=${pay} hand=[${finalHand.join(",")}]`);
    recordMyBet({ game: "video-poker", bet, multiplier: winMult, payout: credited });
    pushMultiplierHistory("video-poker", winMult);
    setPhase("done");
  }, [phase, hand, held, deck, bet, edge, pf, credit, record]);

  const resetRound = () => {
    setHand([null, null, null, null, null]);
    setHeld([false, false, false, false, false]);
    setRankResult(null);
    setMsg("");
    setPhase("idle");
  };

  const busy = phase === "drawing";
  const heldCount = held.filter(Boolean).length;

  // Live preview of current hand's ranking (only when dealt, before draw).
  const previewRank = useMemo<VPRank | null>(() => {
    if (phase !== "dealt") return null;
    const cards = hand.filter((c): c is number => c !== null);
    if (cards.length !== 5) return null;
    return evaluateVideoPokerHand(cards);
  }, [phase, hand]);

  const potential = rankResult ? Math.floor(bet * VP_PAYOUTS[rankResult]) : 0;

  return (
    <GameShell title="Video Poker · Jacks or Better" emoji="🃏" gameKey="video-poker">
      <GameFrame>
        <div
          className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0b1f18] via-[#050d0a] to-[#020404] p-4 min-h-[440px] transition-shadow duration-500 ${
            rankResult && VP_PAYOUTS[rankResult] > 0
              ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]"
              : rankResult
                ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]"
                : "border-[#1a3a2a]"
          }`}
        >
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.10),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          <div className="relative z-10 mb-3 flex items-center justify-between rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70">
            <span>
              {phase === "idle" && "Place your bet & deal"}
              {phase === "drawing" && "Dealing…"}
              {phase === "dealt" && `Choose cards to Hold · ${heldCount}/5`}
              {phase === "done" && "Round complete"}
            </span>
            <span className="text-[#ffd166]">Royal Flush · 800×</span>
          </div>

          {/* Pay table */}
          <div className="relative z-10 mb-3 grid grid-cols-3 gap-1 text-[10px] sm:grid-cols-9">
            {PAY_TABLE.map((row) => {
              const active = previewRank === row.rank || rankResult === row.rank;
              return (
                <div
                  key={row.rank}
                  className={`rounded-md border px-1.5 py-1 text-center transition-all ${
                    active
                      ? "border-[#ffd166] bg-[#ffd166]/15 text-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,0.55)]"
                      : "border-white/10 bg-black/30 text-white/60"
                  }`}
                >
                  <div className="truncate font-black">{row.label}</div>
                  <div className="tabular-nums">{row.pay}×</div>
                </div>
              );
            })}
          </div>

          {/* Hand */}
          <div className="relative z-10 flex flex-1 items-center justify-center">
            <div className="flex gap-3">
              {hand.map((c, i) => (
                <Card
                  key={i}
                  card={c}
                  held={held[i]}
                  onClick={() => toggleHold(i)}
                  disabled={phase !== "dealt"}
                  delay={i * 40}
                />
              ))}
            </div>
          </div>

          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              rankResult && VP_PAYOUTS[rankResult] > 0 ? "text-[#00ff88]" : rankResult ? "text-[#ff4d4d]" : "text-[#ffd166]"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">
              {rankResult ? "পেআউট" : "সর্বোচ্চ সম্ভাব্য জয় (Royal)"}
            </div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {(rankResult ? potential : bet * 800).toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">
                @ {rankResult ? VP_PAYOUTS[rankResult] : 800}×
              </span>
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={phase === "dealt" || busy} />

          {phase === "idle" && (
            <PrimaryButton onClick={deal} disabled={busy}>
              ডিল · {bet}
            </PrimaryButton>
          )}
          {phase === "drawing" && (
            <PrimaryButton onClick={() => {}} disabled>
              অপেক্ষা করুন…
            </PrimaryButton>
          )}
          {phase === "dealt" && (
            <PrimaryButton onClick={draw}>
              ড্র করুন ({5 - heldCount} card{5 - heldCount === 1 ? "" : "s"})
            </PrimaryButton>
          )}
          {phase === "done" && (
            <PrimaryButton onClick={resetRound}>আবার খেলুন</PrimaryButton>
          )}

          <div className="rounded-lg border border-white/5 bg-black/20 p-2 text-[10px] leading-relaxed text-white/50">
            কার্ডে ক্লিক করে <span className="text-[#ffd166] font-black">Hold</span> করুন। বাকি কার্ড ড্র বাটনে বদলাবে। Jacks বা তার বেশি জোড়া থেকে জয় শুরু।
          </div>

          <ProvablyFairPanel pf={pf} gameKey="video-poker" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="video-poker" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
