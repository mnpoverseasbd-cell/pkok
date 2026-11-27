import { useEffect, useRef, useState } from "react";

export type DieTheme = "emerald-gold" | "obsidian-gold";

/**
 * 3D orientation (deg) bringing each face (1..6) forward (+Z) toward the viewer.
 * Face layout: 1=front, 6=back, 2=top, 5=bottom, 3=right, 4=left.
 */
const FACE_ROTATION: Record<number, { rx: number; ry: number }> = {
  1: { rx: 0, ry: 0 },
  2: { rx: -90, ry: 0 },
  3: { rx: 0, ry: -90 },
  4: { rx: 0, ry: 90 },
  5: { rx: 90, ry: 0 },
  6: { rx: 0, ry: 180 },
};

/** Classic 3x3 pip positions for faces 1..6. */
const PIP_GRID: Record<number, number[]> = {
  1: [4],
  2: [2, 6],
  3: [2, 4, 6],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

function DieFace({
  value,
  halfSize,
  transform,
  theme,
}: {
  value: number;
  halfSize: number;
  transform: string;
  theme: DieTheme;
}) {
  const pips = PIP_GRID[value] ?? [4];
  const isEmerald = theme === "emerald-gold";
  const faceBg = isEmerald
    ? "linear-gradient(145deg, #166534 0%, #0b3b24 55%, #052013 100%)"
    : "linear-gradient(145deg, #27272a 0%, #111827 55%, #05070b 100%)";
  const rim = isEmerald ? "rgba(250, 204, 21, 0.55)" : "rgba(52, 211, 153, 0.45)";
  const pipStyle =
    value === 1
      ? {
          background: "radial-gradient(circle at 35% 35%, #fef08a, #f59e0b 65%, #b45309 100%)",
          boxShadow: "0 0 10px rgba(251,191,36,0.9), inset 0 1px 1px rgba(255,255,255,0.7)",
        }
      : isEmerald
        ? {
            background: "radial-gradient(circle at 35% 35%, #fffbeb, #facc15 68%, #ca8a04 100%)",
            boxShadow: "0 0 6px rgba(250,204,21,0.7), inset 0 1px 1px rgba(255,255,255,0.6)",
          }
        : {
            background: "radial-gradient(circle at 35% 35%, #ecfdf5, #34d399 68%, #059669 100%)",
            boxShadow: "0 0 6px rgba(52,211,153,0.7), inset 0 1px 1px rgba(255,255,255,0.6)",
          };

  return (
    <div
      className="absolute inset-0 grid grid-cols-3 grid-rows-3 place-items-center rounded-[18%] p-[16%]"
      style={{
        transform: `${transform} translateZ(${halfSize}px)`,
        background: faceBg,
        border: `1.5px solid ${rim}`,
        boxShadow:
          "inset 0 2px 6px rgba(255,255,255,0.22), inset 0 -4px 10px rgba(0,0,0,0.65)",
        backfaceVisibility: "hidden",
      }}
    >
      {/* Subtle diagonal glass sheen */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[18%]"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 40%, transparent 60%)",
        }}
      />
      {Array.from({ length: 9 }).map((_, idx) => {
        const active = pips.includes(idx);
        return (
          <span
            key={idx}
            className={`relative rounded-full transition-transform duration-200 ${
              active
                ? value === 1
                  ? "h-[68%] w-[68%]"
                  : "h-[60%] w-[60%]"
                : "h-0 w-0 opacity-0"
            }`}
            style={active ? pipStyle : undefined}
          />
        );
      })}
    </div>
  );
}

/**
 * Interactive 3D CSS casino die driven by requestAnimationFrame physics:
 * launches in a parabolic vertical bounce while tumbling smoothly across X/Y/Z,
 * then settles onto the exact target face (1..6) with damped spring overshoot.
 */
export function Die3D({
  value,
  rolling,
  rollId,
  turbo = false,
  size = 84,
  theme = "emerald-gold",
  phaseOffset = 0,
  outcome = "idle",
}: {
  value: number;
  rolling: boolean;
  rollId: number;
  turbo?: boolean;
  size?: number;
  theme?: DieTheme;
  phaseOffset?: number;
  outcome?: "idle" | "win" | "lose";
}) {
  const half = size / 2;
  const clamped = Math.min(6, Math.max(1, Math.round(value || 1)));
  const target = FACE_ROTATION[clamped];
  const targetRef = useRef(target);
  targetRef.current = target;

  const [pose, setPose] = useState({
    rx: target.rx - 14,
    ry: target.ry + 18,
    rz: 0,
    y: 0,
    scale: 1,
    shadowScale: 1,
    shadowOpacity: 0.45,
  });

  const poseRef = useRef(pose);
  poseRef.current = pose;

  useEffect(() => {
    if (!rolling) {
      // Smooth spring settle onto exact target face with multi-spin wrap preserved
      const start = poseRef.current;
      const finalFace = targetRef.current;
      const goalRx = Math.round(start.rx / 360) * 360 + finalFace.rx - 10;
      const goalRy = Math.round(start.ry / 360) * 360 + finalFace.ry + 14;
      const goalRz = Math.round(start.rz / 360) * 360;
      const dur = turbo ? 180 : 380;
      const t0 = performance.now();
      let raf = 0;

      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / dur);
        // Back-out ease for tactile physical settle bounce
        const c1 = 1.7;
        const c3 = c1 + 1;
        const eased = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        const bounceY = Math.sin(t * Math.PI) * -8 * (1 - t);

        setPose({
          rx: start.rx + (goalRx - start.rx) * eased,
          ry: start.ry + (goalRy - start.ry) * eased,
          rz: start.rz + (goalRz - start.rz) * eased,
          y: bounceY,
          scale: 1 + (1 - t) * 0.04,
          shadowScale: 1 - Math.abs(bounceY) * 0.015,
          shadowOpacity: 0.5,
        });
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }

    // Active airborne tumble physics loop
    const start = poseRef.current;
    const t0 = performance.now();
    const duration = turbo ? 260 : 820;
    const spinDir = phaseOffset % 2 === 0 ? 1 : -1;
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - t0;
      const p = Math.min(1, elapsed / duration);
      // Two parabolic hops (big toss + secondary bounce)
      const hop =
        p < 0.65
          ? Math.sin((p / 0.65) * Math.PI) * (turbo ? 24 : 46)
          : Math.sin(((p - 0.65) / 0.35) * Math.PI) * (turbo ? 9 : 16);

      const spinProgress = 1 - Math.pow(1 - p, 2.2);
      const rx = start.rx + (540 + phaseOffset * 90) * spinProgress * spinDir;
      const ry = start.ry + (720 + phaseOffset * 120) * spinProgress;
      const rz = start.rz + (360 * spinProgress * spinDir);

      setPose({
        rx,
        ry,
        rz,
        y: -hop,
        scale: 1 + hop * 0.004,
        shadowScale: Math.max(0.55, 1 - hop * 0.008),
        shadowOpacity: Math.max(0.18, 0.52 - hop * 0.006),
      });
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [rolling, rollId, turbo, phaseOffset, clamped]);

  const haloClass =
    !rolling && outcome === "win"
      ? "drop-shadow-[0_0_22px_rgba(16,185,129,0.75)]"
      : !rolling && outcome === "lose"
        ? "drop-shadow-[0_0_18px_rgba(244,63,94,0.65)]"
        : "drop-shadow-[0_10px_18px_rgba(0,0,0,0.65)]";

  return (
    <div
      className="relative flex flex-col items-center select-none"
      style={{ width: size + 24, height: size + 28, perspective: 720 }}
    >
      {/* Dynamic table felt shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-1 rounded-full bg-black/80 blur-md transition-opacity"
        style={{
          width: size * 0.95,
          height: size * 0.28,
          opacity: pose.shadowOpacity,
          transform: `scale(${pose.shadowScale})`,
        }}
      />

      {/* Airborne 3D cube */}
      <div
        className={`relative mt-2 ${haloClass}`}
        style={{
          width: size,
          height: size,
          transformStyle: "preserve-3d",
          transform: `translateY(${pose.y}px) scale(${pose.scale}) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) rotateZ(${pose.rz}deg)`,
          willChange: "transform",
        }}
      >
        <DieFace value={1} halfSize={half} transform="rotateY(0deg)" theme={theme} />
        <DieFace value={6} halfSize={half} transform="rotateY(180deg)" theme={theme} />
        <DieFace value={2} halfSize={half} transform="rotateX(90deg)" theme={theme} />
        <DieFace value={5} halfSize={half} transform="rotateX(-90deg)" theme={theme} />
        <DieFace value={3} halfSize={half} transform="rotateY(90deg)" theme={theme} />
        <DieFace value={4} halfSize={half} transform="rotateY(-90deg)" theme={theme} />
      </div>
    </div>
  );
}
