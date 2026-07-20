import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairFishShooter, FISH_TIERS, type FishTier } from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/fish-shooter")({
  head: () => ({ meta: [
    { title: "Fish Shooter · Cast Net — Asik Game" },
    { name: "description", content: "টার্গেট বেছে জাল ফেলুন — ছোট থেকে মেগা বস পর্যন্ত ৫টি টিয়ার, ১.৪× থেকে ৩৩× পেঅউট।" },
    { property: "og:title", content: "Fish Shooter · Cast Net — Asik Game" },
    { property: "og:description", content: "Aim, cast, catch. Five tiers with provably fair hit rates and payouts from 1.4× up to 33×." },
  ]}),
  component: FishShooterGame,
});

type SwimFish = { id: number; tier: FishTier; x: number; y: number; vx: number; scale: number };

function FishShooterGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("fish-shooter");
  const { data: cfg } = useGameConfig("fish-shooter");
  const pf = useProvablyFair("fish-shooter");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(50);
  const [tier, setTier] = useState<FishTier>("medium");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [shot, setShot] = useState<null | { hit: boolean; float: number; payoutMult: number }>(null);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);

  const tierCfg = useMemo(() => FISH_TIERS.find((t) => t.key === tier)!, [tier]);
  const netPayout = +(tierCfg.payout * (1 - edge)).toFixed(3);
  const netEV = +(tierCfg.hitProb * netPayout).toFixed(3);

  // --- Ambient swimming fish ---
  const [fish, setFish] = useState<SwimFish[]>([]);
  const rafRef = useRef<number | null>(null);
  const idRef = useRef(1);

  useEffect(() => {
    // Seed initial school
    const init: SwimFish[] = Array.from({ length: 8 }, () => spawnFish(idRef.current++));
    setFish(init);
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      setFish((prev) => {
        const next = prev.map((f) => {
          let x = f.x + f.vx * dt * 100;
          if (x > 110) x = -10;
          if (x < -10) x = 110;
          return { ...f, x };
        });
        // occasionally spawn a new one, cap at 12
        if (next.length < 12 && Math.random() < 0.01) next.push(spawnFish(idRef.current++));
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const fire = useCallback(async () => {
    if (busy) return;
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }
    setBusy(true); setMsg(""); setShot(null); setFlash(null);

    // Small aiming delay to feel intentional
    await new Promise((r) => setTimeout(r, 350));

    const r = await fairFishShooter(pf.serverSeed, pf.clientSeed, pf.nonce, tier);
    setShot({ hit: r.hit, float: r.float, payoutMult: netPayout });

    if (r.hit) {
      const w = Math.floor(bet * netPayout); credit(w);
      const pnl = w - bet;
      setMsg(`🎯 ধরা পড়েছে +${pnl} · ${netPayout}×`);
      setFlash("hit");
      record({ pnl, multiplier: netPayout });
      pushMultiplierHistory("fish-shooter", netPayout);
      recordMyBet({ game: "fish-shooter", bet, multiplier: netPayout, payout: w });
      try { sfxWin(netPayout); } catch {}
    } else {
      const pnl = -bet;
      setMsg(`💨 মিস — মাছ পালিয়ে গেছে (${pnl})`);
      setFlash("miss");
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("fish-shooter", 0);
      recordMyBet({ game: "fish-shooter", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
    pf.consume(`tier=${tier} f=${r.float.toFixed(6)} thr=${r.threshold}`);
    setTimeout(() => setFlash(null), 900);
    setBusy(false);
  }, [busy, bet, tier, netPayout, placeBet, credit, record, pf]);

  return (
    <GameShell title="Fish Shooter · Cast Net" emoji="🎣" gameKey="fish-shooter">
      <GameFrame>
        {/* Ocean scene */}
        <div className={`relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border p-4 min-h-[420px] transition-colors ${
          flash === "hit" ? "border-emerald-400" : flash === "miss" ? "border-red-500" : "border-cyan-500/30"
        }`}
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(80,200,255,0.20), transparent 60%), linear-gradient(180deg, #041c2e 0%, #062537 40%, #041424 100%)",
          }}
        >
          {/* Water ripples */}
          <div className="pointer-events-none absolute inset-0 opacity-30"
            style={{ background: "repeating-linear-gradient(0deg, transparent 0 20px, rgba(120,200,255,0.06) 20px 21px)" }} />

          {/* Swimming fish */}
          <div className="pointer-events-none absolute inset-0">
            {fish.map((f) => (
              <div key={f.id}
                className="absolute select-none"
                style={{
                  left: `${f.x}%`, top: `${f.y}%`,
                  transform: `translate(-50%,-50%) scale(${f.scale}) scaleX(${f.vx > 0 ? 1 : -1})`,
                  fontSize: 28,
                  filter: "drop-shadow(0 2px 6px rgba(0,120,180,0.6))",
                  opacity: 0.85,
                }}
              >
                {FISH_TIERS.find((t) => t.key === f.tier)?.emoji}
              </div>
            ))}
          </div>

          {/* Center target reticle for chosen tier */}
          <div className="relative z-[2] flex flex-1 items-center justify-center">
            <div className={`relative grid h-40 w-40 place-items-center rounded-full border-2 transition ${
              flash === "hit"
                ? "border-emerald-300 bg-emerald-500/25 shadow-[0_0_40px_rgba(60,255,160,0.7)]"
                : flash === "miss"
                ? "border-red-400 bg-red-500/20 shadow-[0_0_30px_rgba(255,80,80,0.5)]"
                : busy
                ? "border-amber-300 bg-amber-500/15 animate-pulse"
                : "border-cyan-300/60 bg-cyan-500/10"
            }`}>
              <div className="absolute inset-3 rounded-full border border-white/20" />
              <div className="text-5xl">{tierCfg.emoji}</div>
              <div className="absolute -bottom-6 text-[10px] font-black uppercase tracking-widest text-white/70">
                {tierCfg.label}
              </div>
            </div>
          </div>

          {/* Tier picker */}
          <div className="relative z-[2] grid grid-cols-5 gap-2">
            {FISH_TIERS.map((t) => (
              <button key={t.key} disabled={busy} onClick={() => setTier(t.key)}
                className={`rounded-lg border p-2 text-center transition ${
                  tier === t.key
                    ? "border-cyan-300 bg-cyan-500/25 shadow-[0_0_18px_rgba(80,200,255,0.5)]"
                    : "border-white/10 bg-black/30 hover:bg-black/50"
                }`}>
                <div className="text-2xl">{t.emoji}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-widest text-white">{t.label}</div>
                <div className="text-[10px] text-emerald-300">{t.payout}×</div>
                <div className="text-[9px] text-white/50">hit {(t.hitProb * 100).toFixed(0)}%</div>
              </button>
            ))}
          </div>

          {shot && (
            <div className="relative z-[2] text-center font-mono text-[11px] text-white/70">
              float = {shot.float.toFixed(6)} · threshold = {tierCfg.hitProb} · {shot.hit ? "HIT" : "MISS"}
            </div>
          )}

          {msg && <div className="relative z-[2] text-center text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>

        <ControlsPanel>
          <MultDisplay label="পেঅউট" value={`${netPayout}×`} sub={<>EV ≈ {netEV}× · edge {(edge * 100).toFixed(1)}%</>} />
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={fire} disabled={busy}>
            {busy ? "টার্গেটিং..." : "🎯 শুট করুন"}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3"><MultiplierHistoryStrip gameKey="fish-shooter" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="mt-3"><ProvablyFairPanel pf={pf} gameKey="fish-shooter" /></div>
    </GameShell>
  );
}

function spawnFish(id: number): SwimFish {
  const pool: FishTier[] = ["small", "small", "small", "medium", "medium", "big", "boss", "mega"];
  const tier = pool[Math.floor(Math.random() * pool.length)];
  const dir = Math.random() < 0.5 ? -1 : 1;
  const speed = 0.15 + Math.random() * 0.35;
  return {
    id,
    tier,
    x: Math.random() * 100,
    y: 15 + Math.random() * 70,
    vx: dir * speed,
    scale: 0.75 + Math.random() * 0.75,
  };
}
