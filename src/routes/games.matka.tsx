import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { fairMatka } from "@/lib/provablyFair";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { recordMyBet } from "@/lib/liveFeed";
import { sfxWin, sfxBust } from "@/lib/sound";

export const Route = createFileRoute("/games/matka")({
  head: () => ({ meta: [
    { title: "Matka King — Asik Game" },
    { name: "description", content: "ক্লাসিক মটকা — সিঙ্গেল আঙ্ক (৯×) বা জোড়ি (৯০×) বাছুন।" },
    { property: "og:title", content: "Matka King — Asik Game" },
    { property: "og:description", content: "Bet on a single digit (9×) or a two-digit jodi (90×). Provably fair, instant draws." },
  ]}),
  component: MatkaGame,
});

type Mode = "single" | "jodi";

function MatkaGame() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("matka");
  const { data: cfg } = useGameConfig("matka");
  const pf = useProvablyFair("matka");
  const edge = cfg?.house_edge ?? 0.05;

  const [bet, setBet] = useState(50);
  const [mode, setMode] = useState<Mode>("single");
  const [pickSingle, setPickSingle] = useState<number | null>(null);
  const [pickJodi, setPickJodi] = useState<string>(""); // "00".."99"
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [drawn, setDrawn] = useState<{ single: number; jodi: string } | null>(null);
  const [spinSingle, setSpinSingle] = useState(0);
  const [spinJodi, setSpinJodi] = useState("00");

  const rawPayout = mode === "single" ? 9 : 90;
  const netPayout = +(rawPayout * (1 - edge)).toFixed(3);

  const play = useCallback(async () => {
    if (busy) return;
    if (mode === "single" && pickSingle === null) { setMsg("একটি সংখ্যা বাছুন (0-9)"); return; }
    if (mode === "jodi") {
      if (!/^\d{1,2}$/.test(pickJodi)) { setMsg("জোড়ি লিখুন (00–99)"); return; }
    }
    if (!placeBet(bet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return; }

    setBusy(true); setMsg(""); setDrawn(null);

    const r = await fairMatka(pf.serverSeed, pf.clientSeed, pf.nonce);

    // Spin/reveal animation
    const start = performance.now();
    const dur = 1600;
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = performance.now() - start;
        const p = Math.min(1, t / dur);
        setSpinSingle(Math.floor(Math.random() * 10));
        setSpinJodi(Math.floor(Math.random() * 100).toString().padStart(2, "0"));
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

    setDrawn({ single: r.single, jodi: r.jodiStr });
    setSpinSingle(r.single);
    setSpinJodi(r.jodiStr);

    const jodiPick = pickJodi.padStart(2, "0");
    const win =
      (mode === "single" && pickSingle === r.single) ||
      (mode === "jodi" && jodiPick === r.jodiStr);

    if (win) {
      const w = Math.floor(bet * netPayout); credit(w);
      const pnl = w - bet;
      setMsg(`🎉 জিতেছেন +${pnl} · ${netPayout}×`);
      record({ pnl, multiplier: netPayout });
      pushMultiplierHistory("matka", netPayout);
      recordMyBet({ game: "matka", bet, multiplier: netPayout, payout: w });
      try { sfxWin(netPayout); } catch {}
    } else {
      const pnl = -bet;
      setMsg(`💥 হার ${pnl} · ড্র হয়েছে ${r.single} / ${r.jodiStr}`);
      record({ pnl, multiplier: 0 });
      pushMultiplierHistory("matka", 0);
      recordMyBet({ game: "matka", bet, multiplier: 0, payout: 0 });
      try { sfxBust(); } catch {}
    }
    pf.consume(`${mode}=${mode === "single" ? pickSingle : jodiPick} vs ${r.single}/${r.jodiStr}`);
    setBusy(false);
  }, [busy, mode, pickSingle, pickJodi, bet, edge, netPayout, placeBet, credit, record, pf]);

  const showSingle = drawn ? drawn.single : spinSingle;
  const showJodi = drawn ? drawn.jodi : spinJodi;

  return (
    <GameShell title="Matka King" emoji="🎰" gameKey="matka">
      <GameFrame>
        <div className="relative flex flex-1 flex-col gap-4 overflow-hidden rounded-2xl border border-[#3a1f4a] bg-gradient-to-b from-[#1a0824] via-[#0e0418] to-[#050208] p-4 min-h-[420px]">
          {/* Starfield decoration */}
          <div className="pointer-events-none absolute inset-0 opacity-40"
            style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(255,180,80,0.18), transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(180,80,255,0.18), transparent 55%)" }} />

          {/* Draw display */}
          <div className="relative z-[2] grid grid-cols-2 gap-4">
            <DrawTile label="সিঙ্গেল আঙ্ক" sub="9× payout" value={String(showSingle)}
              highlight={!!drawn && mode === "single" && pickSingle === drawn.single}
              busy={busy && !drawn} />
            <DrawTile label="জোড়ি" sub="90× payout" value={showJodi}
              highlight={!!drawn && mode === "jodi" && pickJodi.padStart(2, "0") === drawn.jodi}
              busy={busy && !drawn} />
          </div>

          {/* Mode switch */}
          <div className="relative z-[2] flex gap-2">
            {(["single", "jodi"] as Mode[]).map((m) => (
              <button key={m} disabled={busy} onClick={() => setMode(m)}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-black transition ${
                  mode === m
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}>
                {m === "single" ? "সিঙ্গেল আঙ্ক · 9×" : "জোড়ি · 90×"}
              </button>
            ))}
          </div>

          {/* Pick grid */}
          {mode === "single" ? (
            <div className="relative z-[2] grid grid-cols-5 gap-2 sm:grid-cols-10">
              {Array.from({ length: 10 }, (_, i) => i).map((n) => (
                <button key={n} disabled={busy} onClick={() => setPickSingle(n)}
                  className={`aspect-square rounded-lg text-lg font-black transition ${
                    pickSingle === n
                      ? "bg-fuchsia-500 text-white ring-2 ring-fuchsia-300 shadow-[0_0_18px_rgba(255,80,220,0.6)]"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          ) : (
            <div className="relative z-[2] flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/60">জোড়ি লিখুন (00–99)</label>
              <input type="text" inputMode="numeric" maxLength={2} value={pickJodi}
                disabled={busy}
                onChange={(e) => setPickJodi(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="যেমন: 07"
                className="rounded-lg border border-fuchsia-500/40 bg-black/40 px-4 py-3 text-center font-mono text-3xl font-black tracking-widest text-white focus:border-fuchsia-400 focus:outline-none" />
              <div className="text-center text-[11px] text-white/50">ঠিক ২টি ডিজিট = সরাসরি জিত</div>
            </div>
          )}

          {msg && <div className="relative z-[2] text-center text-lg font-black text-[var(--neon-gold)]">{msg}</div>}
        </div>

        <ControlsPanel>
          <MultDisplay label="পেঅউট" value={`${netPayout}×`} sub={<>edge {(edge * 100).toFixed(1)}%</>} />
          <BetControls bet={bet} setBet={setBet} disabled={busy} />
          <PrimaryButton onClick={play} disabled={busy}>
            {busy ? "ড্র হচ্ছে..." : "খেলুন"}
          </PrimaryButton>
        </ControlsPanel>
      </GameFrame>

      <div className="mt-3"><MultiplierHistoryStrip gameKey="matka" /></div>
      <StatsBar stats={stats} onReset={resetStats} />
      <div className="mt-3"><ProvablyFairPanel pf={pf} gameKey="matka" /></div>
    </GameShell>
  );
}

function DrawTile({ label, sub, value, highlight, busy }: {
  label: string; sub: string; value: string; highlight: boolean; busy: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 text-center transition ${
      highlight
        ? "border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(60,255,160,0.5)]"
        : "border-amber-400/30 bg-black/50"
    }`}>
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</div>
      <div className={`my-2 font-mono text-5xl font-black tracking-widest transition ${
        highlight ? "text-emerald-300" : busy ? "text-amber-300 animate-pulse" : "text-amber-400"
      }`}>
        {value}
      </div>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/50">{sub}</div>
    </div>
  );
}
