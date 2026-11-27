import { useEffect, useRef } from "react";

type Phase = "waiting" | "flying" | "crashed";

export type SkyCashoutBadge = {
  id: number;
  label: string;
  mult: number;
  createdAt: number;
};

/**
 * Exact Spribe Aviator Canvas Renderer:
 * - Pure black (#000000) stage with rotating dark sunburst rays radiating from (0, h)
 * - Dynamic tier radial aurora behind multiplier: cyan-blue (<2x), violet (2-9.99x), magenta (>=10x)
 * - Parked crimson biplane at bottom-left during Waiting; smooth climbing curve + red gradient drop-fill while Flying
 * - Steep exit fly-away off top-right on Crash
 */
export function AviatorCanvas({
  multiplier,
  phase,
  badges = [],
  animationsEnabled = true,
}: {
  multiplier: number;
  phase: Phase;
  badges?: SkyCashoutBadge[];
  animationsEnabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startRef = useRef<number>(0);
  const crashTimeRef = useRef<number>(0);
  const lastFlyElapsedRef = useRef<number>(0);
  const phaseRef = useRef(phase);
  const multRef = useRef(multiplier);
  const badgesRef = useRef(badges);
  const animRef = useRef(animationsEnabled);
  const prevPhaseRef = useRef<Phase>(phase);

  if (phase !== prevPhaseRef.current) {
    if (phase === "flying") {
      startRef.current = typeof performance !== "undefined" ? performance.now() : 0;
      lastFlyElapsedRef.current = 0;
    } else if (phase === "crashed" && prevPhaseRef.current === "flying") {
      const now = typeof performance !== "undefined" ? performance.now() : 0;
      crashTimeRef.current = now;
      lastFlyElapsedRef.current = Math.max(0.08, (now - startRef.current) / 1000);
    }
    prevPhaseRef.current = phase;
  }

  phaseRef.current = phase;
  multRef.current = multiplier;
  badgesRef.current = badges;
  animRef.current = animationsEnabled;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;

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

    const drawSpribeBiplane = (
      x: number,
      y: number,
      angleRad: number,
      nowMs: number,
      scale = 1.45,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleRad);
      ctx.scale(scale, scale);

      // Crimson glow aura around plane
      ctx.shadowColor = "rgba(229, 5, 57, 0.7)";
      ctx.shadowBlur = 18;

      // Tail fin + main fuselage
      ctx.fillStyle = "#e50539";
      ctx.beginPath();
      ctx.moveTo(-30, 3);
      ctx.quadraticCurveTo(-34, -12, -25, -16);
      ctx.lineTo(-16, -4);
      ctx.lineTo(15, -7);
      ctx.quadraticCurveTo(30, -6, 33, 1);
      ctx.quadraticCurveTo(29, 10, 12, 9);
      ctx.lineTo(-20, 6);
      ctx.closePath();
      ctx.fill();

      // Lower shaded belly & wheel strut
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#9d0326";
      ctx.beginPath();
      ctx.moveTo(-15, 4);
      ctx.lineTo(22, 4);
      ctx.lineTo(14, 10);
      ctx.lineTo(-11, 8);
      ctx.closePath();
      ctx.fill();

      // Upper biplane wing
      ctx.fillStyle = "#ff1f53";
      ctx.beginPath();
      ctx.ellipse(2, -11, 15, 3.6, -0.06, 0, Math.PI * 2);
      ctx.fill();

      // Wing struts
      ctx.strokeStyle = "#9d0326";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(-2, -3);
      ctx.moveTo(8, -8);
      ctx.lineTo(9, -3);
      ctx.stroke();

      // Cockpit dark visor
      ctx.fillStyle = "#141518";
      ctx.beginPath();
      ctx.ellipse(8, -5, 6.2, 2.6, 0.08, 0, Math.PI * 2);
      ctx.fill();

      // Tail 'X' badge matching Spribe Aviator
      ctx.strokeStyle = "#141518";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-25, -11);
      ctx.lineTo(-19, -5);
      ctx.moveTo(-19, -11);
      ctx.lineTo(-25, -5);
      ctx.stroke();

      // Landing gear wheel
      ctx.fillStyle = "#1f2024";
      ctx.beginPath();
      ctx.arc(8, 12, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e50539";
      ctx.beginPath();
      ctx.arc(8, 12, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Spinning propeller blur
      const bladeSpan = 7 + Math.abs(Math.sin(nowMs * 0.06)) * 13;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(34, -bladeSpan);
      ctx.lineTo(34, bladeSpan);
      ctx.stroke();

      ctx.strokeStyle = "#e50539";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(34, -bladeSpan * 0.9);
      ctx.lineTo(34, bladeSpan * 0.9);
      ctx.stroke();

      ctx.fillStyle = "#e50539";
      ctx.beginPath();
      ctx.arc(33, 0.5, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (w <= 0 || h <= 0) {
        raf = requestAnimationFrame(render);
        return;
      }

      const s = phaseRef.current;
      const mNow = multRef.current;
      const allowAnim = animRef.current;

      // 1. Pure black base & rotating sunburst fan rays from bottom-left (0, h)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      const rayCount = 26;
      const rotBase = allowAnim ? (now * 0.00005) % (Math.PI * 2) : 0;
      const maxR = Math.hypot(w, h) * 1.25;
      for (let i = 0; i < rayCount; i++) {
        if (i % 2 === 1) continue;
        const a0 = rotBase + (i / rayCount) * Math.PI * 2;
        const a1 = a0 + (1 / rayCount) * Math.PI * 2;
        ctx.fillStyle = "#0e0e10";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(Math.cos(a0) * maxR, h + Math.sin(a0) * maxR);
        ctx.lineTo(Math.cos(a1) * maxR, h + Math.sin(a1) * maxR);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Dynamic tier aurora glow behind multiplier (teal-blue <2x, purple 2-9.99x, magenta >=10x)
      if (s === "flying" || (s === "crashed" && now - crashTimeRef.current < 900)) {
        const fade = s === "crashed" ? Math.max(0, 1 - (now - crashTimeRef.current) / 900) : 1;
        const glowColor =
          mNow >= 10
            ? `rgba(192, 23, 180, ${0.42 * fade})`
            : mNow >= 2
              ? `rgba(145, 62, 248, ${0.38 * fade})`
              : `rgba(10, 110, 175, ${0.36 * fade})`;
        const halo = ctx.createRadialGradient(w * 0.5, h * 0.48, 12, w * 0.5, h * 0.48, w * 0.38);
        halo.addColorStop(0, glowColor);
        halo.addColorStop(0.55, glowColor.replace(/[\d.]+\)$/, `${0.14 * fade})`));
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);
      }

      // 3. Parked or flying plane & curve
      if (s === "waiting") {
        // Parked Spribe plane at bottom-left angled ~15° upward
        drawSpribeBiplane(54, h - 26, -0.22, allowAnim ? now : 0, 1.15);
      } else if (s === "flying" || s === "crashed") {
        const elapsed =
          s === "flying"
            ? Math.max(0.02, (now - startRef.current) / 1000)
            : Math.max(0.05, lastFlyElapsedRef.current);
        const climb = Math.min(1, elapsed / 3.4);
        const bobX = allowAnim && s === "flying" && climb > 0.85 ? Math.sin(now * 0.0022) * 10 : 0;
        const bobY = allowAnim && s === "flying" && climb > 0.85 ? Math.cos(now * 0.0028) * 12 : 0;

        const startX = 0;
        const startY = h;
        const endX = climb * (w * 0.78) + bobX;
        const endY = h - Math.pow(climb, 1.18) * (h * 0.72) + bobY;
        const ctrlX = endX * 0.58;
        const ctrlY = h - (h - endY) * 0.14;

        if (s === "flying") {
          // Red under-curve area fill with crisp vertical right drop edge
          const fillGrad = ctx.createLinearGradient(0, endY, 0, h);
          fillGrad.addColorStop(0, "rgba(229, 5, 57, 0.50)");
          fillGrad.addColorStop(1, "rgba(140, 0, 25, 0.24)");
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineTo(endX, h);
          ctx.closePath();
          ctx.fillStyle = fillGrad;
          ctx.fill();

          // Bright crimson flight stroke
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e50539";
          ctx.shadowColor = "#e50539";
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.shadowBlur = 0;

          const angle = Math.atan2(endY - ctrlY, Math.max(1, endX - ctrlX)) * 0.45;
          drawSpribeBiplane(endX + 6, endY - 12, angle, allowAnim ? now : 0, 1.45);
        } else {
          // Steep fly-away exit animation when crashed
          const flyOut = Math.max(0, (now - crashTimeRef.current) / 850);
          if (flyOut < 1.2) {
            drawSpribeBiplane(endX + flyOut * 380, endY - flyOut * 210, -0.45, now, 1.45);
          }
        }
      }

      // 4. Floating cashout badges
      for (const b of badgesRef.current) {
        const age = (now - b.createdAt) / 1000;
        if (age > 2.2) continue;
        const alpha = Math.max(0, 1 - age / 2.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bx = w * 0.5;
        const by = 44 - age * 18;
        ctx.fillStyle = "#28a909";
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(bx - 82, by - 12, 164, 24, 999);
          ctx.fill();
        } else {
          ctx.fillRect(bx - 82, by - 12, 164, 24);
        }
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 11px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.label, bx, by + 4);
        ctx.restore();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
