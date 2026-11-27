import { useEffect, useRef } from "react";

type Phase = "waiting" | "flying" | "crashed";

export type SkyCashoutBadge = {
  id: number;
  label: string;
  mult: number;
  createdAt: number;
};

/**
 * Authentic Spribe Aviator Canvas:
 * - Rotating dark sunburst beams radiating from bottom-left corner
 * - Smooth crimson flight curve + gradient red area fill beneath
 * - Classic Spribe red propeller plane hovering & pitching cleanly at curve head
 * - Smooth "flew away" exit animation on crash
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

  phaseRef.current = phase;
  multRef.current = multiplier;
  badgesRef.current = badges;

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;
    if (phase === "flying" && prev !== "flying") {
      startRef.current = performance.now();
      lastFlyElapsedRef.current = 0;
    } else if (phase === "crashed" && prev === "flying") {
      crashTimeRef.current = performance.now();
      lastFlyElapsedRef.current = (performance.now() - startRef.current) / 1000;
    }
  }, [phase]);

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

      // Soft warm glow beneath fuselage
      ctx.shadowColor = "rgba(229, 29, 72, 0.7)";
      ctx.shadowBlur = 18;

      // Top rounded wing & tail
      ctx.fillStyle = "#e11d48";
      ctx.beginPath();
      ctx.moveTo(-26, 2);
      ctx.quadraticCurveTo(-30, -10, -22, -14);
      ctx.lineTo(-14, -4);
      ctx.lineTo(14, -6);
      ctx.quadraticCurveTo(26, -5, 29, 1);
      ctx.quadraticCurveTo(26, 8, 12, 8);
      ctx.lineTo(-18, 6);
      ctx.closePath();
      ctx.fill();

      // Belly / lower fuselage accent
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#be123c";
      ctx.beginPath();
      ctx.moveTo(-14, 4);
      ctx.lineTo(18, 4);
      ctx.lineTo(12, 9);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();

      // White fuselage stripe & cockpit
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(-8, -3, 18, 4, 2);
      ctx.fill();

      // Tail 'X' accent
      ctx.strokeStyle = "#fda4af";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-22, -9);
      ctx.lineTo(-17, -4);
      ctx.moveTo(-17, -9);
      ctx.lineTo(-22, -4);
      ctx.stroke();

      // Upper wing silhouette
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.ellipse(2, -9, 12, 3.2, -0.1, 0, Math.PI * 2);
      ctx.fill();

      // Spinning front propeller
      const propH = 5 + Math.abs(Math.sin(nowMs * 0.045)) * 13;
      ctx.strokeStyle = "rgba(255,255,255,0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(30, -propH);
      ctx.lineTo(30, propH);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(29, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const s = phaseRef.current;

      // 1. Dark Spribe rotating sunburst rays centered at bottom-left
      const rayCount = 22;
      const rotBase = (now * 0.00008) % (Math.PI * 2);
      const maxR = Math.hypot(w, h) * 1.15;
      for (let i = 0; i < rayCount; i++) {
        if (i % 2 === 1) continue;
        const a0 = rotBase + (i / rayCount) * Math.PI * 2;
        const a1 = a0 + (1 / rayCount) * Math.PI * 2;
        ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(Math.cos(a0) * maxR, h + Math.sin(a0) * maxR);
        ctx.lineTo(Math.cos(a1) * maxR, h + Math.sin(a1) * maxR);
        ctx.closePath();
        ctx.fill();
      }

      // Subtle axis guide lines + pulsing dots along left & bottom like Spribe Aviator
      const padL = 22;
      const padB = 18;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.09)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, 10);
      ctx.lineTo(padL, h - padB);
      ctx.lineTo(w - 10, h - padB);
      ctx.stroke();

      if (s === "flying") {
        const elapsed = (now - startRef.current) / 1000;
        const driftX = (elapsed * 44) % 48;
        const driftY = (elapsed * 32) % 42;
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        for (let bx = padL + 48 - driftX; bx < w - 18; bx += 48) {
          ctx.beginPath();
          ctx.arc(bx, h - padB + 7, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
        for (let by = h - padB - 42 + driftY; by > 16; by -= 42) {
          ctx.beginPath();
          ctx.arc(padL - 8, by, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Smooth Spribe parabolic climb curve
      if (s === "flying" || s === "crashed") {
        const elapsed = s === "flying" ? (now - startRef.current) / 1000 : lastFlyElapsedRef.current;
        const climbProgress = Math.min(1, elapsed / 4.2);
        const bobX = s === "flying" && climbProgress > 0.85 ? Math.sin(now * 0.0022) * 8 : 0;
        const bobY = s === "flying" && climbProgress > 0.85 ? Math.cos(now * 0.003) * 10 : 0;

        const startX = padL;
        const startY = h - padB;
        const endX = padL + climbProgress * (w * 0.78 - padL) + bobX;
        const endY = startY - Math.pow(climbProgress, 1.18) * (h * 0.68) + bobY;

        // Control point pulls curve gently upward near right (quadratic curve)
        const ctrlX = startX + (endX - startX) * 0.58;
        const ctrlY = startY - (startY - endY) * 0.14;

        if (s === "flying") {
          // Red under-curve gradient fill
          const fillGrad = ctx.createLinearGradient(0, endY, 0, startY);
          fillGrad.addColorStop(0, "rgba(225, 29, 72, 0.44)");
          fillGrad.addColorStop(1, "rgba(225, 29, 72, 0.05)");
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineTo(endX, startY);
          ctx.closePath();
          ctx.fillStyle = fillGrad;
          ctx.fill();

          // Glowing red flight stroke
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#f43f5e";
          ctx.shadowColor = "#e11d48";
          ctx.shadowBlur = 14;
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Tangent slope at t=1 is (end - ctrl)
          const angle = Math.atan2(endY - ctrlY, Math.max(1, endX - ctrlX)) * 0.65;
          drawSpribePlane(endX, endY - 6, angle, now);
        } else {
          // Crashed: plane zooms off top-right
          const flyOut = Math.min(1.4, (now - crashTimeRef.current) / 700);
          if (flyOut < 1.1) {
            const fx = endX + flyOut * 280;
            const fy = endY - flyOut * 160;
            drawSpribePlane(fx, fy, -0.45, now);
          }
        }
      }

      // 3. Floating cashout badges
      for (const b of badgesRef.current) {
        const age = (now - b.createdAt) / 1000;
        if (age > 2.2) continue;
        const alpha = Math.max(0, 1 - age / 2.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bx = w * 0.5;
        const by = 46 - age * 18;
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.roundRect(bx - 78, by - 12, 156, 24, 999);
        ctx.fill();
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
