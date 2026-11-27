import { useEffect, useRef } from "react";

type Phase = "waiting" | "flying" | "crashed";

export type SkyCashoutBadge = {
  id: number;
  label: string;
  mult: number;
  createdAt: number;
};

/**
 * High-FPS HTML5 Canvas renderer for Aviator / Crash:
 * - Scrolling radar grid + parallax starfield proportional to speed
 * - Smooth glowing trajectory curve & radial gradient under-fill
 * - Detailed vector jet aircraft locked onto the curve tip & tangent angle
 * - Dynamic afterburner flame & crash explosion shockwave
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
  const trailRef = useRef<{ t: number; m: number }[]>([]);
  const startRef = useRef<number>(0);
  const starsRef = useRef<Array<{ x: number; y: number; r: number; spd: number }>>([]);
  const sparksRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string }>>([]);

  const phaseRef = useRef(phase);
  const multRef = useRef(multiplier);
  const badgesRef = useRef(badges);
  const prevPhaseRef = useRef<Phase>(phase);

  phaseRef.current = phase;
  multRef.current = multiplier;
  badgesRef.current = badges;

  useEffect(() => {
    if (starsRef.current.length === 0) {
      starsRef.current = Array.from({ length: 42 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.8 + Math.random() * 1.6,
        spd: 0.15 + Math.random() * 0.45,
      }));
    }
  }, []);

  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === "waiting") {
      trailRef.current = [];
      sparksRef.current = [];
    } else if (phase === "flying" && prev !== "flying") {
      startRef.current = performance.now();
      trailRef.current = [{ t: 0, m: 1 }];
    } else if (phase === "crashed" && prev === "flying") {
      // Trigger burst sparks at the last known curve head
      const arr = trailRef.current;
      const canvas = canvasRef.current;
      if (arr.length > 0 && canvas) {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const padX = 36;
        const padY = 26;
        const maxT = Math.max(4, arr[arr.length - 1].t);
        const maxM = Math.max(2, arr[arr.length - 1].m * 1.15);
        const last = arr[arr.length - 1];
        const hx = padX + (last.t / maxT) * (w - padX * 2.2);
        const hy = h - padY - ((last.m - 1) / (maxM - 1 || 1)) * (h - padY * 2.2);
        for (let i = 0; i < 36; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 6;
          sparksRef.current.push({
            x: hx,
            y: hy,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 1,
            color: i % 2 === 0 ? "#fb7185" : "#fbbf24",
          });
        }
      }
    }
  }, [phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    let raf = 0;
    let lastTime = performance.now();

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

    const drawJet = (
      x: number,
      y: number,
      angleRad: number,
      color: string,
      nowMs: number,
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angleRad);

      // Flickering afterburner exhaust flame
      const flameLen = 18 + Math.sin(nowMs * 0.05) * 6 + Math.random() * 4;
      const grad = ctx.createLinearGradient(-16 - flameLen, 0, -14, 0);
      grad.addColorStop(0, "rgba(251, 191, 36, 0)");
      grad.addColorStop(0.55, "rgba(251, 191, 36, 0.85)");
      grad.addColorStop(1, "#ffffff");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-14, -4.5);
      ctx.lineTo(-14 - flameLen, 0);
      ctx.lineTo(-14, 4.5);
      ctx.closePath();
      ctx.fill();

      // Main swept wings & fuselage
      ctx.shadowColor = color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#fde047";
      ctx.beginPath();
      ctx.moveTo(22, 0); // nose cone
      ctx.lineTo(4, -5);
      ctx.lineTo(-10, -17); // upper wingtip
      ctx.lineTo(-15, -17);
      ctx.lineTo(-8, -4);
      ctx.lineTo(-18, -8); // tail fin
      ctx.lineTo(-15, 0);
      ctx.lineTo(-18, 7);
      ctx.lineTo(-8, 4);
      ctx.lineTo(-14, 15); // lower wingtip
      ctx.lineTo(-9, 15);
      ctx.lineTo(4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Cockpit glass highlight
      ctx.fillStyle = "#064e3b";
      ctx.beginPath();
      ctx.ellipse(7, -1, 6, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#67e8f9";
      ctx.beginPath();
      ctx.ellipse(8, -1.6, 3.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const s = phaseRef.current;
      const mNow = multRef.current;
      const speedFactor = s === "flying" ? 1 + Math.min(5, Math.log(Math.max(1, mNow))) : 0.25;

      // 1. Parallax moving stars
      for (const star of starsRef.current) {
        star.x -= star.spd * speedFactor * dt * 0.28;
        if (star.x < 0) {
          star.x = 1;
          star.y = Math.random();
        }
        ctx.fillStyle = `rgba(167, 243, 208, ${0.18 + star.spd * 0.35})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Subtle emerald radar grid
      const padX = 36;
      const padY = 26;
      ctx.strokeStyle = "rgba(52, 211, 153, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = h - padY - ((h - padY * 2) / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padX, y);
        ctx.lineTo(w - 14, y);
        ctx.stroke();
      }
      const gridShift = s === "flying" ? ((now - startRef.current) * 0.03) % 60 : 0;
      for (let gx = padX + 60 - gridShift; gx < w - 14; gx += 60) {
        ctx.beginPath();
        ctx.moveTo(gx, 16);
        ctx.lineTo(gx, h - padY);
        ctx.stroke();
      }

      // Axes base lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.beginPath();
      ctx.moveTo(padX, 16);
      ctx.lineTo(padX, h - padY);
      ctx.lineTo(w - 14, h - padY);
      ctx.stroke();

      // Push sample while flying
      if (s === "flying") {
        const t = Math.max(0.01, (now - startRef.current) / 1000);
        const last = trailRef.current[trailRef.current.length - 1];
        if (!last || t - last.t >= 1 / 60) {
          trailRef.current.push({ t, m: mNow });
        }
      }

      const arr = trailRef.current;
      if (arr.length > 1) {
        const lastPt = arr[arr.length - 1];
        const maxT = Math.max(4, lastPt.t);
        const maxM = Math.max(2, lastPt.m * 1.15);

        // Y-axis multiplier ticks
        ctx.fillStyle = "rgba(167, 243, 208, 0.5)";
        ctx.font = "700 10px Outfit, sans-serif";
        for (let i = 0; i <= 4; i++) {
          const val = 1 + ((maxM - 1) / 4) * i;
          const yy = h - padY - ((h - padY * 2.2) / 4) * i;
          ctx.fillText(`${val.toFixed(1)}×`, 4, yy + 3);
        }

        const xFor = (t: number) => padX + (t / maxT) * (w - padX * 2.2);
        const yFor = (m: number) => h - padY - ((m - 1) / (maxM - 1 || 1)) * (h - padY * 2.2);

        const color =
          s === "crashed"
            ? "#fb7185"
            : mNow >= 10
              ? "#c084fc"
              : mNow >= 2
                ? "#fde047"
                : "#34d399";

        // Smooth area gradient under curve
        const areaGrad = ctx.createLinearGradient(0, 16, 0, h - padY);
        areaGrad.addColorStop(
          0,
          s === "crashed" ? "rgba(244,63,94,0.34)" : mNow >= 2 ? "rgba(251,191,36,0.28)" : "rgba(16,185,129,0.32)",
        );
        areaGrad.addColorStop(1, "rgba(4,24,15,0)");

        ctx.beginPath();
        ctx.moveTo(xFor(arr[0].t), h - padY);
        for (const p of arr) ctx.lineTo(xFor(p.t), yFor(p.m));
        ctx.lineTo(xFor(lastPt.t), h - padY);
        ctx.closePath();
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Neon trajectory stroke
        ctx.beginPath();
        ctx.moveTo(xFor(arr[0].t), yFor(arr[0].m));
        for (const p of arr) ctx.lineTo(xFor(p.t), yFor(p.m));
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Aircraft locked to tip & tangent angle
        if (s === "flying") {
          const prevPt = arr[Math.max(0, arr.length - 4)];
          const hx = xFor(lastPt.t);
          const hy = yFor(lastPt.m);
          const px = xFor(prevPt.t);
          const py = yFor(prevPt.m);
          const angle = Math.atan2(hy - py, Math.max(1, hx - px));
          drawJet(hx, hy, angle, color, now);
        }
      }

      // 3. Crash sparks update & draw
      for (let i = sparksRef.current.length - 1; i >= 0; i--) {
        const sp = sparksRef.current[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.14;
        sp.life -= dt * 1.4;
        if (sp.life <= 0) {
          sparksRef.current.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = sp.color;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 2.5 * sp.life + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 4. Floating cashout badges on sky stage
      for (const b of badgesRef.current) {
        const age = (now - b.createdAt) / 1000;
        if (age > 2.2) continue;
        const alpha = Math.max(0, 1 - age / 2.2);
        ctx.save();
        ctx.globalAlpha = alpha;
        const bx = w * 0.72;
        const by = h * 0.34 - age * 28;
        ctx.fillStyle = "rgba(16, 185, 129, 0.92)";
        ctx.beginPath();
        ctx.roundRect(bx - 75, by - 14, 150, 26, 999);
        ctx.fill();
        ctx.fillStyle = "#022010";
        ctx.font = "900 11px Outfit, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(b.label, bx, by + 3);
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
