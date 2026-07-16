import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairCrash } from "@/lib/provablyFair";
import { CrashChart } from "@/components/games/fx/CrashChart";
import { ParticleLayer, type ParticleBurstHandle } from "@/components/games/fx/Particles";
import { MultiplierHUD } from "@/components/games/hud/MultiplierHUD";
import { MultiplierHistoryStrip, pushMultiplierHistory } from "@/components/games/hud/MultiplierHistoryStrip";
import { sfxCashout, sfxBust } from "@/lib/sound";
import { Rocket } from "lucide-react";

export const Route = createFileRoute("/games/crash")({
  head: () => ({ meta: [{ title: "Crash — Asik Game" }, { name: "description", content: "Cash out before the crash." }] }),
  component: Crash,
});

function Crash() {
  const { bet: placeBet, credit } = useDemoWallet();
  const { stats, record, reset: resetStats } = useGameStats("crash");
  const { data: cfg } = useGameConfig("crash");
  const edge = cfg?.house_edge ?? 0.01;
  const pf = useProvablyFair("crash");
  const [bet, setBet] = useState(50);
  const [state, setState] = useState<"idle" | "flying" | "crashed" | "cashed">("idle");
  const [mult, setMult] = useState(1.0);
  const [crashAt, setCrashAt] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [mode, setMode] = useState<"manual" | "auto">("manual");
  const [autoCashout, setAutoCashout] = useState(2.0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const targetRef = useRef(0);
  const fxRef = useRef<ParticleBurstHandle>(null);

  const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
  useEffect(() => () => stop(), []);

  const manualResolveRef = useRef<((r: { pnl: number }) => void) | null>(null);

  const runRound = useCallback((roundBet: number, cashoutAt?: number) => {
    return new Promise<{ pnl: number }>(async (resolve) => {
      if (!pf.ready) return resolve({ pnl: 0 });
      if (!placeBet(roundBet)) { setMsg("পর্যাপ্ত ব্যালেন্স নেই"); return resolve({ pnl: 0 }); }
      const target = await fairCrash(pf.serverSeed, pf.clientSeed, pf.nonce, edge);
      targetRef.current = target;
      setCrashAt(null); setMsg(""); setMult(1.0); setState("flying");
      startRef.current = performance.now();
      let resolved = false;
      const finish = (pnl: number) => { if (!resolved) { resolved = true; resolve({ pnl }); } };
      const finishR = (r: { pnl: number }) => finish(r.pnl);


      const tick = (now: number) => {
        const t = (now - startRef.current) / 1000;
        const m = +Math.pow(1.06, t * 8).toFixed(2);
        // Auto cashout hit
        if (cashoutAt !== undefined && m >= cashoutAt && m < target) {
          setMult(cashoutAt); setState("cashed"); setCrashAt(target);
          const won = Math.floor(roundBet * cashoutAt * (1 - edge)); credit(won);
          const pnl = won - roundBet;
          setMsg(`🎉 অটো ক্যাশ @ ${cashoutAt}× · +${pnl}`);
          record({ pnl, multiplier: won / roundBet });
          pf.consume(`crash=${target}× cashout=${cashoutAt}×`);
          recordMyBet({ game: "crash", bet: roundBet, multiplier: cashoutAt, payout: won });
          pushMultiplierHistory("crash", target);
          fxRef.current?.burst({ count: 60, kind: "confetti", speed: 8 });
          try { sfxCashout(); } catch { /* noop */ }
          stop(); finish(pnl); return;
        }
        if (m >= target) {
          setMult(target); setCrashAt(target); setState("crashed");
          setMsg(`💥 ক্র্যাশ @ ${target}× · -${roundBet}`);
          record({ pnl: -roundBet, multiplier: 0 });
          pf.consume(`crash=${target}× (bust)`);
          recordMyBet({ game: "crash", bet: roundBet, multiplier: 0, payout: 0 });
          pushMultiplierHistory("crash", target);
          fxRef.current?.burst({ count: 40, kind: "smoke", color: "#ff4d4d", speed: 5 });
          try { sfxBust(); } catch { /* noop */ }
          stop(); finish(-roundBet); return;
        }
        setMult(m); rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      // Manual mode: expose cashout via ref pattern — see manual cashout below.
      manualResolveRef.current = finishR;
    });
  }, [pf, placeBet, credit, edge, record]);

  const manualCashout = () => {
    if (state !== "flying") return;
    stop();
    const cashMult = mult;
    const won = Math.floor(bet * cashMult * (1 - edge)); credit(won);
    setState("cashed");
    setCrashAt(targetRef.current);
    const pnl = won - bet;
    setMsg(`🎉 ক্যাশআউট @ ${cashMult}× · +${pnl}`);
    record({ pnl, multiplier: won / bet });
    pf.consume(`crash=${targetRef.current}× cashout=${cashMult}×`);
    recordMyBet({ game: "crash", bet, multiplier: cashMult, payout: won });
    pushMultiplierHistory("crash", targetRef.current);
    fxRef.current?.burst({ count: 70, kind: "confetti", speed: 8 });
    try { sfxCashout(); } catch { /* noop */ }
    manualResolveRef.current?.({ pnl });
    manualResolveRef.current = null;
  };

  const auto = useAutoBet({
    runRound: (b) => runRound(b, autoCashout),
    baseBet: bet,
    delayMs: 1200,
  });

  const reset = () => { setState("idle"); setMsg(""); setMult(1.0); setCrashAt(null); };

  const isFlying = state === "flying";
  const statusColor = state === "crashed" ? "text-[#ff4d4d]" : state === "cashed" ? "text-[#ffd166]" : isFlying ? "text-[#00ff88]" : "text-white/50";
  const frameGlow =
    state === "crashed" ? "shadow-[0_0_60px_-10px_rgba(255,77,77,0.45)] border-[#3a1414]" :
    state === "cashed" ? "shadow-[0_0_60px_-10px_rgba(255,209,102,0.5)] border-[#3a2f14]" :
    isFlying ? "shadow-[0_0_70px_-10px_rgba(0,255,136,0.45)] border-[#143a1f]" :
    "border-[#1a3321]";

  return (
    <GameShell title="Crash" emoji="🚀" gameKey="crash">
      <GameFrame>
        <div className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border bg-gradient-to-b from-[#0a120b] via-[#070f08] to-[#020604] p-6 min-h-[320px] transition-shadow duration-500 ${frameGlow}`}>
          <CrashChart multiplier={mult} active={isFlying} state={state} />
          <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,255,136,0.08),transparent_60%)]" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <MultiplierHUD value={mult} state={state} />
            <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] ${statusColor}`}>
              {isFlying && <><Rocket className="h-3.5 w-3.5 animate-rocket-idle" /> উড়ছে…</>}
              {state === "crashed" && <>💥 বাস্ট @ {crashAt}×</>}
              {state === "cashed" && <>💰 ক্যাশ আউট · বাস্ট ছিল @ {crashAt}×</>}
              {state === "idle" && <>বাজি রাখুন — লাফ দাও</>}
            </div>
          </div>
          <ParticleLayer ref={fxRef} />
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={isFlying || auto.running} />
          <div className="rounded-xl border border-white/5 bg-black/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">সম্ভাব্য পেআউট</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-2xl font-black tabular-nums text-[#00ff88] drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                ৳ {Math.floor(bet * mult).toLocaleString("en-BD")}
              </span>
              <span className="text-xs font-bold text-white/40 tabular-nums">@ {mult.toFixed(2)}×</span>
            </div>
          </div>
          <BetControls bet={bet} setBet={setBet} disabled={isFlying || auto.running} />

          {mode === "auto" && (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Auto Cashout @</span>
              <input
                type="number" step="0.01" min={1.01} value={autoCashout} disabled={auto.running}
                onChange={(e) => setAutoCashout(Math.max(1.01, Number(e.target.value) || 1.01))}
                className="rounded-md border border-[#1a3321] bg-[#112216] px-2 py-1.5 text-sm font-bold text-white outline-none focus:border-[#00ff88] disabled:opacity-60"
              />
            </label>
          )}

          {mode === "manual" ? (
            isFlying ? (
              <PrimaryButton onClick={manualCashout} tone="gold">
                ক্যাশআউট · {Math.floor(bet * mult).toLocaleString("en-BD")}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={state === "idle" ? () => runRound(bet) : reset}>
                {state === "idle" ? `বাজি রাখুন · ${bet}` : "আবার খেলুন"}
              </PrimaryButton>
            )
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready && !isFlying} />
          )}
          {msg && <div className={`animate-fade-in text-center text-sm font-bold ${statusColor}`}>{msg}</div>}
          <ProvablyFairPanel pf={pf} gameKey="crash" />
        </ControlsPanel>
      </GameFrame>
      <div className="mt-3 flex items-center justify-between gap-3">
        <MultiplierHistoryStrip gameKey="crash" />
        <div className={`hidden items-center gap-2 rounded-full border border-white/5 bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] sm:inline-flex ${statusColor}`}>
          <span className={`h-2 w-2 rounded-full ${isFlying ? "bg-[#00ff88] animate-pulse" : state === "crashed" ? "bg-[#ff4d4d]" : state === "cashed" ? "bg-[#ffd166]" : "bg-white/40"}`} />
          {isFlying ? "in flight" : state === "crashed" ? "busted" : state === "cashed" ? "cashed out" : "ready"}
        </div>
      </div>
      <StatsBar stats={stats} onReset={resetStats} />
    </GameShell>
  );
}
