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
  fairSlots,
  SLOT_SYMBOLS,
  SLOT_NAMES,
  SLOT_PAYTABLE,
  SLOT_PAYLINES,
  type SlotResult,
} from "@/lib/provablyFair";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxWin, sfxBust, sfxPeg, sfxCashout } from "@/lib/sound";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/games/slots")({
  head: () => ({
    meta: [
      { title: "Cosmic Fortune Slots — Asik Game" },
      { name: "description", content: "৫-রিল × ৩-রো স্লট · ১০ পেলাইন · Provably-fair · 7️⃣ 200× পর্যন্ত পেআউট।" },
      { property: "og:title", content: "Cosmic Fortune Slots — Asik Game" },
      { property: "og:description", content: "Provably-fair 5×3 slots with 10 paylines. Diamonds and Sevens pay huge." },
    ],
  }),
  component: SlotsGame,
});

const SYM_COLOR = ["#ff7fa8", "#ffe066", "#ffb347", "#7fdbff", "#a78bfa", "#ff4d4d"];

function SymbolCell({
  sym,
  spinning,
  highlight,
  delayMs,
}: {
  sym: number;
  spinning: boolean;
  highlight: boolean;
  delayMs: number;
}) {
  const emoji = SLOT_SYMBOLS[sym];
  return (
    <div
      className={`relative grid h-20 w-20 place-items-center overflow-hidden rounded-xl border-2 bg-gradient-to-br from-[#0a0f1e] via-[#0f1732] to-[#050718] shadow-inner transition-all sm:h-24 sm:w-24 ${
        highlight
          ? "border-[var(--neon-gold)] shadow-[0_0_20px_var(--neon-gold)] animate-cash-pop"
          : "border-[#2a2160]"
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.15),transparent_65%)]"
      />
      {spinning ? (
        <div className="animate-spin-slow flex flex-col text-3xl leading-none opacity-90">
          {SLOT_SYMBOLS.map((s, i) => (
            <span key={i}>{s}</span>
          ))}
        </div>
      ) : (
        <span
          className="relative z-10 text-4xl drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-5xl"
          style={{ color: SYM_COLOR[sym] }}
        >
          {emoji}
        </span>
      )}
    </div>
  );
}

function SlotsGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("slots");
  const { data: cfg } = useGameConfig("slots");
  const edge = cfg?.house_edge ?? 0;
  const pf = useProvablyFair("slots");

  const [bet, setBet] = useState(100);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SlotResult | null>(null);
  const [reelDone, setReelDone] = useState<boolean[]>([true, true, true, true, true]);
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
    setReelDone([false, false, false, false, false]);

    const r = await fairSlots(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Stop reels one-by-one for cascade effect
    for (let i = 0; i < 5; i++) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 380));
      try { sfxPeg(0.5); } catch { /* noop */ }
      setReelDone((prev) => {
        const next = [...prev];
        next[i] = true;
        return next;
      });
    }

    setResult(r);

    const mult = r.totalMultiplier;
    let pnl: number;
    let won = 0;
    if (mult > 0) {
      won = Math.floor(bet * mult * (1 - edge));
      credit(won);
      pnl = won - bet;
      const lineDesc = r.wins
        .map((w) => `L${w.line} ${SLOT_SYMBOLS[w.symbol]}×${w.count}`)
        .join(", ");
      setMsg(`🎉 জয় +${pnl} · ${mult.toFixed(2)}× · ${lineDesc}`);
      record({ pnl, multiplier: mult });
      fxRef.current?.burst({ count: 80, kind: "confetti", speed: 8 });
      try { mult >= 5 ? sfxCashout(mult) : sfxWin(mult); } catch { /* noop */ }
    } else {
      pnl = -bet;
      setMsg(`💥 কোন পেলাইন জেতেনি · ${pnl}`);
      record({ pnl, multiplier: 0 });
      fxRef.current?.burst({ count: 20, kind: "smoke", color: "#ff4d4d", speed: 3 });
      try { sfxBust(); } catch { /* noop */ }
    }

    pf.consume(`slots mult=${mult.toFixed(2)}× wins=${r.wins.length}`);
    recordMyBet({ game: "slots", bet, multiplier: mult, payout: won });
    pushMultiplierHistory("slots", mult);
    setSpinning(false);
  }, [pf, spinning, placeBet, bet, credit, edge, record]);

  const winningCells = new Set<string>();
  if (result) {
    for (const w of result.wins) {
      const line = SLOT_PAYLINES[w.line - 1];
      for (let col = 0; col < w.count; col++) {
        winningCells.add(`${line[col]}-${col}`);
      }
    }
  }

  return (
    <GameShell title="Cosmic Fortune Slots" emoji="🎰" gameKey="slots">
      <GameFrame>
        <div className="relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-[#2a2160] bg-gradient-to-b from-[#0a0620] via-[#0a0838] to-[#040214] p-4 min-h-[420px] sm:p-6">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(167,139,250,0.18),transparent_60%),radial-gradient(ellipse_at_bottom,rgba(255,209,102,0.10),transparent_55%)]"
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.15]"
            style={{
              backgroundImage:
                "radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 60%, #fff, transparent), radial-gradient(1px 1px at 40% 80%, #fff, transparent), radial-gradient(1px 1px at 85% 15%, #fff, transparent)",
            }}
          />

          <div className="relative z-10 flex items-center gap-2 rounded-full bg-black/40 px-4 py-1.5 ring-1 ring-[var(--neon-gold)]/40">
            <Sparkles className="h-4 w-4 text-[var(--neon-gold)]" />
            <span className="text-xs font-black uppercase tracking-widest text-[var(--neon-gold)]">
              Cosmic Fortune · 10 Paylines
            </span>
          </div>

          {/* Reel grid */}
          <div className="relative z-10 rounded-2xl border-2 border-[#3a2a80] bg-black/50 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((col) => (
                <div key={col} className="flex flex-col gap-2">
                  {[0, 1, 2].map((row) => {
                    const sym = result ? result.grid[row][col] : 0;
                    const spin = !reelDone[col];
                    const hi = !!result && winningCells.has(`${row}-${col}`);
                    return (
                      <SymbolCell
                        key={`${col}-${row}`}
                        sym={sym}
                        spinning={spin}
                        highlight={hi}
                        delayMs={(col * 3 + row) * 40}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

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
              পেটেবল (per line, 3 / 4 / 5)
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] sm:grid-cols-3">
              {SLOT_SYMBOLS.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded bg-black/40 px-2 py-1"
                >
                  <span className="text-base" style={{ color: SYM_COLOR[i] }}>
                    {s}
                  </span>
                  <span className="font-mono text-white/80">
                    {SLOT_PAYTABLE[i].join("/")}×
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-white/50">
              টপ প্রাইজ: 5× 7️⃣ = 200× (per line)। মোট বেট 10 পেলাইনে ভাগ হয়।
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={spinning} />
          <PrimaryButton onClick={runSpin} disabled={spinning || !pf.ready}>
            {spinning ? "স্পিনিং..." : `স্পিন · ${bet}`}
          </PrimaryButton>
          <ProvablyFairPanel pf={pf} gameKey="slots" />
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="slots" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}

// Placeholder use to satisfy unused import if categories widen
void SLOT_NAMES;
