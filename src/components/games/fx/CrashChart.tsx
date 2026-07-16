import { useEffect, useRef } from "react";

type Props = {
  /** Current multiplier value (>= 1). */
  multiplier: number;
  /** Whether the round is actively flying (draw growing curve). */
  active: boolean;
  /** Round state — controls color scheme. */
  state: "idle" | "flying" | "crashed" | "cashed";
  className?: string;
};

/**
 * Reusable crash-curve canvas.
 * Draws a parabolic multiplier trail with a bright rocket head and glow.
 * Pure canvas, transform-friendly, no per-frame React state.
 */
export function CrashChart({ multiplier, active, state, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataRef = useRef<{ t: number; m: number }[]>([]);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const stateRef = useRef(state);
  const multRef = useRef(multiplier);
  const activeRef = useRef(active);

  stateRef.current = state;
  multRef.current = multiplier;
  activeRef.current = active;

  // Reset trail when a new round starts flying
  useEffect(() => {
    if (state === "flying" && dataRef.current.length === 0) {
      startRef.current = performance.now();
    }
    if (state === "idle") {
      dataRef.current = [];
    }
  }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const render = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        const x = (w / 6) * i;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      // Push sample
      const s = stateRef.current;
      if (s === "flying" || s === "cashed" || s === "crashed") {
        const t = (performance.now() - startRef.current) / 1000;
        const last = dataRef.current[dataRef.current.length - 1];
        if (!last || t - last.t > 1 / 60) {
          if (s === "flying") {
            dataRef.current.push({ t, m: multRef.current });
          }
        }
      }

      const arr = dataRef.current;
      if (arr.length > 1) {
        const maxT = Math.max(2, arr[arr.length - 1].t);
        const maxM = Math.max(2, arr[arr.length - 1].m);
        const pad = 24;
        const xFor = (t: number) => pad + (t / maxT) * (w - pad * 2);
        const yFor = (m: number) => h - pad - ((m - 1) / (maxM - 1 || 1)) * (h - pad * 2);

        const isBust = s === "crashed";
        const isCash = s === "cashed";
        const stroke = isBust ? "#ff4d4d" : isCash ? "#ffd166" : "#00ff88";
        const fill = isBust
          ? "rgba(255, 77, 77, 0.18)"
          : isCash
            ? "rgba(255, 209, 102, 0.18)"
            : "rgba(0, 255, 136, 0.16)";

        // Fill under curve
        ctx.beginPath();
        ctx.moveTo(xFor(arr[0].t), h - pad);
        for (const p of arr) ctx.lineTo(xFor(p.t), yFor(p.m));
        ctx.lineTo(xFor(arr[arr.length - 1].t), h - pad);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();

        // Curve
        ctx.beginPath();
        ctx.moveTo(xFor(arr[0].t), yFor(arr[0].m));
        for (const p of arr) ctx.lineTo(xFor(p.t), yFor(p.m));
        ctx.lineWidth = 3;
        ctx.strokeStyle = stroke;
        ctx.shadowColor = stroke;
        ctx.shadowBlur = 18;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Rocket head
        const head = arr[arr.length - 1];
        const hx = xFor(head.t);
        const hy = yFor(head.m);
        ctx.beginPath();
        ctx.arc(hx, hy, 7, 0, Math.PI * 2);
        ctx.fillStyle = stroke;
        ctx.shadowColor = stroke;
        ctx.shadowBlur = 24;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className ?? ""}`}
      aria-hidden
    />
  );
}
