import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  state: "idle" | "flying" | "crashed" | "cashed";
  suffix?: string;
  className?: string;
};

/**
 * AAA multiplier display.
 * - GPU-only animation (transform + opacity + text-shadow).
 * - Color reacts to game state; crash triggers a shake; cashout pops.
 * - Tabular numeric font for zero layout shift.
 */
export function MultiplierHUD({ value, state, suffix = "×", className }: Props) {
  const [shake, setShake] = useState(false);
  const [pop, setPop] = useState(false);

  useEffect(() => {
    if (state === "crashed") {
      setShake(true);
      const t = setTimeout(() => setShake(false), 480);
      return () => clearTimeout(t);
    }
    if (state === "cashed") {
      setPop(true);
      const t = setTimeout(() => setPop(false), 500);
      return () => clearTimeout(t);
    }
  }, [state]);

  const color =
    state === "crashed" ? "text-[#ff4d4d]" :
    state === "cashed" ? "text-[#ffd166]" :
    state === "flying" ? "text-[#00ff88]" :
    "text-white";

  const glow =
    state === "crashed" ? "drop-shadow-[0_0_40px_rgba(255,77,77,0.6)]" :
    state === "cashed" ? "drop-shadow-[0_0_40px_rgba(255,209,102,0.6)]" :
    state === "flying" ? "drop-shadow-[0_0_40px_rgba(0,255,136,0.55)]" :
    "drop-shadow-[0_0_18px_rgba(255,255,255,0.15)]";

  return (
    <div
      className={cn(
        "relative flex select-none flex-col items-center justify-center transition-transform duration-300 will-change-transform",
        shake && "animate-crash-shake",
        pop && "animate-cash-pop",
        className,
      )}
    >
      <div
        className={cn(
          "font-black tabular-nums leading-none tracking-tight",
          "text-[clamp(3.5rem,14vw,8rem)]",
          color,
          glow,
        )}
        style={{ transform: state === "flying" ? "scale(1.02)" : "scale(1)", transition: "transform 300ms cubic-bezier(.2,.9,.3,1.4)" }}
      >
        {value.toFixed(2)}
        <span className="text-[0.55em] opacity-70">{suffix}</span>
      </div>
    </div>
  );
}
