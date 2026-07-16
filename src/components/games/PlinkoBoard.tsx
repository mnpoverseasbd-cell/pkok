import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import Matter from "matter-js";
import { sfxPeg, sfxDrop } from "@/lib/sound";

export type PlinkoBoardHandle = {
  /** Drop a ball that will be steered along `path` (array of 0/1) to `targetBucket`. */
  drop: (path: number[], targetBucket: number) => Promise<void>;
};

type Props = {
  rows: number;
  buckets: number;
  onLand: (bucket: number) => void;
};

const WIDTH = 380;
const HEIGHT = 440;
const PEG_R = 4;
const BALL_R = 7;
const TOP = 40;
const BOTTOM = 380;

export const PlinkoBoard = forwardRef<PlinkoBoardHandle, Props>(function PlinkoBoard(
  { rows, buckets, onLand }, ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const pegsRef = useRef<Matter.Body[]>([]);
  const activeBallRef = useRef<Matter.Body | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);
  const pathRef = useRef<number[]>([]);
  const targetXRef = useRef<number>(WIDTH / 2);
  const nextRowRef = useRef(0);
  const rowYRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = WIDTH * devicePixelRatio;
    canvas.height = HEIGHT * devicePixelRatio;
    canvas.style.width = WIDTH + "px";
    canvas.style.height = HEIGHT + "px";
    const cctx = canvas.getContext("2d")!;
    cctx.scale(devicePixelRatio, devicePixelRatio);

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 1, scale: 0.0018 } });
    engineRef.current = engine;

    // Pegs — triangular grid
    const pegs: Matter.Body[] = [];
    const rowSpacing = (BOTTOM - TOP) / (rows + 1);
    const colSpacing = 28;
    const rowY: number[] = [];
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const y = TOP + rowSpacing * (r + 1);
      rowY.push(y);
      const startX = WIDTH / 2 - ((pegsInRow - 1) * colSpacing) / 2;
      for (let c = 0; c < pegsInRow; c++) {
        const peg = Matter.Bodies.circle(startX + c * colSpacing, y, PEG_R, {
          isStatic: true, restitution: 0.55, friction: 0.02, label: "peg",
        });
        pegs.push(peg);
      }
    }
    rowYRef.current = rowY;
    pegsRef.current = pegs;

    // Bucket dividers
    const bucketDividers: Matter.Body[] = [];
    const bucketWidth = WIDTH / buckets;
    for (let i = 0; i <= buckets; i++) {
      const x = i * bucketWidth;
      bucketDividers.push(Matter.Bodies.rectangle(x, BOTTOM + 30, 2, 60, { isStatic: true, label: "divider" }));
    }
    // Floor + walls
    const floor = Matter.Bodies.rectangle(WIDTH / 2, BOTTOM + 62, WIDTH, 4, { isStatic: true, label: "floor" });
    const leftWall = Matter.Bodies.rectangle(-4, HEIGHT / 2, 8, HEIGHT, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(WIDTH + 4, HEIGHT / 2, 8, HEIGHT, { isStatic: true });

    Matter.Composite.add(engine.world, [...pegs, ...bucketDividers, floor, leftWall, rightWall]);

    // Peg collision → sound + steer
    Matter.Events.on(engine, "collisionStart", (evt) => {
      const ball = activeBallRef.current;
      if (!ball) return;
      for (const pair of evt.pairs) {
        const other = pair.bodyA === ball ? pair.bodyB : pair.bodyA === ball || pair.bodyB === ball ? pair.bodyA : null;
        if (!other) continue;
        if (other.label === "peg") {
          const speed = Math.hypot(ball.velocity.x, ball.velocity.y);
          sfxPeg(Math.min(1, speed / 6));
        }
        if (other.label === "floor") {
          finishBall();
        }
      }
    });

    // After update: steering nudges based on PF path
    Matter.Events.on(engine, "afterUpdate", () => {
      const ball = activeBallRef.current;
      if (!ball) return;
      const rowY = rowYRef.current;
      const nextIdx = nextRowRef.current;
      if (nextIdx < rowY.length && ball.position.y > rowY[nextIdx] + 4) {
        // Passed a peg row — apply small nudge in PF direction if drifting wrong way
        const dir = pathRef.current[nextIdx] === 0 ? -1 : 1;
        Matter.Body.applyForce(ball, ball.position, { x: dir * 0.00012, y: 0 });
        nextRowRef.current = nextIdx + 1;
      }
      // Final horizontal correction near buckets
      if (ball.position.y > BOTTOM - 20 && ball.position.y < BOTTOM + 10) {
        const dx = targetXRef.current - ball.position.x;
        if (Math.abs(dx) > 4) {
          Matter.Body.applyForce(ball, ball.position, { x: Math.sign(dx) * 0.0004, y: 0 });
        }
      }
      // Safety: if below floor, resolve
      if (ball.position.y > BOTTOM + 55) finishBall();
    });

    const finishBall = () => {
      const ball = activeBallRef.current;
      if (!ball) return;
      const bucket = Math.min(buckets - 1, Math.max(0, Math.floor(ball.position.x / bucketWidth)));
      Matter.Composite.remove(engine.world, ball);
      activeBallRef.current = null;
      const cb = resolveRef.current; resolveRef.current = null;
      onLand(bucket);
      cb?.();
    };

    const runner = Matter.Runner.create();
    runnerRef.current = runner;
    Matter.Runner.run(runner, engine);

    // Render loop
    let raf = 0;
    const render = () => {
      cctx.clearRect(0, 0, WIDTH, HEIGHT);
      // Background gradient bg is provided by CSS wrapper.
      // Pegs
      cctx.fillStyle = "#3b7a4d";
      for (const p of pegs) {
        cctx.beginPath();
        cctx.arc(p.position.x, p.position.y, PEG_R, 0, Math.PI * 2);
        cctx.fill();
      }
      // Bucket dividers
      cctx.strokeStyle = "#1a3321";
      cctx.lineWidth = 2;
      for (let i = 0; i <= buckets; i++) {
        const x = i * bucketWidth;
        cctx.beginPath(); cctx.moveTo(x, BOTTOM); cctx.lineTo(x, BOTTOM + 60); cctx.stroke();
      }
      // Ball
      const ball = activeBallRef.current;
      if (ball) {
        const grad = cctx.createRadialGradient(ball.position.x - 2, ball.position.y - 2, 1, ball.position.x, ball.position.y, BALL_R);
        grad.addColorStop(0, "#fff7c2");
        grad.addColorStop(1, "#ffd700");
        cctx.fillStyle = grad;
        cctx.shadowColor = "#ffd700"; cctx.shadowBlur = 12;
        cctx.beginPath();
        cctx.arc(ball.position.x, ball.position.y, BALL_R, 0, Math.PI * 2);
        cctx.fill();
        cctx.shadowBlur = 0;
      }
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
    };
  }, [rows, buckets, onLand]);

  useImperativeHandle(ref, () => ({
    drop: (path, targetBucket) => new Promise<void>((resolve) => {
      const engine = engineRef.current; if (!engine) return resolve();
      pathRef.current = path;
      nextRowRef.current = 0;
      const bucketWidth = WIDTH / buckets;
      targetXRef.current = (targetBucket + 0.5) * bucketWidth;
      // Small jitter around top center
      const x = WIDTH / 2 + (Math.random() - 0.5) * 8;
      const ball = Matter.Bodies.circle(x, 10, BALL_R, {
        restitution: 0.55, friction: 0.008, frictionAir: 0.012, density: 0.002, label: "ball",
      });
      Matter.Body.setVelocity(ball, { x: 0, y: 0 });
      Matter.Composite.add(engine.world, ball);
      activeBallRef.current = ball;
      resolveRef.current = resolve;
      sfxDrop();
    }),
  }), [buckets]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-2xl border border-[#1a3321] bg-gradient-to-b from-[#0a120b] to-[#050a06]"
    />
  );
});
