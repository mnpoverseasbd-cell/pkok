import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { fairBingo, BINGO_COLS, type BingoResult } from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";
import { recordMyBet } from "@/lib/liveFeed";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/games/bingo")({
  head: () => ({
    meta: [
      { title: "Bingo 75 — Asik Game" },
      { name: "description", content: "৭৫-বল বিঙ্গো · ৫×৫ কার্ড · ৩০ বল ড্র · Full House 100× পেআউট।" },
      { property: "og:title", content: "Bingo 75 — Asik Game" },
      { property: "og:description", content: "Provably-fair 75-ball bingo. Lines, corners, X, and Full House." },
    ],
  }),
  component: BingoGame,
});

const COL_COLORS = ["#ff4d6d", "#ffd166", "#7fdbff", "#a78bfa", "#22e39a"];

function BingoGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("bingo");
  const { data: cfg } = useGameConfig("bingo");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("bingo");

  const [bet, setBet] = useState(100);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<BingoResult | null>(null);
  const [drawnCount, setDrawnCount] = useState(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const fxRef = useRef<ParticleBurstHandle>(null);

  const runRound = useCallback(async () => {
    if (!pf.ready || busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setResult(null); setDrawnCount(0); setCurrent(null);

    const r = await fairBingo(pf.serverSeed, pf.clientSeed, pf.nonce);
    setResult(r);

    // Animate ball draw
    for (let i = 0; i < r.balls.length; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 140));
      setCurrent(r.balls[i]);
      setDrawnCount(i + 1);
      try { sfxPeg(0.35); } catch { /* noop */ }
    }

    const mult = r.multiplier * (1 - edge);
    let pnl: number;
    let won = 0;
    if (mult > 0) {
      won = Math.floor(bet * mult);
      credit(won);
      pnl = won - bet;
      setMsg(`🎉 জয় +${pnl} · ${mult.toFixed(2)}× · ${r.patterns.join(", ")}`);
      record({ pnl, multiplier: mult });
      fxRef.current?.burst({ count: 80, kind: "confetti", speed: 8 });
      try { mult >= 10 ? sfxCashout() : sfxWin(mult); } catch { /* noop */ }
    } else {
      pnl = -bet;
      setMsg(`💥 কোনো প্যাটার্ন মেলেনি · ${pnl}`);
      record({ pnl, multiplier: 0 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`bingo patterns=${r.patterns.join("|") || "none"} mult=${mult.toFixed(2)}×`);
    recordMyBet({ game: "bingo", bet, multiplier: mult, payout: won });
    pushMultiplierHistory("bingo", mult);
    setBusy(false);
  }, [pf, busy, placeBet, bet, credit, edge, record]);

  const ballCol = (n: number) => Math.floor((n - 1) / 15);
  const ballLetter = (n: number) => BINGO_COLS[ballCol(n)];

  return (
    <GameShell title="Bingo 75" emoji="🎱" gameKey="bingo">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center gap-4 overflow-hidden rounded-2xl border border-[#2a2160] bg-gradient-to-b from-[#0a0620] via-[#160538] to-[#040214] p-4 min-h-[420px] sm:p-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,209,102,0.10),transparent_55%)]"
          />

          <div className="relative z-10 flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 ring-1 ring-[var(--neon-gold)]/40">
            <Sparkles className="h-4 w-4 text-[var(--neon-gold)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--neon-gold)]">
              Bingo 75 · 30 Balls Drawn
            </span>
          </div>

          {/* Current ball */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-[var(--neon-gold)] bg-gradient-to-br from-[#ffe082] via-[#ffb347] to-[#c9770b] shadow-[0_0_30px_rgba(255,209,102,0.6)]">
              {current ? (
                <div className="text-center leading-none text-black">
                  <div className="text-xs font-black">{ballLetter(current)}</div>
                  <div className="text-2xl font-black">{current}</div>
                </div>
              ) : (
                <span className="text-black/60 text-xs font-bold">READY</span>
              )}
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-white/60">
              Draw <span className="text-white">{drawnCount}</span>/30
            </div>
          </div>

          {/* Card */}
          <div className="relative z-10 rounded-2xl border-2 border-[#3a2a80] bg-black/50 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="mb-2 grid grid-cols-5 gap-1.5 text-center">
              {BINGO_COLS.map((c, i) => (
                <div
                  key={c}
                  className="rounded-md py-1 text-sm font-black text-black"
                  style={{ background: COL_COLORS[i] }}
                >
                  {c}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, r) =>
                Array.from({ length: 5 }).map((__, c) => {
                  const n = result?.card[r][c] ?? 0;
                  const isFree = r === 2 && c === 2;
                  const marked = result?.marks[r][c] ?? isFree;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`grid h-14 w-14 place-items-center rounded-lg border-2 text-lg font-black transition-all sm:h-16 sm:w-16 ${
                        isFree
                          ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/20 text-[var(--neon-gold)]"
                          : marked
                            ? "border-emerald-400 bg-emerald-500/25 text-emerald-200 shadow-[0_0_15px_rgba(34,227,154,0.5)] animate-cash-pop"
                            : "border-[#2a2160] bg-[#0a0838]/60 text-white/80"
                      }`}
                    >
                      {isFree ? "★" : result ? n : "—"}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Drawn balls strip */}
          {result && drawnCount > 0 && (
            <div className="relative z-10 flex max-w-full flex-wrap justify-center gap-1">
              {result.balls.slice(0, drawnCount).map((b) => (
                <span
                  key={b}
                  className="inline-flex h-7 min-w-[2rem] items-center justify-center rounded-full bg-black/40 px-2 text-[11px] font-black text-white ring-1"
                  style={{ boxShadow: `inset 0 0 0 2px ${COL_COLORS[ballCol(b)]}` }}
                >
                  {ballLetter(b)}{b}
                </span>
              ))}
            </div>
          )}

          {msg && (
            <div className="relative z-10 animate-fade-in rounded-lg bg-black/50 px-4 py-2 text-center text-lg font-black text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/40">
              {msg}
            </div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="rounded-lg border border-[#2a2160] bg-[#0a0838]/60 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
              পেআউট
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1"><span>প্রতি Line</span><span className="font-mono text-white/80">2×</span></div>
              <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1"><span>৪ Corners</span><span className="font-mono text-white/80">5×</span></div>
              <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1"><span>X প্যাটার্ন</span><span className="font-mono text-white/80">10×</span></div>
              <div className="flex items-center justify-between rounded bg-black/40 px-2 py-1"><span>Full House</span><span className="font-mono text-[var(--neon-gold)]">100×</span></div>
            </div>
            <div className="mt-2 text-[10px] text-white/50">
              সব প্যাটার্ন একসাথে যোগ হয়ে মোট মাল্টিপ্লায়ার।
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={runRound} disabled={busy || !pf.ready}>
            {busy ? "বল ড্র হচ্ছে..." : `প্লে · ${bet}`}
          </PrimaryButton>
          <ProvablyFairPanel pf={pf} gameKey="bingo" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="bingo" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
