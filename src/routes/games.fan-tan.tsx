import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairFanTan,
  fanTanNetMult,
  FAN_TAN_STRAIGHT_MULT,
  type FanTanPick,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust, sfxTick } from "@/lib/sound";

export const Route = createFileRoute("/games/fan-tan")({
  head: () => ({ meta: [
    { title: "Fan-Tan · Bead Count — Asik Game" },
    { name: "description", content: "ক্লাসিক এশিয়ান ফ্যান-টান! ডিলার পুঁতি ৪টি করে গুনবে — শেষে যা বাকি (১-৪) সেটাই বিজয়ী। সঠিক অনুমানে ৪× পেআউট।" },
    { property: "og:title", content: "Fan-Tan · Bead Count — Asik Game" },
    { property: "og:description", content: "Pick 1-4. Dealer counts beads in groups of four; the remainder wins at ~3.8×." },
  ]}),
  component: FanTanGame,
});

const PICKS: FanTanPick[] = [1, 2, 3, 4];

function pickColor(n: FanTanPick, active: boolean, winner: FanTanPick | null) {
  const isWinner = winner === n;
  if (isWinner) return "border-emerald-300 bg-emerald-500/40 text-white shadow-[0_0_24px_rgba(80,255,180,0.7)]";
  if (active) return "border-amber-300 bg-amber-500/30 text-amber-100 shadow-[0_0_16px_rgba(255,200,80,0.55)]";
  return "border-white/25 bg-white/10 text-white/80 hover:bg-white/20";
}

function FanTanGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("fan-tan");
  const { data: cfg } = useGameConfig("fan-tan");
  const pf = useProvablyFair("fan-tan");
  const edge = cfg?.house_edge ?? 0.05;
  const netOnWin = fanTanNetMult(true, edge);

  const [bet, setBet] = useState(20);
  const [pick, setPick] = useState<FanTanPick>(3);
  const [busy, setBusy] = useState(false);
  const [reveal, setReveal] = useState<null | {
    beads: number;
    groups: number;
    shownGroups: number; // for count-out animation
    winner: FanTanPick | null;
    picked: FanTanPick;
    payout: number;
    done: boolean;
  }>(null);
  const [msg, setMsg] = useState("");

  const spin = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setReveal(null);
    const r = await fairFanTan(pf.serverSeed, pf.clientSeed, pf.nonce);
    const won = r.winner === pick;
    const payoutMult = fanTanNetMult(won, edge);
    const payout = Math.floor(bet * payoutMult);

    // Reveal pile immediately (hidden winner), then count out groups of 4.
    setReveal({ beads: r.beads, groups: r.groups, shownGroups: 0, winner: null, picked: pick, payout, done: false });

    // Animate counting groups of four.
    const totalGroups = r.groups;
    const tickMs = Math.max(30, Math.min(80, Math.floor(1400 / Math.max(1, totalGroups))));
    for (let g = 1; g <= totalGroups; g++) {
      await new Promise((res) => setTimeout(res, tickMs));
      try { sfxTick(); } catch {}
      setReveal((prev) => (prev ? { ...prev, shownGroups: g } : prev));
    }
    // Reveal remainder / winner.
    await new Promise((res) => setTimeout(res, 260));

    if (won) credit(payout);
    const pnl = payout - bet;
    record({ pnl, multiplier: payoutMult });
    pushMultiplierHistory("fan-tan", payoutMult);
    recordMyBet({ game: "fan-tan", bet, multiplier: payoutMult, payout });
    pf.consume(`fan-tan beads=${r.beads} winner=${r.winner} pick=${pick} ${won ? "WIN" : "LOSS"}`);

    setReveal({ beads: r.beads, groups: r.groups, shownGroups: totalGroups, winner: r.winner, picked: pick, payout, done: true });
    if (won) { try { sfxWin(payoutMult); } catch {}
      setMsg(`🎉 জিতেছেন! বিজয়ী ${r.winner} · +${pnl} · ${payoutMult.toFixed(2)}×`);
    } else { try { sfxBust(); } catch {}
      setMsg(`❌ হেরেছেন · বিজয়ী ${r.winner} · আপনার পিক ${pick} · লস ${bet}`);
    }
    setBusy(false);
  }, [busy, bet, placeBet, pf, pick, edge, credit, record]);

  const beadsToRender = reveal ? Math.min(reveal.beads, 120) : 60;
  const remainderShown = reveal?.done ? (reveal.winner as FanTanPick) : null;

  return (
    <GameShell title="Fan-Tan · Bead Count" emoji="🪙" gameKey="fan-tan">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-emerald-400/30 p-4 min-h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(120,255,200,0.14), transparent 55%), radial-gradient(circle at 50% 100%, rgba(200,60,60,0.28), transparent 55%), linear-gradient(180deg, #06251a 0%, #0d3b28 55%, #04140d 100%)",
          }}
        >
          {/* Gold rim */}
          <div className="pointer-events-none absolute inset-2 rounded-2xl border border-amber-400/25" />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-200/80">Macau Classic</div>
            <div className="text-2xl font-black text-white">🪙 ফ্যান-টান · বীড কাউন্ট 🪙</div>
            <div className="mt-1 text-[11px] text-white/60">
              ডিলার ৪ করে গুনবে · শেষে যা বাকি (১–৪) সেটাই বিজয়ী · সঠিক পিকে ~{netOnWin.toFixed(2)}× পেআউট
            </div>
          </div>

          {/* Multiplier readout */}
          <div className="relative z-[2] mx-auto flex flex-col items-center">
            <div
              className={`text-6xl font-black leading-none ${
                reveal?.done && reveal.winner === reveal.picked ? "text-emerald-300" : reveal?.done ? "text-rose-400" : "text-amber-200"
              }`}
              style={{ textShadow: "0 0 24px rgba(120,255,180,0.5)" }}
            >
              {remainderShown ?? "?"}
            </div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-widest text-white/60">
              {reveal ? `Beads: ${reveal.beads} · Groups: ${reveal.shownGroups}/${reveal.groups}` : `Bet ${bet} · edge ${(edge * 100).toFixed(1)}%`}
            </div>
          </div>

          {/* Bead pile — visual, counting out in groups of 4 */}
          <div className="relative z-[2] mx-auto w-full max-w-[560px] rounded-xl border border-emerald-300/30 bg-black/40 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
              <span>Bead pile</span>
              <span>
                {reveal ? `${Math.min(reveal.shownGroups * 4, reveal.beads)} / ${reveal.beads} counted` : "waiting…"}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: beadsToRender }).map((_, i) => {
                const counted = reveal ? i < Math.min(reveal.shownGroups * 4, reveal.beads) : false;
                const groupIdx = Math.floor(i / 4);
                const remainderBead = reveal?.done && i >= reveal.groups * 4;
                return (
                  <div
                    key={i}
                    className={`h-3 w-3 rounded-full border transition-colors ${
                      remainderBead
                        ? "border-emerald-200 bg-emerald-400 shadow-[0_0_8px_rgba(80,255,180,0.8)]"
                        : counted
                          ? groupIdx % 2 === 0
                            ? "border-amber-200/60 bg-amber-300/70"
                            : "border-rose-200/60 bg-rose-300/70"
                          : "border-white/20 bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Pick 1-4 */}
          <div className="relative z-[2] mx-auto grid w-full max-w-[420px] grid-cols-4 gap-2">
            {PICKS.map((n) => (
              <button
                key={n}
                onClick={() => !busy && setPick(n)}
                disabled={busy}
                className={`grid h-16 place-items-center rounded-xl border text-3xl font-black transition ${pickColor(n, pick === n, reveal?.done ? reveal.winner : null)}`}
              >
                {n}
              </button>
            ))}
          </div>

          {msg && (
            <div className="relative z-[2] text-center text-base font-black text-[var(--neon-gold)]">
              {msg}
            </div>
          )}
        </div>

        <ControlsPanel>
          <MultDisplay
            label="Win pays"
            value={`${netOnWin.toFixed(2)}×`}
            sub={<>Straight pick · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={spin} disabled={busy}>
            {busy ? "গণনা চলছে..." : `🪙 কাউন্ট শুরু (পিক ${pick} · ${bet})`}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="fan-tan" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">
          Straight pick · probability 25% each
        </div>
        <div className="grid grid-cols-4 gap-2">
          {PICKS.map((n) => (
            <div key={n} className="rounded-lg border border-white/15 bg-white/5 p-2 text-center">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/60">Pick</div>
              <div className="text-2xl font-black text-white">{n}</div>
              <div className="text-[11px] font-black text-emerald-300">×{netOnWin.toFixed(2)}</div>
              <div className="text-[9px] text-white/60">gross ×{FAN_TAN_STRAIGHT_MULT.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="fan-tan" />
      </div>
    </GameShell>
  );
}
