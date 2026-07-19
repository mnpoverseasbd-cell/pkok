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
import { fairDragonTiger } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/dragon-tiger")({
  head: () => ({
    meta: [
      { title: "Dragon Tiger — Asik Game" },
      { name: "description", content: "দুই কার্ডের লড়াই — Dragon না Tiger, কার কার্ড বড়? Tie হলে 8× জিতুন।" },
      { property: "og:title", content: "Dragon Tiger — Asik Game" },
      { property: "og:description", content: "Fast-paced ২ কার্ডের কমপ্যারিজন গেম — 1.95× মেইন, 8× Tie payout।" },
    ],
  }),
  component: DragonTiger,
});

type Pick = "D" | "T" | "TIE";
type Phase = "idle" | "dealing" | "done";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
const rankOf = (c: number) => RANKS[c % 13];
const suitOf = (c: number) => SUITS[Math.floor(c / 13)];
const isRed = (c: number) => {
  const s = Math.floor(c / 13);
  return s === 1 || s === 2;
};

const PAYOUT_MAIN = 1.95; // Dragon / Tiger
const PAYOUT_TIE = 8; // Tie

function DragonTiger() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("dragon-tiger");
  const { data: cfg } = useGameConfig("dragon-tiger");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("dragon-tiger");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Pick>("D");
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragon, setDragon] = useState<number | null>(null);
  const [tiger, setTiger] = useState<number | null>(null);
  const [winner, setWinner] = useState<Pick | null>(null);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const clearBoard = () => {
    setDragon(null); setTiger(null); setWinner(null); setMsg("");
  };

  const runRound = useCallback(async () => {
    if (phase === "dealing") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    clearBoard();
    setPhase("dealing");

    const result = await fairDragonTiger(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Reveal Dragon first
    setDragon(result.dragon);
    try { sfxPeg(0.4); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 550));
    setTiger(result.tiger);
    try { sfxPeg(0.4); } catch { /* noop */ }
    await new Promise((r) => setTimeout(r, 500));

    setWinner(result.winner);
    const mult = result.winner === "TIE" ? PAYOUT_TIE : PAYOUT_MAIN;
    let pnl: number;
    let won = 0;
    let winMult = 0;

    if (result.winner === pick) {
      won = Math.floor(bet * mult * (1 - edge));
      credit(won);
      pnl = won - bet;
      winMult = won / bet;
      const label = pick === "TIE" ? "TIE" : pick === "D" ? "Dragon" : "Tiger";
      setMsg(`🎉 জয় · ${label} · +${pnl}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({ count: result.winner === "TIE" ? 110 : 70, kind: "confetti", speed: 8 });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      const wLabel = result.winner === "TIE" ? "TIE" : result.winner === "D" ? "Dragon" : "Tiger";
      setMsg(`💥 হার · ${wLabel} জিতেছে`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`dt D=${rankOf(result.dragon)}${suitOf(result.dragon)} T=${rankOf(result.tiger)}${suitOf(result.tiger)} winner=${result.winner}`);
    recordMyBet({ game: "dragon-tiger", bet, multiplier: winMult, payout: won });
    pushMultiplierHistory("dragon-tiger", winMult);
    setPhase("done");
  }, [phase, pf, placeBet, credit, edge, bet, pick, record]);

  const reset = () => { clearBoard(); setPhase("idle"); };
  const busy = phase === "dealing";

  const won = winner && winner === pick;
  const lost = winner && winner !== pick;
  const glow =
    won ? "shadow-[0_0_60px_-10px_rgba(0,255,136,0.55)] border-[#143a1f]" :
      lost ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.5)] border-[#3a1414]" :
        "border-[#2a1a3a]";

  const potential =
    pick === "TIE"
      ? Math.floor(bet * PAYOUT_TIE)
      : Math.floor(bet * PAYOUT_MAIN);

  return (
    <GameShell title="Dragon Tiger" emoji="🐉" gameKey="dragon-tiger">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#1a0b1f] via-[#0a0612] to-[#020208] p-4 min-h-[420px] transition-shadow duration-500 ${glow}`}>
          {/* Table felt */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(200,80,255,0.10),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          {/* VS layout */}
          <div className="relative z-10 grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-4">
            <Slot
              title="DRAGON"
              subtitle="ড্রাগন"
              color="#ff4d6d"
              card={dragon}
              picked={pick === "D"}
              won={winner === "D"}
              lost={winner && winner !== "D"}
            />
            <div className="flex flex-col items-center gap-1">
              <div className={`grid h-12 w-12 place-items-center rounded-full border-2 text-sm font-black transition-all ${
                winner === "TIE"
                  ? "border-[#ffd166] bg-[#ffd166]/20 text-[#ffd166] shadow-[0_0_20px_rgba(255,209,102,0.6)]"
                  : "border-white/20 bg-black/40 text-white/60"
              }`}>VS</div>
              {winner === "TIE" && (
                <div className="text-[10px] font-black text-[#ffd166]">TIE!</div>
              )}
            </div>
            <Slot
              title="TIGER"
              subtitle="টাইগার"
              color="#ffb347"
              card={tiger}
              picked={pick === "T"}
              won={winner === "T"}
              lost={winner && winner !== "T"}
              align="right"
            />
          </div>

          {/* Status */}
          {msg && (
            <div className={`relative z-10 mt-3 text-center text-sm font-black animate-fade-in ${
              won ? "text-[#00ff88]" : lost ? "text-[#ff4d4d]" : "text-[#ffd166]"
            }`}>{msg}</div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          {/* Potential payout */}
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">সম্ভাব্য জয়</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {potential.toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">@ {pick === "TIE" ? PAYOUT_TIE : PAYOUT_MAIN}×</span>
            </div>
          </div>

          {/* Pick */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#c084fc]">কোন দিকে বাজি?</label>
            <div className="grid grid-cols-3 gap-2">
              <PickBtn active={pick === "D"} disabled={busy} onClick={() => setPick("D")}
                label="DRAGON" sub="ড্রাগন" tone="#ff4d6d" mult={PAYOUT_MAIN} />
              <PickBtn active={pick === "TIE"} disabled={busy} onClick={() => setPick("TIE")}
                label="TIE" sub="টাই" tone="#ffd166" mult={PAYOUT_TIE} />
              <PickBtn active={pick === "T"} disabled={busy} onClick={() => setPick("T")}
                label="TIGER" sub="টাইগার" tone="#ffb347" mult={PAYOUT_MAIN} />
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

          <ProvablyFairPanel pf={pf} gameKey="dragon-tiger" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="dragon-tiger" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

function PickBtn({
  active, disabled, onClick, label, sub, tone, mult,
}: {
  active: boolean; disabled: boolean; onClick: () => void;
  label: string; sub: string; tone: string; mult: number;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={active ? { borderColor: tone, boxShadow: `0 0 15px ${tone}66`, background: `${tone}18`, color: tone } : undefined}
      className={`rounded-lg border-2 px-3 py-3 font-black transition-all active:scale-95 ${
        active ? "" : "border-[#2a1a3a] bg-[#160c22] text-white/70 hover:border-[#4a2a5a]"
      }`}
    >
      <div className="text-sm leading-tight">{label}</div>
      <div className="text-[10px] font-bold opacity-70 leading-tight">{sub}</div>
      <div className="mt-1 text-[10px] tabular-nums opacity-80">{mult}×</div>
    </button>
  );
}

function Slot({
  title, subtitle, color, card, picked, won, lost, align,
}: {
  title: string; subtitle: string; color: string;
  card: number | null; picked: boolean;
  won: boolean | null | ""; lost: boolean | null | "";
  align?: "left" | "right";
}) {
  const tone =
    won ? "border-[#00ff88]/70 bg-[#00ff88]/8 shadow-[0_0_25px_-8px_rgba(0,255,136,0.6)]" :
      lost ? "border-[#ff4d4d]/40 bg-[#ff4d4d]/5 opacity-70" :
        picked ? "border-[#ffd166]/60 bg-[#ffd166]/5" :
          "border-white/10 bg-black/30";
  return (
    <div className={`flex flex-col items-center rounded-xl border p-4 transition-all ${tone} ${align === "right" ? "" : ""}`}>
      <div className="mb-2 text-center">
        <div className="text-xs font-black tracking-widest" style={{ color }}>{title}</div>
        <div className="text-[10px] font-bold text-white/50">{subtitle}</div>
      </div>
      <div className="min-h-[140px] grid place-items-center">
        {card !== null ? <BigCard card={card} /> : <BigCardBack />}
      </div>
      {card !== null && (
        <div className="mt-2 text-lg font-black tabular-nums text-white/90">
          Rank {(card % 13) + 1}
        </div>
      )}
    </div>
  );
}

function BigCard({ card }: { card: number }) {
  const red = isRed(card);
  return (
    <div className="relative h-32 w-24 rounded-lg border border-black/40 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.6)] animate-fade-in">
      <div className={`absolute left-1.5 top-1 text-sm font-black leading-none ${red ? "text-red-600" : "text-black"}`}>
        {rankOf(card)}
      </div>
      <div className={`absolute right-1.5 bottom-1 rotate-180 text-sm font-black leading-none ${red ? "text-red-600" : "text-black"}`}>
        {rankOf(card)}
      </div>
      <div className={`grid h-full w-full place-items-center text-5xl font-black ${red ? "text-red-600" : "text-black"}`}>
        {suitOf(card)}
      </div>
    </div>
  );
}

function BigCardBack() {
  return (
    <div className="h-32 w-24 rounded-lg border border-white/10 bg-gradient-to-br from-[#2a1a3a] via-[#150a22] to-[#050208] shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
      <div className="grid h-full w-full place-items-center text-4xl">🎴</div>
    </div>
  );
}
