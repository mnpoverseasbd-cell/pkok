import { recordMyBet } from "@/lib/liveFeed";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameShell, BetControls, GameFrame, ControlsPanel, PrimaryButton, MultDisplay } from "@/components/games/GameShell";
import { useGameConfig } from "@/hooks/useGameConfig";
import { StatsBar } from "@/components/games/StatsBar";
import { useDemoWallet } from "@/hooks/useDemoWallet";
import { useGameStats } from "@/hooks/useGameStats";
import { useProvablyFair } from "@/hooks/useProvablyFair";
import { useAutoBet } from "@/hooks/useAutoBet";
import { ProvablyFairPanel } from "@/components/games/ProvablyFairPanel";
import { AutoBetPanel, ModeTabs } from "@/components/games/AutoBetPanel";
import { fairCrash } from "@/lib/provablyFair";

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
          stop(); finish(pnl); return;
        }
        if (m >= target) {
          setMult(target); setCrashAt(target); setState("crashed");
          setMsg(`💥 ক্র্যাশ @ ${target}× · -${roundBet}`);
          record({ pnl: -roundBet, multiplier: 0 });
          pf.consume(`crash=${target}× (bust)`);
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
  const color = state === "crashed" ? "text-[#ff4444]" : state === "cashed" ? "text-[#00ff88]" : isFlying ? "text-[#00ff88]" : "text-white";
  const glow = state === "crashed" ? "shadow-[0_0_40px_rgba(255,68,68,0.4)]" : isFlying || state === "cashed" ? "shadow-[0_0_50px_rgba(0,255,136,0.4)]" : "";

  return (
    <GameShell title="Crash" emoji="🚀" gameKey="crash">
      <StatsBar stats={stats} onReset={resetStats} />
      <GameFrame>
        <div className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl border border-[#1a3321] bg-gradient-to-b from-[#0a120b] to-[#050a06] p-8 min-h-[280px] ${glow}`}>
          <div className={`text-8xl font-black tabular-nums drop-shadow-[0_0_20px_currentColor] ${color} ${isFlying ? "animate-pulse" : ""}`}>
            {mult.toFixed(2)}×
          </div>
          <div className="absolute bottom-3 left-4 text-xs font-bold uppercase tracking-widest text-white/50">
            {isFlying && "🚀 উড়ছে..."}
            {state === "crashed" && `বাস্ট @ ${crashAt}×`}
            {state === "cashed" && `ক্যাশ আউট (বাস্ট ছিল @ ${crashAt}×)`}
            {state === "idle" && "বাজি রাখুন"}
          </div>
        </div>
        <ControlsPanel>
          <ModeTabs mode={mode} setMode={setMode} disabled={isFlying || auto.running} />
          <MultDisplay
            label="বর্তমান"
            value={`${mult.toFixed(2)}×`}
            sub={isFlying ? <>ক্যাশআউট মূল্য: <span className="text-[#00ff88]">{Math.floor(bet * mult)}</span></> : "উড়ানোর জন্য বাজি রাখুন"}
          />
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
                ক্যাশআউট · {Math.floor(bet * mult)}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={state === "idle" ? () => runRound(bet) : reset}>
                {state === "idle" ? `বাজি রাখুন · ${bet}` : "আবার খেলুন"}
              </PrimaryButton>
            )
          ) : (
            <AutoBetPanel auto={auto} canStart={pf.ready && !isFlying} />
          )}
          {msg && <div className={`animate-fade-in text-center text-sm font-bold ${color}`}>{msg}</div>}
          <ProvablyFairPanel pf={pf} gameKey="crash" />
        </ControlsPanel>
      </GameFrame>
    </GameShell>
  );
}
