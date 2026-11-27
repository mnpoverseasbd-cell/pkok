import { useEffect, useRef } from "react";

type Phase = "waiting" | "flying" | "crashed";

export type SkyCashoutBadge = {
  id: number;
  label: string;
  mult: number;
  createdAt: number;
};

/**
 * Spribe Aviator Canvas:
 * - Rotating dark sunburst fan beams from bottom-left origin
 * - Dynamic radial aurora halo behind multiplier (cyan <2x, purple 2-10x, magenta >=10x)
 * - Smooth crimson curve starting cleanly from bottom-left (0, h) with red area fill
 * - Classic Spribe crimson propeller biplane pitched cleanly at curve tip
 */
export function AviatorCanvas({
  multiplier,
  phase,
  badges = [],
}: {
  multiplier: number;
  phase: Phase;
  badges?: SkyCashoutBadge[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const startRef = useRef<number>(0);
  const crashTimeRef = useRef<number>(0);
  const lastFlyElapsedRef = useRef<number>(0);
  const phaseRef = useRef(phase);
  const multRef = useRef(multiplier);
  const badgesRef = useRef(badges);
  const prevPhaseRef = useRef<Phase>(phase);

  if (phase !== prevPhaseRef.current) {
    if (phase === "flying") {
      startRef.current = typeof performance !== "undefined" ? performance.now() : 0;
      lastFlyElapsedRef.current = 0;
    } else if (phase === "crashed" && prevPhaseRef.current === "flying") {
      const now = typeof performance !== "undefined" ? performance.now() : 0;
      crashTimeRef.current = now;
      lastFlyElapsedRef.current = Math.max(0.05, (now - startRef.current) / 1000);
    }
    prevPhaseRef.current = phase;
  }

  phaseRef.current = phase;
  multRef.current = multiplier;
  badgesRef.current = badges;

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

    const drawSpribePlane = (x: number, y: number, angleRad: number, nowMs: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleRad);
      ctx.scale(1.25, 1.25);

      // Glow aura
      ctx.shadowColor = "rgba(229, 29, 72, 0.75)";
      ctx.shadowBlur = 16;

      // Tail fin + fuselage
      ctx.fillStyle = "#e5093a";
      ctx.beginPath();
      ctx.moveTo(-28, 3);
      ctx.quadraticCurveTo(-32, -11, -24, -15);
      ctx.lineTo(-15, -4);
      ctx.lineTo(14, -7);
      ctx.quadraticCurveTo(28, -6, 31, 1);
      ctx.quadraticCurveTo(27, 9, 12, 9);
      ctx.lineTo(-19, 6);
      ctx.closePath();
      ctx.fill();

      // Deeper crimson belly & engine cowling
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#9f072a";
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(20, 4);
      ctx.lineTo(13, 10);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();

      // Upper wing + scarf/cockpit accent
      ctx.fillStyle = "#fb1e4e";
      ctx.beginPath();
      ctx.ellipse(2, -10, 14, 3.6, -0.08, 0, Math.PI * 2);
      ctx.fill();

      // Cockpit dark visor
      ctx.fillStyle = "#18181b";
      ctx.beginPath();
      ctx.ellipse(8, -4.5, 6, 2.5, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Tail 'X' emblem
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-23, -10);
      ctx.lineTo(-17, -4);
      ctx.moveTo(-17, -10);
      ctx.lineTo(-23, -4);
      ctx.stroke();

      // Spinning propeller blades + red spinner cone
      const propSpan = 6 + Math.abs(Math.sin(nowMs * 0.055)) * 13;
      ctx.strokeStyle = "rgba(244, 63, 94, 0.9)";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(32, -propSpan);
      ctx.lineTo(32, propSpan);
      ctx.stroke();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(32, -propSpan * 0.85);
      ctx.lineTo(32, propSpan * 0.85);
      ctx.stroke();

      ctx.fillStyle = "#e5093a";
      ctx.beginPath();
      ctx.arc(31, 0.5, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const s = phaseRef.current;
      const mNow = multRef.current;

      // 1. Spribe rotating sunburst fan beams from bottom-left (0, h)
      const rayCount = 28;
      const rotBase = (now * 0.000055) % (Math.PI * 2);
      const maxR = Math.hypot(w, h) * 1.2;
      for (let i = 0; i < rayCount; i++) {
        if (i % 2 === 1) continue;
        const a0 = rotBase + (i / rayCount) * Math.PI * 2;
        const a1 = a0 + (1 / rayCount) * Math.PI * 2;
        ctx.fillStyle = "rgba(255, 255, 255, 0.028)";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(Math.cos(a0) * maxR, h + Math.sin(a0) * maxR);
        ctx.lineTo(Math.cos(a1) * maxR, h + Math.sin(a1) * maxR);
        ctx.closePath();
        ctx.fill();
      }

      // 2. Dynamic center radial aurora behind multiplier during flight
      if (s === "flying") {
        const auroraColor =
          mNow >= 10
            ? "rgba(219, 39, 119, 0.30)"
            : mNow >= 2
              ? "rgba(147, 51, 234, 0.28)"
              : "rgba(14, 165, 233, 0.22)";
        const halo = ctx.createRadialGradient(w * 0.48, h * 0.48, 10, w * 0.48, h * 0.48, w * 0.42);
        halo.addColorStop(0, auroraColor);
        halo.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);
      }

      // 3. Axis edge pulse dots while flying
      if (s === "flying") {
        const elapsed = Math.max(0, (now - startRef.current) / 1000);
        const driftX = (elapsed * 42) % 44;
        const driftY = (elapsed * 30) % 38;
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        for (let bx = 44 - driftX; bx < w - 16; bx += 44) {
          ctx.beginPath();
          ctx.arc(bx, h - 6, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
        for (let by = h - 38 + driftY; by > 16; by -= 38) {
          ctx.beginPath();
          ctx.arc(8, by, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Flight curve & plane
      if (s === "waiting") {
        drawSpribePlane(48, h - 24, -0.05, now);
      } else if (s === "flying" || s === "crashed") {
        const elapsed =
          s === "flying"
            ? Math.max(0.01, (now - startRef.current) / 1000)
            : Math.max(0.05, lastFlyElapsedRef.current);
        const climb = Math.min(1, elapsed / 3.0);
        const bobX = s === "flying" && climb > 0.85 ? Math.sin(now * 0.0022) * 10 : 0;
        const bobY = s === "flying" && climb > 0.85 ? Math.cos(now * 0.0028) * 12 : 0;

        const startX = 0;
        const startY = h;
        const endX = climb * (w * 0.77) + bobX;
        const endY = h - Math.pow(climb, 1.15) * (h * 0.72) + bobY;

        const ctrlX = endX * 0.56;
        const ctrlY = h - (h - endY) * 0.14;

        if (s === "flying") {
          const fillGrad = ctx.createLinearGradient(0, endY, 0, h);
          fillGrad.addColorStop(0, "rgba(225, 29, 72, 0.48)");
          fillGrad.addColorStop(1, "rgba(190, 18, 60, 0.12)");

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineTo(endX, h);
          ctx.closePath();
          ctx.fillStyle = fillGrad;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#f41b4e";
          ctx.shadowColor = "#e11d48";
          ctx.shadowBlur = 16;
          ctx.stroke();
          ctx.shadowBlur = 0;

          const angle = Math.atan2(endY - ctrlY, Math.max(1, endX - ctrlX)) * 0.58;
          drawSpribePlane(endX + 4, endY - 8, angle, now);
        } else {
          const flyOut = Math.max(0, (now - crashTimeRef.current) / 1100);
          if (flyOut < 1.2) {
            drawSpribePlane(endX + flyOut * 320, endY - flyOut * 180, -0.45, now);
          }
        }
      }

      // 5. Floating cashout badges
      for (const b of badgesRef.current) {
        const age = (now - b.createdAt) / 1000;
        if (age > 2.2) continue;
        const alpha = Math.max(0, 1 - age / 2.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bx = w * 0.5;
        const by = 46 - age * 18;
        ctx.fillStyle = "#22c55e";
        if (typeof ctx.roundRect === "function") {
          ctx.beginPath();
          ctx.roundRect(bx - 78, by - 12, 156, 24, 999);
          ctx.fill();
        } else {
          ctx.fillRect(bx - 78, by - 12, 156, 24);
        }
        ctx.fillStyle = "#041b0b";
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
