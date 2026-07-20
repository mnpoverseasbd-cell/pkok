import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import {
  fairDragonFishing,
  DRAGON_FISH_TIERS,
  DRAGON_FISHING_SHOT_CHOICES,
  type DragonFishingShotCount,
  type DragonFishingShot,
} from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/dragon-fishing")({
  head: () => ({ meta: [
    { title: "Dragon Fortune Fishing — Asik Game" },
    { name: "description", content: "৩/৫/৮ শট একসাথে ফায়ার করুন — প্রতিটি শটে আলাদা মাছ, মেগা ড্রাগন হিটে ২০× পর্যন্ত!" },
    { property: "og:title", content: "Dragon Fortune Fishing — Asik Game" },
    { property: "og:description", content: "Multi-shot arcade fishing with independent RNG per shot. Mega Dragon pays 20× per shot." },
  ]}),
  component: DragonFishingGame,
});

function DragonFishingGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("dragon-fishing");
  const { data: cfg } = useGameConfig("dragon-fishing");
  const pf = useProvablyFair("dragon-fishing");
  const edge = cfg?.house_edge ?? 0.05;

  const [perShot, setPerShot] = useState(20);
  const [shotCount, setShotCount] = useState<DragonFishingShotCount>(5);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [round, setRound] = useState<null | { shots: (DragonFishingShot | null)[]; totalMult: number }>(null);

  const totalBet = perShot * shotCount;
  const edgeMult = 1 - edge;

  const evPerShot = useMemo(() => {
    let ev = 0;
    let prev = 0;
    for (const t of DRAGON_FISH_TIERS) {
      const p = t.threshold - prev;
      ev += p * t.mult;
      prev = t.threshold;
    }
    return +(ev * edgeMult).toFixed(3);
  }, [edgeMult]);

  const fire = useCallback(async () => {
    if (busy) return;
    if (!placeBet(totalBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg("");
    // Prepare empty slots for the reveal animation
    setRound({ shots: Array.from({ length: shotCount }, () => null), totalMult: 0 });

    const r = await fairDragonFishing(pf.serverSeed, pf.clientSeed, pf.nonce, shotCount);

    // Reveal shots one by one
    for (let i = 0; i < r.shots.length; i++) {
      await new Promise((res) => setTimeout(res, 260));
      setRound((prev) => {
        if (!prev) return prev;
        const next = prev.shots.slice();
        next[i] = r.shots[i];
        return { shots: next, totalMult: prev.totalMult };
      });
    }

    const grossPayout = Math.floor(totalBet * r.totalMult * edgeMult);
    const pnl = grossPayout - totalBet;
    if (grossPayout > 0) credit(grossPayout);
    setRound({ shots: r.shots, totalMult: r.totalMult });

    const netMult = +(r.totalMult * edgeMult / shotCount).toFixed(3); // avg per-shot net mult
    if (pnl > 0) {
      setMsg(`🐲 জ্যাকপট! +${pnl} · সব শট মিলিয়ে ${(r.totalMult * edgeMult).toFixed(2)}×`);
      record({ pnl, multiplier: r.totalMult });
      try { sfxWin(r.totalMult); } catch {}
    } else if (pnl === 0) {
      setMsg(`⚖️ সমান — ${(r.totalMult * edgeMult).toFixed(2)}×`);
      record({ pnl, multiplier: r.totalMult });
    } else {
      setMsg(`💨 লস ${pnl} · সব শট মিলিয়ে ${(r.totalMult * edgeMult).toFixed(2)}×`);
      record({ pnl, multiplier: r.totalMult });
      try { sfxBust(); } catch {}
    }
    pushMultiplierHistory("dragon-fishing", r.totalMult);
    recordMyBet({ game: "dragon-fishing", bet: totalBet, multiplier: r.totalMult, payout: grossPayout });
    pf.consume(`shots=${shotCount} totalMult=${r.totalMult} avgNet=${netMult}`);
    setBusy(false);
  }, [busy, totalBet, shotCount, perShot, placeBet, credit, edgeMult, record, pf]);

  return (
    <GameShell title="Dragon Fortune Fishing" emoji="🐲" gameKey="dragon-fishing">
      <GameFrame>
        <div
          className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-cyan-500/30 p-4 min-h-[420px]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(255,120,60,0.16), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(60,180,255,0.20), transparent 55%), linear-gradient(180deg, #0a0f2e 0%, #061a2e 50%, #04101c 100%)",
          }}
        >
          {/* Water shimmer */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{ background: "repeating-linear-gradient(0deg, transparent 0 20px, rgba(120,200,255,0.06) 20px 21px)" }}
          />

          <div className="relative z-[2] text-center">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-300/90">Cast the Dragon Net</div>
            <div className="text-2xl font-black text-white">🐲 Dragon Fortune 🐲</div>
          </div>

          {/* Shot grid */}
          <div className="relative z-[2] mx-auto grid w-full max-w-[560px] gap-3"
               style={{ gridTemplateColumns: `repeat(${Math.min(shotCount, 4)}, minmax(0, 1fr))` }}>
            {(round?.shots ?? Array.from({ length: shotCount }, () => null)).map((s, i) => {
              if (s === null) {
                return (
                  <div key={i} className="grid h-24 place-items-center rounded-xl border border-white/10 bg-black/40 text-2xl text-white/30">
                    ?
                  </div>
                );
              }
              const tier = DRAGON_FISH_TIERS[s.tierIndex];
              const hit = tier.mult > 0;
              return (
                <div
                  key={i}
                  className={`grid h-24 place-items-center rounded-xl border p-2 text-center transition ${
                    hit
                      ? "border-emerald-300 bg-emerald-500/15 shadow-[0_0_18px_rgba(80,255,180,0.4)]"
                      : "border-white/10 bg-black/40"
                  }`}
                >
                  <div className="text-3xl leading-none">{tier.emoji}</div>
                  <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-white/80">{tier.label}</div>
                  <div className={`text-[11px] font-black ${hit ? "text-emerald-300" : "text-white/40"}`}>{tier.mult}×</div>
                </div>
              );
            })}
          </div>

          {/* Total row */}
          {round && (
            <div className="relative z-[2] mx-auto flex items-center gap-3 rounded-full border border-amber-400/40 bg-black/40 px-4 py-1.5 text-sm font-black text-amber-200">
              <span className="text-white/70">Total</span>
              <span>{(round.totalMult * edgeMult).toFixed(2)}×</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">Payout</span>
              <span className="text-emerald-300">
                {Math.floor(totalBet * round.totalMult * edgeMult)}
              </span>
            </div>
          )}

          {/* Shot count picker */}
          <div className="relative z-[2] mx-auto flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Shots</span>
            {DRAGON_FISHING_SHOT_CHOICES.map((n) => (
              <button
                key={n}
                disabled={busy}
                onClick={() => setShotCount(n)}
                className={`rounded-md border px-3 py-1 text-sm font-black transition ${
                  shotCount === n
                    ? "border-amber-300 bg-amber-400/25 text-amber-200 shadow-[0_0_14px_rgba(255,200,80,0.4)]"
                    : "border-white/15 bg-black/40 text-white/80 hover:bg-black/60"
                }`}
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
            label="Per-shot EV"
            value={`${evPerShot}×`}
            sub={<>Total bet {totalBet} · edge {(edge * 100).toFixed(1)}%</>}
          />
          <BetControls bet={perShot} setBet={setPerShot} disabled={busy} />
          <PrimaryButton onClick={fire} disabled={busy}>
            {busy ? "কাস্টিং..." : `🎯 ${shotCount} শট ফায়ার (${totalBet})`}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3">
        <MultiplierHistoryStrip gameKey="dragon-fishing" />
      </div>
      <StatsBar stats={stats} onReset={resetStats} />

      {/* Paytable */}
      <div className="mt-3 rounded-xl border border-white/10 bg-black/30 p-3">
        <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">Paytable · per shot</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
          {DRAGON_FISH_TIERS.map((t, i) => {
            const prev = i === 0 ? 0 : DRAGON_FISH_TIERS[i - 1].threshold;
            const prob = ((t.threshold - prev) * 100).toFixed(1);
            return (
              <div key={t.key} className="rounded-lg border border-white/10 bg-black/40 p-2 text-center">
                <div className="text-2xl">{t.emoji}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/80">{t.label}</div>
                <div className="text-[11px] font-black text-emerald-300">{t.mult}×</div>
                <div className="text-[9px] text-white/50">{prob}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProvablyFairPanel pf={pf} gameKey="dragon-fishing" />
      </div>
    </GameShell>
  );
}
