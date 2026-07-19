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
import { fairBlackjackDeck, bjTotal } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/blackjack")({
  head: () => ({
    meta: [
      { title: "Blackjack — Asik Game" },
      { name: "description", content: "ব্ল্যাকজ্যাক ২১ — Hit, Stand, Double. ডিলারকে হারান, 21-এ পৌঁছান।" },
      { property: "og:title", content: "Blackjack — Asik Game" },
      { property: "og:description", content: "Classic 21 blackjack. Blackjack pays 3:2, provably fair shuffle." },
    ],
  }),
  component: Blackjack,
});

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
const rankOf = (c: number) => RANKS[c % 13];
const suitOf = (c: number) => SUITS[Math.floor(c / 13)];
const isRed = (c: number) => {
  const s = Math.floor(c / 13);
  return s === 1 || s === 2;
};

type Phase = "idle" | "player" | "dealer" | "done";

function Blackjack() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("blackjack");
  const { data: cfg } = useGameConfig("blackjack");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("blackjack");

  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<Phase>("idle");
  const [deck, setDeck] = useState<number[]>([]);
  const [cursor, setCursor] = useState(4);
  const [player, setPlayer] = useState<number[]>([]);
  const [dealer, setDealer] = useState<number[]>([]);
  const [dealerHidden, setDealerHidden] = useState(true);
  const [doubled, setDoubled] = useState(false);
  const [msg, setMsg] = useState("");
  const [outcome, setOutcome] = useState<"W" | "L" | "P" | "BJ" | null>(null);
  const fxRef = useRef<ParticleBurstHandle>(null);

  const startRound = useCallback(async () => {
    if (phase !== "idle" && phase !== "done") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }

    const d = await fairBlackjackDeck(pf.serverSeed, pf.clientSeed, pf.nonce);
    setDeck(d);
    setCursor(4);
    setPlayer([]); setDealer([]);
    setDealerHidden(true); setDoubled(false);
    setMsg(""); setOutcome(null);

    // Deal alternating
    setPhase("player");
    setPlayer([d[0]]); try { sfxPeg(0.35); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 220));
    setDealer([d[1]]); try { sfxPeg(0.35); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 220));
    setPlayer([d[0], d[2]]); try { sfxPeg(0.35); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 220));
    setDealer([d[1], d[3]]); try { sfxPeg(0.35); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 300));

    // Check natural blackjack
    const p2 = [d[0], d[2]];
    const dl2 = [d[1], d[3]];
    const pt = bjTotal(p2).total;
    const dt = bjTotal(dl2).total;
    if (pt === 21 || dt === 21) {
      setDealerHidden(false);
      await finish(p2, dl2, false);
    }
  }, [phase, pf, placeBet, bet]);

  const finish = useCallback(async (pHand: number[], dHand: number[], wasDouble: boolean) => {
    const pt = bjTotal(pHand).total;
    const dt = bjTotal(dHand).total;
    const pBJ = pHand.length === 2 && pt === 21;
    const dBJ = dHand.length === 2 && dt === 21;
    const stake = wasDouble ? bet * 2 : bet;

    let mult = 0; // multiplier on stake for RETURN (0 = lose stake)
    let kind: "W" | "L" | "P" | "BJ" = "L";
    if (pt > 21) { kind = "L"; mult = 0; }
    else if (pBJ && !dBJ) { kind = "BJ"; mult = 2.5; }
    else if (dBJ && !pBJ) { kind = "L"; mult = 0; }
    else if (pBJ && dBJ) { kind = "P"; mult = 1; }
    else if (dt > 21 || pt > dt) { kind = "W"; mult = 2; }
    else if (pt === dt) { kind = "P"; mult = 1; }
    else { kind = "L"; mult = 0; }

    const won = Math.floor(stake * mult * (mult > 0 ? (1 - edge) : 1));
    if (won > 0) credit(won);
    const pnl = won - stake;
    const winMult = won / bet;

    setOutcome(kind);
    if (kind === "BJ") {
      setMsg(`🎉 BLACKJACK! · +${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({ count: 160, kind: "confetti", speed: 9 });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else if (kind === "W") {
      setMsg(`🎉 জয় · +${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({ count: 90, kind: "confetti", speed: 7 });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else if (kind === "P") {
      setMsg(`🤝 পুশ · বাজি ফেরত`);
      record({ pnl: 0, multiplier: 1 });
    } else {
      setMsg(pt > 21 ? `💥 বাস্ট! · ${pt}` : `💥 হার · Dealer ${dt}`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`bj P=[${pHand.map((c) => `${rankOf(c)}${suitOf(c)}`).join(",")}]=${pt} D=[${dHand.map((c) => `${rankOf(c)}${suitOf(c)}`).join(",")}]=${dt} r=${kind}${wasDouble ? " x2" : ""}`);
    recordMyBet({ game: "blackjack", bet: stake, multiplier: winMult, payout: won });
    pushMultiplierHistory("blackjack", winMult);
    setPhase("done");
  }, [bet, credit, edge, pf, record]);

  const dealerPlay = useCallback(async (pHand: number[], wasDouble: boolean) => {
    setPhase("dealer");
    setDealerHidden(false);
    await new Promise((r) => setTimeout(r, 400));
    let dHand = [...dealer];
    let idx = cursor;
    // Dealer stands on all 17s (including soft)
    while (bjTotal(dHand).total < 17) {
      dHand = [...dHand, deck[idx++]];
      setDealer(dHand);
      try { sfxPeg(0.35); } catch { /* noop */ }
      await new Promise((r) => setTimeout(r, 400));
    }
    setCursor(idx);
    await finish(pHand, dHand, wasDouble);
  }, [dealer, cursor, deck, finish]);

  const hit = useCallback(async () => {
    if (phase !== "player") return;
    const next = [...player, deck[cursor]];
    setPlayer(next);
    setCursor(cursor + 1);
    try { sfxPeg(0.4); } catch { /* noop */ }
    const t = bjTotal(next).total;
    if (t >= 21) {
      await new Promise((r) => setTimeout(r, 300));
      if (t > 21) { setDealerHidden(false); await finish(next, dealer, false); }
      else await dealerPlay(next, false);
    }
  }, [phase, player, deck, cursor, dealer, dealerPlay, finish]);

  const stand = useCallback(async () => {
    if (phase !== "player") return;
    await dealerPlay(player, false);
  }, [phase, player, dealerPlay]);

  const double = useCallback(async () => {
    if (phase !== "player" || player.length !== 2) return;
    if (!placeBet(bet)) { setMsg("Double-এর জন্য ব্যালেন্স নেই"); return; }
    setDoubled(true);
    const next = [...player, deck[cursor]];
    setPlayer(next);
    setCursor(cursor + 1);
    try { sfxPeg(0.5); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 350));
    const t = bjTotal(next).total;
    if (t > 21) { setDealerHidden(false); await finish(next, dealer, true); }
    else await dealerPlay(next, true);
  }, [phase, player, deck, cursor, dealer, placeBet, bet, dealerPlay, finish]);

  const reset = () => {
    setPhase("idle");
    setPlayer([]); setDealer([]); setDeck([]); setCursor(4);
    setDealerHidden(true); setDoubled(false);
    setMsg(""); setOutcome(null);
  };

  const busy = phase === "dealer";
  const canAct = phase === "player";
  const pt = player.length ? bjTotal(player) : null;
  const dtVisible = dealerHidden && dealer.length >= 2
    ? bjTotal([dealer[0]])
    : dealer.length ? bjTotal(dealer) : null;

  const won = outcome === "W" || outcome === "BJ";
  const lost = outcome === "L";
  const glow =
    won ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
      lost ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
        "border-[#2a1a3a]";

  return (
    <GameShell title="Blackjack" emoji="🃏" gameKey="blackjack">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0a2515] via-[#04120a] to-[#020806] p-4 min-h-[500px] transition-shadow duration-500 ${glow}`}>
          {/* Green felt */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,90,0.18),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.02)_18px_19px)]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between gap-4">
            <Seat
              label="DEALER"
              subtitle="ডিলার"
              tone="#ffb347"
              cards={dealer}
              hiddenSecond={dealerHidden}
              total={dtVisible?.total ?? null}
              soft={dtVisible?.soft}
              won={outcome === "L"}
              lost={outcome === "W" || outcome === "BJ"}
            />

            <div className="grid place-items-center">
              <div className={`grid h-11 min-w-[100px] place-items-center rounded-full border-2 px-4 text-xs font-black transition-all ${
                outcome === "BJ" ? "border-[#ffd166] bg-[#ffd166]/25 text-[#ffd166] shadow-[0_0_20px_rgba(255,209,102,0.7)]" :
                outcome === "W" ? "border-[#00ff88] bg-[#00ff88]/20 text-[#00ff88]" :
                outcome === "L" ? "border-[#ff4d4d] bg-[#ff4d4d]/20 text-[#ff4d4d]" :
                outcome === "P" ? "border-white/40 bg-white/10 text-white" :
                "border-white/20 bg-black/40 text-white/60"
              }`}>
                {outcome === "BJ" ? "BLACKJACK!" : outcome === "W" ? "WIN" : outcome === "L" ? "LOSE" : outcome === "P" ? "PUSH" : doubled ? "DOUBLED" : "VS"}
              </div>
            </div>

            <Seat
              label="PLAYER"
              subtitle="আপনি"
              tone="#00ff88"
              cards={player}
              total={pt?.total ?? null}
              soft={pt?.soft}
              won={outcome === "W" || outcome === "BJ"}
              lost={outcome === "L"}
            />
          </div>

          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              won ? "text-[#00ff88]" : lost ? "text-[#ff4d4d]" : "text-[#ffd166]"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">পেআউট</div>
            <div className="mt-0.5 text-xs font-bold text-white/70">
              জয় <span className="text-[#00ff88]">2×</span> · Blackjack <span className="text-[#ffd166]">2.5×</span> · Push <span className="text-white">1×</span>
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={phase !== "idle" && phase !== "done"} />

          {phase === "idle" || phase === "done" ? (
            <PrimaryButton onClick={startRound}>
              {phase === "done" ? "আবার খেলুন" : `ডিল করুন · ${bet}`}
            </PrimaryButton>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <ActionBtn label="HIT" sub="আরেকটি" tone="#00ff88" disabled={!canAct || busy} onClick={hit} />
              <ActionBtn label="STAND" sub="থামুন" tone="#ffd166" disabled={!canAct || busy} onClick={stand} />
              <ActionBtn label="DOUBLE" sub="দ্বিগুণ" tone="#c084fc" disabled={!canAct || busy || player.length !== 2} onClick={double} />
            </div>
          )}

          {/* Rules */}
          <div className="rounded-lg border border-white/5 bg-black/30 p-3 text-[11px]">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">নিয়ম</div>
            <ul className="space-y-0.5 text-white/70">
              <li>• ২১-এর কাছাকাছি হ্যান্ড জেতে, ২১ পার = বাস্ট</li>
              <li>• A = 1 বা 11 (স্বয়ংক্রিয়), J/Q/K = 10</li>
              <li>• Blackjack (২ কার্ডে ২১) → 2.5×</li>
              <li>• ডিলার সব 17-এ থামে (soft সহ)</li>
              <li>• Double: শুধু ২ কার্ডে, বাজি ২ গুণ, ১ কার্ডই পাবেন</li>
            </ul>
          </div>

          <ProvablyFairPanel pf={pf} gameKey="blackjack" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="blackjack" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

function ActionBtn({
  label, sub, tone, disabled, onClick,
}: { label: string; sub: string; tone: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={!disabled ? { borderColor: tone, boxShadow: `0 0 15px ${tone}55`, color: tone } : undefined}
      className={`rounded-lg border-2 px-3 py-3 font-black transition-all active:scale-95 ${
        disabled ? "border-[#2a1a3a] bg-[#160c22] text-white/30" : "bg-[#160c22] hover:brightness-125"
      }`}
    >
      <div className="text-sm leading-tight">{label}</div>
      <div className="text-[10px] font-bold opacity-70 leading-tight">{sub}</div>
    </button>
  );
}

function Seat({
  label, subtitle, tone, cards, total, soft, hiddenSecond, won, lost,
}: {
  label: string; subtitle: string; tone: string;
  cards: number[]; total: number | null; soft?: boolean;
  hiddenSecond?: boolean; won: boolean; lost: boolean;
}) {
  const style =
    won ? "border-[#00ff88]/70 bg-[#00ff88]/8 shadow-[0_0_25px_-8px_rgba(0,255,136,0.6)]" :
      lost ? "border-[#ff4d4d]/40 bg-[#ff4d4d]/5 opacity-70" :
        "border-white/10 bg-black/30";
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-3 transition-all ${style}`}>
      <div className="w-24 shrink-0">
        <div className="text-xs font-black tracking-widest" style={{ color: tone }}>{label}</div>
        <div className="text-[10px] font-bold text-white/50">{subtitle}</div>
        {total !== null && (
          <div className="mt-1 inline-block rounded bg-black/60 px-2 py-0.5 text-sm font-black tabular-nums" style={{ color: tone }}>
            {soft && total <= 21 ? `${total - 10}/${total}` : total}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-wrap items-center justify-center gap-2">
        {cards.map((c, i) => (
          <div key={i}>
            {hiddenSecond && i === 1 ? <BigCardBack /> : <BigCard card={c} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function BigCard({ card }: { card: number }) {
  const red = isRed(card);
  return (
    <div className="relative h-24 w-16 rounded-lg border border-black/40 bg-white shadow-[0_6px_16px_rgba(0,0,0,0.6)] animate-fade-in">
      <div className={`absolute left-1 top-0.5 text-xs font-black leading-none ${red ? "text-red-600" : "text-black"}`}>
        {rankOf(card)}
      </div>
      <div className={`absolute right-1 bottom-0.5 rotate-180 text-xs font-black leading-none ${red ? "text-red-600" : "text-black"}`}>
        {rankOf(card)}
      </div>
      <div className={`grid h-full w-full place-items-center text-3xl font-black ${red ? "text-red-600" : "text-black"}`}>
        {suitOf(card)}
      </div>
    </div>
  );
}

function BigCardBack() {
  return (
    <div className="h-24 w-16 rounded-lg border border-white/10 bg-gradient-to-br from-[#1a2a3a] via-[#0a141f] to-[#020609] shadow-[0_6px_16px_rgba(0,0,0,0.6)]">
      <div className="grid h-full w-full place-items-center text-2xl">🂠</div>
    </div>
  );
}
