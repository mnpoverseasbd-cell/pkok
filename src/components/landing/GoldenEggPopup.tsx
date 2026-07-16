import { useEffect, useMemo, useState } from "react";
import { X, Clock, HelpCircle, Egg, Crown, Gift, Play, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TOTAL_SECONDS = 24 * 60 * 60; // daily reset

function useCountdown() {
  const [remaining, setRemaining] = useState(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(24, 0, 0, 0);
    return Math.floor((end.getTime() - now.getTime()) / 1000);
  });

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : TOTAL_SECONDS));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  return { h, m, s };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export function GoldenEggPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const { h, m, s } = useCountdown();

  useEffect(() => {
    if (!user) return;
    const key = `golden_egg_popup_${user.id}`;
    if (sessionStorage.getItem(key)) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, [user]);

  const close = () => {
    if (user) sessionStorage.setItem(`golden_egg_popup_${user.id}`, "1");
    setOpen(false);
  };

  const eggs = useMemo(() => Array.from({ length: 9 }), []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={close}
    >
      <div
        className="relative w-full max-w-[560px] my-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Red banner "পুরস্কার" with crown */}
        <div className="relative z-10 mx-auto -mb-4 w-[220px]">
          <Crown
            className="absolute left-1/2 -top-5 h-8 w-8 -translate-x-1/2 text-[#f5c542] drop-shadow-[0_2px_6px_rgba(245,197,66,0.7)]"
            fill="#f5c542"
            strokeWidth={1.2}
          />
          <div className="relative rounded-md bg-gradient-to-b from-[#e94560] to-[#a3122c] px-6 py-2 text-center shadow-[0_6px_20px_rgba(233,69,96,0.5)] border border-[#ffb3c1]/40">
            <span className="font-display text-lg font-black tracking-wide text-white drop-shadow">পুরস্কার</span>
          </div>
          <div className="absolute -left-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-[#7a0a20]" />
          <div className="absolute -right-3 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-[#7a0a20]" />
        </div>


        {/* Card */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-gold)]/40 bg-gradient-to-b from-[#0f2a1a] via-[#0b1f14] to-[#081510] p-3 pt-7 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] sm:p-5 sm:pt-8">
          {/* Close */}
          <button
            onClick={close}
            aria-label="close"
            className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/60 text-[var(--neon-gold)] transition-colors hover:bg-[var(--neon-pink)] hover:text-white sm:right-3 sm:top-3 sm:h-9 sm:w-9"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>

          {/* Title with gift + play icons */}
          <div className="flex items-center justify-center gap-2">
            <Gift className="h-5 w-5 text-[#f5c542] drop-shadow sm:h-6 sm:w-6" />
            <button aria-label="play" className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-b from-[#ff8a5b] to-[#c94317] shadow-[0_2px_8px_rgba(201,67,23,0.6)] sm:h-7 sm:w-7">
              <Play className="h-3 w-3 fill-white text-white sm:h-3.5 sm:w-3.5" />
            </button>
          </div>
          <h3 className="mt-2 text-center font-display text-[15px] font-black leading-snug text-[var(--neon-gold)] drop-shadow sm:text-xl">
            প্রতিদিন লগইন করুন: গোল্ডেন এগ ভেঙে জিতুন
          </h3>
          <p className="mt-1 text-center font-display text-lg font-black text-white sm:text-2xl">
            ৭,৭৭৭,৭৭৭ <span className="text-[var(--neon-gold)]">টাকা</span>
          </p>

          {/* Countdown */}
          <div className="mt-3 flex flex-col items-center gap-2 text-white sm:mt-4 sm:flex-row sm:justify-center sm:gap-3">
            <div className="flex shrink-0 items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--neon-gold)] sm:h-5 sm:w-5" />
              <span className="text-xs text-white/80 sm:text-sm">অবশিষ্ট সময়</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { v: pad(h), l: "ঘন্টা" },
                { v: pad(m), l: "মিনিট" },
                { v: pad(s), l: "সেকেন্ড" },
              ].map((t, i) => (
                <div key={t.l} className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <div className="grid min-w-[34px] place-items-center rounded-md border border-white/15 bg-black/60 px-1.5 py-1 font-display text-base font-bold text-white tabular-nums sm:min-w-[38px] sm:px-2 sm:text-lg">
                      {t.v}
                    </div>
                    <span className="mt-0.5 text-[10px] text-white/60">{t.l}</span>
                  </div>
                  {i < 2 && <span className="pb-4 text-white/40">:</span>}
                </div>
              ))}
              <button aria-label="help" className="ml-1 shrink-0 text-white/50 hover:text-white">
                <HelpCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Egg grid */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5 sm:mt-4 sm:gap-3 sm:p-4">
            {eggs.map((_, i) => (
              <button
                key={i}
                onClick={() => setClaimed(true)}
                className="group relative grid aspect-square place-items-center rounded-lg bg-gradient-to-b from-[#1a2e22] to-[#0b1f14] transition-transform hover:scale-105"
              >
                <div className="absolute inset-x-2 bottom-1 h-1.5 rounded-full bg-[#7a0a20] shadow-[0_2px_6px_rgba(233,69,96,0.5)] sm:inset-x-3 sm:h-2" />
                <Egg
                  className="relative h-9 w-9 text-[#f5c542] drop-shadow-[0_0_10px_rgba(245,197,66,0.6)] sm:h-12 sm:w-12"
                  fill="url(#gold-egg)"
                  strokeWidth={1}
                />
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <linearGradient id="gold-egg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fff6b0" />
                      <stop offset="45%" stopColor="#f5c542" />
                      <stop offset="100%" stopColor="#a67518" />
                    </linearGradient>
                  </defs>
                </svg>
              </button>
            ))}
          </div>


          {/* Claim button */}
          <div className="mt-5 flex justify-center">
            <button
              onClick={() => setClaimed(true)}
              className="rounded-full bg-gradient-to-b from-[#ffd76a] via-[#f5b93a] to-[#c98a12] px-10 py-2.5 font-display text-base font-black text-[#3a1e00] shadow-[0_6px_20px_rgba(245,185,58,0.45)] transition-transform hover:scale-[1.02]"
            >
              {claimed ? "দাবি করা হয়েছে" : "দাবি করুন"}
            </button>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="h-2 w-full overflow-hidden rounded-full border border-white/10 bg-black/50">
              <div className="h-full w-[0%] bg-gradient-to-r from-[var(--neon-gold)] to-[var(--neon-pink)]" />
            </div>
            <div className="mt-1 text-right text-xs text-white/60">0.00%</div>
          </div>

          {/* Recent winners */}
          <div className="mt-4 rounded-xl border border-[var(--neon-gold)]/30 bg-black/50 p-2">
            <ul className="divide-y divide-white/5">
              {[
                { u: "18******1", a: "1.70" },
                { u: "17******1", a: "1.70" },
                { u: "19******0", a: "1.70" },
              ].map((w) => (
                <li key={w.u} className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-[#f5c542]" />
                    <span className="text-white/85">{w.u}</span>
                  </div>
                  <span className="font-semibold text-[var(--neon-gold)]">৳ {w.a}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
