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
  fairMegaways,
  MEGAWAYS_SYMBOLS,
  MEGAWAYS_PAYTABLE,
  MEGAWAYS_MAX_ROWS,
  type MegawaysResult,
} from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/games/megaways")({
  head: () => ({
    meta: [
      { title: "Fruit Slots · Megaways — Asik Game" },
      { name: "description", content: "৬-রিল Megaways · প্রতি রিলে ২-৭ সিম্বল · ১১৭,৬৪৯ উপায় পর্যন্ত জেতার সুযোগ।" },
      { property: "og:title", content: "Fruit Slots · Megaways — Asik Game" },
      { property: "og:description", content: "6-reel Megaways with variable heights — up to 117,649 ways to win, provably fair." },
    ],
  }),
  component: MegawaysGame,
});

const SYM_COLOR = ["#ff6b8a", "#ffe066", "#ffb347", "#c084fc", "#84cc16", "#fbbf24", "#7dd3fc", "#ff4d4d"];

function ReelCell({
  sym,
  spinning,
  highlight,
  delayMs,
}: {
  sym: number | null;
  spinning: boolean;
  highlight: boolean;
  delayMs: number;
}) {
  return (
    <div
      className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-lg border-2 bg-gradient-to-br from-[#160828] via-[#0d0424] to-[#050212] shadow-inner transition-all sm:h-16 sm:w-16 ${
        highlight
          ? "border-[var(--neon-gold)] shadow-[0_0_18px_var(--neon-gold)] animate-cash-pop"
          : "border-[#3a1a5a]"
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.14),transparent_65%)]"
      />
      {spinning ? (
        <div className="animate-spin-slow flex flex-col text-2xl leading-none opacity-90">
          {MEGAWAYS_SYMBOLS.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      ) : sym === null ? null : (
        <span
          className="relative z-10 text-3xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-4xl"
          style={{ color: SYM_COLOR[sym] }}
        >
          {MEGAWAYS_SYMBOLS[sym]}
        </span>
      )}
    </div>
  );
}

function MegawaysGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("megaways");
  const { data: cfg } = useGameConfig("megaways");
  const edge = cfg?.house_edge ?? 0.03;
  const pf = useProvablyFair("megaways");

  const [bet, setBet] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<MegawaysResult | null>(null);
  const [displayHeights, setDisplayHeights] = useState<number[]>([4, 4, 4, 4, 4, 4]);
  const [reelDone, setReelDone] = useState<boolean[]>([true, true, true, true, true, true]);
  const [msg, setMsg] = useState<string>("");

  const fxRef = useRef<ParticleBurstHandle>(null);

  const runSpin = useCallback(async () => {
    if (!pf.ready || spinning) return;
    if (!placeBet(bet)) {
      setMsg("পর্যাপ্ত ব্যালেন্স নেই");
      return;
    }
    setSpinning(true);
    setMsg("");
    setResult(null);
    setReelDone([false, false, false, false, false, false]);

    const r = await fairMegaways(pf.serverSeed, pf.clientSeed, pf.nonce);
    setDisplayHeights(r.heights);

    // cascade reel stops
    for (let i = 0; i < 6; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 320));
      try { sfxPeg(0.5); } catch { /* noop */ }
      setReelDone((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }

    setResult(r);

    const mult = r.totalMultiplier;
    let won = 0;
    let pnl: number;
    if (mult > 0) {
      won = Math.floor(bet * mult * (1 - edge));
      credit(won);
      pnl = won - bet;
      const desc = r.wins
        .map((w) => `${MEGAWAYS_SYMBOLS[w.symbol]}×${w.matchLen} (${w.ways}w)`)
        .join(" · ");
      setMsg(`🎉 জয় +${pnl} · ${mult.toFixed(2)}× · ${desc}`);
      record({ pnl, multiplier: mult });
      fxRef.current?.burst({ count: 80, kind: "confetti", speed: 8 });
      try { mult >= 10 ? sfxCashout() : sfxWin(mult); } catch { /* noop */ }
    } else {
      pnl = -bet;
      setMsg(`💥 কোন উপায় জেতেনি · ${pnl} · ${r.totalWays} ways`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 20, kind: "smoke", color: "#ff4d4d", speed: 3 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`megaways heights=${r.heights.join("×")} mult=${mult.toFixed(2)}×`);
    recordMyBet({ game: "megaways", bet, multiplier: mult, payout: won });
    pushMultiplierHistory("megaways", mult);
    setSpinning(false);
  }, [pf, spinning, placeBet, bet, credit, edge, record]);

  // Winning-cell set: for each winning symbol, first N reels contain it in ALL matching cells.
  const winningCells = new Set<string>();
  if (result) {
    for (const w of result.wins) {
      for (let r = 0; r < w.matchLen; r++) {
        result.reels[r].forEach((s, row) => {
          if (s === w.symbol) winningCells.add(`${r}-${row}`);
        });
      }
    }
  }

  return (
    <GameShell title="Fruit Slots · Megaways" emoji="🍇" gameKey="megaways">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-[#3a1a5a] bg-gradient-to-b from-[#180624] via-[#0d0424] to-[#050212] p-4 min-h-[460px] sm:p-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(217,70,239,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,209,102,0.10),transparent_55%)]"
          />

          <div className="relative z-10 flex items-center gap-2 rounded-full bg-black/50 px-4 py-1.5 ring-1 ring-[var(--neon-gold)]/40">
            <Zap className="h-4 w-4 text-[var(--neon-gold)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--neon-gold)]">
              Megaways · {result ? `${result.totalWays.toLocaleString("en-US")} ways` : "up to 117,649 ways"}
            </span>
          </div>

          {/* Reel grid — bottom aligned, variable heights */}
          <div className="relative z-10 rounded-2xl border-2 border-[#4a2a80] bg-black/60 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="grid grid-cols-6 items-end gap-1.5">
              {[0, 1, 2, 3, 4, 5].map((col) => {
                const h = result ? result.heights[col] : displayHeights[col];
                const cells = Array.from({ length: MEGAWAYS_MAX_ROWS });
                const startRow = MEGAWAYS_MAX_ROWS - h;
                return (
                  <div key={col} className="flex flex-col gap-1">
                    {cells.map((_, absRow) => {
                      const row = absRow - startRow;
                      const visible = absRow >= startRow;
                      if (!visible) {
                        return <div key={absRow} className="h-14 w-14 sm:h-16 sm:w-16" />;
                      }
                      const sym = result ? result.reels[col][row] : null;
                      const spin = !reelDone[col];
                      const hi = !!result && winningCells.has(`${col}-${row}`);
                      return (
                        <ReelCell
                          key={absRow}
                          sym={sym}
                          spinning={spin}
                          highlight={hi}
                          delayMs={(col * 4 + row) * 30}
                        />
                      );
                    })}
                    <div className="mt-1 text-center text-[10px] font-black text-white/50">
                      {h}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {msg && (
            <div className="relative z-10 max-w-full animate-fade-in overflow-hidden rounded-lg bg-black/60 px-4 py-2 text-center text-sm font-black text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/40 sm:text-base">
              {msg}
            </div>
          )}

          <ParticleLayer ref={fxRef} />
        </div>

        <ControlsPanel>
          <div className="rounded-lg border border-[#3a1a5a] bg-[#0d0424]/60 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
              পেটেবল (per way · 3 / 4 / 5 / 6 reels)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-4">
              {MEGAWAYS_SYMBOLS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-black/40 px-2 py-1"
                >
                  <span className="text-base" style={{ color: SYM_COLOR[i] }}>
                    {s}
                  </span>
                  <span className="font-mono text-[10px] text-white/80">
                    {MEGAWAYS_PAYTABLE[i].join("/")}×
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-white/50">
              ৬ রিলে ২-৭ সিম্বল ৰ‍্যান্ডম। যত বেশি ম্যাচ, তত বেশি ways · বেট মোট payout-এ গুণিত।
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={spinning} />
          <PrimaryButton onClick={runSpin} disabled={spinning || !pf.ready}>
            {spinning ? "স্পিনিং..." : `স্পিন · ${bet}`}
          </PrimaryButton>
          <ProvablyFairPanel pf={pf} gameKey="megaways" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="megaways" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
