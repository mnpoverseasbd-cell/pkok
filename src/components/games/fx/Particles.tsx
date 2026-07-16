import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type ParticleBurstHandle = {
  burst: (opts?: { x?: number; y?: number; color?: string; count?: number; speed?: number; kind?: "spark" | "confetti" | "smoke" }) => void;
};

type P = {
  x: number; y: number; vx: number; vy: number; life: number; max: number;
  size: number; color: string; kind: "spark" | "confetti" | "smoke"; rot: number; vr: number;
};

/**
 * GPU-friendly canvas particle system.
 * Fixed pool, transform+globalAlpha only, no layout thrash.
 * Imperative burst() from parent via ref.
 */
export const ParticleLayer = forwardRef<ParticleBurstHandle, { className?: string }>(function ParticleLayer(
  { className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<P[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => {
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      runningRef.current = false;
    };
  }, []);

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    const arr = particlesRef.current;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life += 1 / 60;
      p.vy += p.kind === "smoke" ? -0.02 : 0.35;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      const t = p.life / p.max;
      if (t >= 1) { arr.splice(i, 1); continue; }
      const alpha = 1 - t;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.kind === "confetti") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else if (p.kind === "smoke") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + t * 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    if (arr.length > 0) {
      rafRef.current = requestAnimationFrame(loop);
    } else {
      runningRef.current = false;
      rafRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    burst: (opts) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const x = opts?.x ?? w / 2;
      const y = opts?.y ?? h / 2;
      const count = opts?.count ?? 48;
      const speed = opts?.speed ?? 6;
      const kind = opts?.kind ?? "spark";
      const palette = opts?.color
        ? [opts.color]
        : kind === "confetti"
          ? ["#00ff88", "#ffd700", "#ff4dd2", "#4dc9ff", "#ffffff"]
          : ["#ffffff", "#ffd700", "#00ff88"];
      for (let i = 0; i < count; i++) {
        const angle = kind === "confetti" ? -Math.PI / 2 + (Math.random() - 0.5) * Math.PI : Math.random() * Math.PI * 2;
        const v = speed * (0.4 + Math.random() * 0.9);
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * v,
          vy: Math.sin(angle) * v - (kind === "confetti" ? 3 : 0),
          life: 0,
          max: 0.9 + Math.random() * 0.8,
          size: kind === "confetti" ? 6 + Math.random() * 5 : kind === "smoke" ? 6 + Math.random() * 4 : 2 + Math.random() * 3,
          color: palette[Math.floor(Math.random() * palette.length)],
          kind,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.4,
        });
      }
      if (!runningRef.current) {
        runningRef.current = true;
        rafRef.current = requestAnimationFrame(loop);
      }
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      aria-hidden
    />
  );
});
