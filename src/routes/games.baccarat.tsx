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
import { fairBaccarat } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";

export const Route = createFileRoute("/games/baccarat")({
  head: () => ({
    meta: [
      { title: "Baccarat — Asik Game" },
      { name: "description", content: "ব্যাকারা — Player vs Banker ক্লাসিক ক্যাসিনো কার্ড গেম। ৯ এর কাছাকাছি হ্যান্ড জেতে।" },
      { property: "og:title", content: "Baccarat — Asik Game" },
      { property: "og:description", content: "Punto Banco style baccarat — Player 2×, Banker 1.95×, Tie 9×।" },
    ],
  }),
  component: Baccarat;
});

type Pick = "P" | "B" | "TIE";
type Phase = "idle" | "dealing" | "done";

const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUITS = ["♠", "♥", "♦", "♣"];
const rankOf = (c: number) => RANKS[c % 13];
const suitOf = (c: number) => SUITS[Math.floor(c / 13)];
const isRed = (c: number) => {
  const s = Math.floor(c / 13);
  return s === 1 || s === 2;
};

const PAYOUT_PLAYER = 2;
const PAYOUT_BANKER = 1.95; // 5% commission
const PAYOUT_TIE = 9;

function Baccarat() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("baccarat");
  const { data: cfg } = useGameConfig("baccarat");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("baccarat");

  const [bet, setBet] = useState(50);
  const [pick, setPick] = useState<Pick>("P");
  const [phase, setPhase] = useState<Phase>("idle");
  const [player, setPlayer] = useState<number[]>([]);
  const [banker, setBanker] = useState<number[]>([]);
  const [playerTotal, setPlayerTotal] = useState<number | null>(null);
  const [bankerTotal, setBankerTotal] = useState<number | null>(null);
  const [winner, setWinner] = useState<Pick | null>(null);
  const [natural, setNatural] = useState(false);
  const [msg, setMsg] = useState("");
  const fxRef = useRef<ParticleBurstHandle>(null);

  const clearBoard = () => {
    setPlayer([]); setBanker([]);
    setPlayerTotal(null); setBankerTotal(null);
    setWinner(null); setNatural(false); setMsg("");
  };

  const runRound = useCallback(async () => {
    if (phase === "dealing") return;
    if (!pf.ready) { setMsg("Provably-fair seeds তৈরি হচ্ছে…"); return; }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    clearBoard();
    setPhase("dealing");

    const result = await fairBaccarat(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Reveal initial 2 cards each, alternating P/B
    for (let i = 0; i < 2; i++) {
      setPlayer((p) => [...p, result.player[i]]);
      try { sfxPeg(0.35); } catch { /* noop */ }
      await new Promise((r) => setTimeout(r, 280));
      setBanker((b) => [...b, result.banker[i]]);
      try { sfxPeg(0.35); } catch { /* noop */ }
      await new Promise((r) => setTimeout(r, 280));
    }

    // Any third cards? Reveal them one at a time
    if (result.player.length > 2) {
      await new Promise((r) => setTimeout(r, 250));
      setPlayer((p) => [...p, result.player[2]]);
      try { sfxPeg(0.4); } catch { /* noop */ }
      await new Promise((r) => setTimeout(r, 350));
    }
    if (result.banker.length > 2) {
      await new Promise((r) => setTimeout(r, 250));
      setBanker((b) => [...b, result.banker[2]]);
      try { sfxPeg(0.4); } catch { /* noop */ }
      await new Promise((r) => setTimeout(r, 350));
    }

    setPlayerTotal(result.playerTotal);
    setBankerTotal(result.bankerTotal);
    setNatural(result.isNatural);
    await new Promise((r) => setTimeout(r, 350));

    setWinner(result.winner);
    const mult =
      result.winner === "TIE" ? PAYOUT_TIE :
      result.winner === "P" ? PAYOUT_PLAYER : PAYOUT_BANKER;
    let pnl: number;
    let won = 0;
    let winMult = 0;

    if (result.winner === pick) {
      won = Math.floor(bet * mult * (1 - edge));
      credit(won);
      pnl = won - bet;
      winMult = won / bet;
      const label = pick === "TIE" ? "TIE" : pick === "P" ? "Player" : "Banker";
      setMsg(`🎉 জয় · ${label} · +${pnl}${result.isNatural ? " · Natural!" : ""}`);
      record({ pnl, multiplier: winMult });
      fxRef.current?.burst({ count: result.winner === "TIE" ? 130 : 80, kind: "confetti", speed: 8 });
      try { sfxWin(winMult); sfxCashout(); } catch { /* noop */ }
    } else {
      pnl = -bet;
      const wLabel = result.winner === "TIE" ? "TIE" : result.winner === "P" ? "Player" : "Banker";
      setMsg(`💥 হার · ${wLabel} জিতেছে`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 30, kind: "smoke", color: "#ff4d4d", speed: 5 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`bac P=[${result.player.map((c) => `${rankOf(c)}${suitOf(c)}`).join(",")}]=${result.playerTotal} B=[${result.banker.map((c) => `${rankOf(c)}${suitOf(c)}`).join(",")}]=${result.bankerTotal} winner=${result.winner}`);
    recordMyBet({ game: "baccarat", bet, multiplier: winMult, payout: won });
    pushMultiplierHistory("baccarat", winMult);
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
    pick === "TIE" ? Math.floor(bet * PAYOUT_TIE) :
    pick === "P"   ? Math.floor(bet * PAYOUT_PLAYER) :
                     Math.floor(bet * PAYOUT_BANKER);
  const pickMult = pick === "TIE" ? PAYOUT_TIE : pick === "P" ? PAYOUT_PLAYER : PAYOUT_BANKER;

  return (
    <GameShell title="Baccarat" emoji="🎴" gameKey="baccarat">
      <GameFrame>
        <div className={`relative flex flex-1 flex-col overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0d1f2a] via-[#061219] to-[#020609] p-4 min-h-[460px] transition-shadow duration-500 ${glow}`}>
          {/* Casino felt (blue baccarat table) */}
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,140,220,0.16),transparent_65%)]" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent_0_18px,rgba(255,255,255,0.015)_18px_19px)]" />

          <div className="relative z-10 flex flex-1 flex-col justify-between gap-4">
            <Seat
              label="BANKER"
              subtitle="ব্যাংকার"
              tone="#ffb347"
              cards={banker}
              total={bankerTotal}
              picked={pick === "B"}
              won={winner === "B"}
              lost={winner ? winner !== "B" : false}
            />

            <div className="grid place-items-center">
              <div className={`grid h-11 w-28 place-items-center rounded-full border-2 text-xs font-black transition-all ${
                winner === "TIE"
                  ? "border-[#ffd166] bg-[#ffd166]/20 text-[#ffd166] shadow-[0_0_20px_rgba(255,209,102,0.6)]"
                  : "border-white/20 bg-black/40 text-white/60"
              }`}>
                {winner === "TIE" ? "TIE!" : natural ? "NATURAL" : "VS"}
              </div>
            </div>

            <Seat
              label="PLAYER"
              subtitle="প্লেয়ার (আপনি)"
              tone="#00ff88"
              cards={player}
              total={playerTotal}
              picked={pick === "P"}
              won={winner === "P"}
              lost={winner ? winner !== "P" : false}
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
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">সম্ভাব্য জয়</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {potential.toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">@ {pickMult}×</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#c084fc]">কোন দিকে বাজি?</label>
            <div className="grid grid-cols-3 gap-2">
              <PickBtn active={pick === "P"} disabled={busy} onClick={() => setPick("P")}
                label="PLAYER" sub="প্লেয়ার" tone="#00ff88" mult={PAYOUT_PLAYER} />
              <PickBtn active={pick === "TIE"} disabled={busy} onClick={() => setPick("TIE")}
                label="TIE" sub="টাই" tone="#ffd166" mult={PAYOUT_TIE} />
              <PickBtn active={pick === "B"} disabled={busy} onClick={() => setPick("B")}
                label="BANKER" sub="ব্যাংকার" tone="#ffb347" mult={PAYOUT_BANKER} />
            </div>
          </div>

          <BetControls bet={bet} setBet={setBet} disabled={busy} />

          {phase === "done" ? (
            <PrimaryButton onClick={reset}>আবার খেলুন</PrimaryButton>
          ) : (
            <PrimaryButton onClick={runRound} disabled={busy}>
              {busy ? "কার্ড ডিল হচ্ছে..." : `ডিল করুন · ${bet}`}
            </PrimaryButton>
          )}

          {/* Rules */}
          <div className="rounded-lg border border-white/5 bg-black/30 p-3 text-[11px]">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/50">নিয়ম (Punto Banco)</div>
            <ul className="space-y-0.5 text-white/70">
              <li>• কার্ড মান: A=1, 2-9=face, 10/J/Q/K=0</li>
              <li>• হ্যান্ড টোটাল = কার্ড যোগফল mod 10</li>
              <li>• ৯-এর কাছাকাছি হ্যান্ড জেতে</li>
              <li>• Natural (8/9) = অটো-স্ট্যান্ড</li>
              <li>• Player 2× · Banker 1.95× · Tie 9×</li>
            </ul>
          </div>

          <ProvablyFairPanel pf={pf} gameKey="baccarat" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="baccarat" />
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

function Seat({
  label, subtitle, tone, cards, total, picked, won, lost,
}: {
  label: string; subtitle: string; tone: string;
  cards: number[]; total: number | null;
  picked: boolean; won: boolean; lost: boolean;
}) {
  const style =
    won ? "border-[#00ff88]/70 bg-[#00ff88]/8 shadow-[0_0_25px_-8px_rgba(0,255,136,0.6)]" :
      lost ? "border-[#ff4d4d]/40 bg-[#ff4d4d]/5 opacity-70" :
        picked ? "border-[#ffd166]/60 bg-[#ffd166]/5" :
          "border-white/10 bg-black/30";
  return (
    <div className={`flex items-center gap-4 rounded-xl border p-3 transition-all ${style}`}>
      <div className="w-24 shrink-0">
        <div className="text-xs font-black tracking-widest" style={{ color: tone }}>{label}</div>
        <div className="text-[10px] font-bold text-white/50">{subtitle}</div>
        {total !== null && (
          <div className="mt-1 inline-block rounded bg-black/60 px-2 py-0.5 text-sm font-black tabular-nums" style={{ color: tone }}>
            {total}
          </div>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            {cards[i] !== undefined ? <BigCard card={cards[i]} /> : <BigCardBack dim={i === 2} />}
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

function BigCardBack({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`h-24 w-16 rounded-lg border border-white/10 bg-gradient-to-br from-[#1a2a3a] via-[#0a141f] to-[#020609] shadow-[0_6px_16px_rgba(0,0,0,0.6)] ${dim ? "opacity-40 border-dashed" : ""}`}>
      <div className="grid h-full w-full place-items-center text-2xl">{dim ? "" : "🎴"}</div>
    </div>
  );
}
