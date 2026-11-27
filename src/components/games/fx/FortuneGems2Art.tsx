import React from "react";
import type { Fg2SpecialItem, Fg2Symbol } from "@/lib/provablyFair";

function GarudaWildSvg() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-[#FFD65A] bg-[radial-gradient(circle_at_50%_40%,#6B440C_0%,#2E1603_75%,#1A0A01_100%)] p-1 shadow-inner">
      <svg viewBox="0 0 80 72" className="h-[80%] w-[86%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" aria-hidden>
        <defs>
          <linearGradient id="fg2-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF5B8" />
            <stop offset="45%" stopColor="#F5B81D" />
            <stop offset="100%" stopColor="#9A6008" />
          </linearGradient>
        </defs>
        {/* Golden Garuda Wings & Crest */}
        <path
          d="M10 38C6 22 14 10 26 8l14 6 14-6c12 2 20 14 16 30-4 12-16 20-30 22-14-2-26-10-30-22z"
          fill="url(#fg2-gold)"
          stroke="#6A3E00"
          strokeWidth="2"
        />
        {/* Forehead Ruby Crown */}
        <path d="M32 6l8-4 8 4-3 10H35z" fill="#D92027" stroke="#FFE066" strokeWidth="1.4" />
        {/* Sharp Eagle Eyes & Beak */}
        <path d="M22 27l10 3-8 4z" fill="#231202" />
        <path d="M58 27l-10 3 8 4z" fill="#231202" />
        <circle cx="28" cy="29" r="2" fill="#FFF8A8" />
        <circle cx="52" cy="29" r="2" fill="#FFF8A8" />
        <path d="M35 33l5 12 5-12-5-4z" fill="#D48806" stroke="#4D2900" strokeWidth="1.5" />
        {/* Ruby collar */}
        <circle cx="40" cy="52" r="4.5" fill="#E01E26" stroke="#FFE066" strokeWidth="1.4" />
      </svg>
      <div
        className="-mt-2.5 w-[92%] rounded border border-[#FFE066] bg-[linear-gradient(180deg,#E51C23,#8C090D)] px-1 py-0.5 text-center font-serif text-[10px] font-black tracking-widest text-[#FFE66D] shadow-md sm:text-xs"
        style={{ textShadow: "0 1px 2px #000" }}
      >
        WILD
      </div>
    </div>
  );
}

function GemTileSvg({ type }: { type: "RED" | "BLUE" | "GREEN" }) {
  const cfg =
    type === "RED"
      ? {
          frame: "#D4A024",
          bg: "#4A1111",
          c1: "#FF758F",
          c2: "#E81C34",
          c3: "#7A0614",
          shape: "circle" as const,
        }
      : type === "BLUE"
        ? {
            frame: "#D4A024",
            bg: "#0C244E",
            c1: "#80D8FF",
            c2: "#0E6BFF",
            c3: "#062A7A",
            shape: "octagon" as const,
          }
        : {
            frame: "#D4A024",
            bg: "#0E3B1D",
            c1: "#8AFF9E",
            c2: "#15B03B",
            c3: "#085C1C",
            shape: "hex" as const,
          };

  return (
    <div
      className="relative flex h-full w-full items-center justify-center rounded-lg border-2 p-1.5 shadow-inner"
      style={{
        borderColor: cfg.frame,
        background: `radial-gradient(circle at 50% 45%, ${cfg.bg} 0%, #1F1209 100%)`,
      }}
    >
      {/* Ornate Aztec corner filigree */}
      <span aria-hidden className="pointer-events-none absolute top-0.5 left-0.5 h-2.5 w-2.5 border-t-2 border-l-2 border-[#FFD65A]/80" />
      <span aria-hidden className="pointer-events-none absolute top-0.5 right-0.5 h-2.5 w-2.5 border-t-2 border-r-2 border-[#FFD65A]/80" />
      <span aria-hidden className="pointer-events-none absolute bottom-0.5 left-0.5 h-2.5 w-2.5 border-b-2 border-l-2 border-[#FFD65A]/80" />
      <span aria-hidden className="pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 border-b-2 border-r-2 border-[#FFD65A]/80" />

      <svg viewBox="0 0 64 64" className="h-[82%] w-[82%] drop-shadow-[0_3px_8px_rgba(0,0,0,0.65)]" aria-hidden>
        <defs>
          <radialGradient id={`fg2-gem-${type}`} cx="36%" cy="32%" r="70%">
            <stop offset="0%" stopColor={cfg.c1} />
            <stop offset="52%" stopColor={cfg.c2} />
            <stop offset="100%" stopColor={cfg.c3} />
          </radialGradient>
        </defs>
        {cfg.shape === "circle" && (
          <>
            <circle cx="32" cy="32" r="24" fill={`url(#fg2-gem-${type})`} stroke="#FFD65A" strokeWidth="2" />
            <polygon points="32,12 48,24 44,46 20,46 16,24" fill="rgba(255,255,255,0.22)" />
            <polygon points="32,18 42,27 38,40 26,40 22,27" fill="rgba(255,255,255,0.25)" />
          </>
        )}
        {cfg.shape === "octagon" && (
          <>
            <polygon
              points="22,8 42,8 56,22 56,42 42,56 22,56 8,42 8,22"
              fill={`url(#fg2-gem-${type})`}
              stroke="#FFD65A"
              strokeWidth="2"
            />
            <polygon points="24,16 40,16 48,24 48,40 40,48 24,48 16,40 16,24" fill="rgba(255,255,255,0.2)" />
            <polygon points="27,22 37,22 42,27 42,37 37,42 27,42 22,37 22,27" fill="rgba(255,255,255,0.28)" />
          </>
        )}
        {cfg.shape === "hex" && (
          <>
            <polygon
              points="32,7 54,19 54,45 32,57 10,45 10,19"
              fill={`url(#fg2-gem-${type})`}
              stroke="#FFD65A"
              strokeWidth="2"
            />
            <polygon points="32,15 47,23 47,41 32,49 17,41 17,23" fill="rgba(255,255,255,0.22)" />
          </>
        )}
      </svg>
    </div>
  );
}

function RoyalTile({ rank }: { rank: "A" | "K" | "Q" | "J" }) {
  const gemColor =
    rank === "A"
      ? "#E81C34"
      : rank === "K"
        ? "#A626A4"
        : rank === "Q"
          ? "#0E6BFF"
          : "#15B03B";

  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-lg border-2 border-[#B9894C] bg-[linear-gradient(180deg,#5C4026_0%,#3B2613_100%)] shadow-inner">
      <span
        className="font-serif text-4xl font-black tracking-tight text-transparent bg-clip-text bg-[linear-gradient(180deg,#FFF3B0_0%,#E2A43B_55%,#8E5410_100%)] sm:text-[42px]"
        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.85))" }}
      >
        {rank}
      </span>
      <span
        aria-hidden
        className="absolute right-2 bottom-2 h-3 w-3 rotate-45 rounded-[2px] border border-[#FFE066]"
        style={{ backgroundColor: gemColor, boxShadow: `0 0 8px ${gemColor}` }}
      />
    </div>
  );
}

export const Fg2SymbolTile: React.FC<{
  sym: Fg2Symbol;
  winning?: boolean;
  dim?: boolean;
}> = ({ sym, winning = false, dim = false }) => {
  const stateCls = winning
    ? "z-20 scale-[1.04] ring-2 ring-[#FFF59D] shadow-[0_0_24px_rgba(255,220,70,0.95)] brightness-110"
    : dim
      ? "brightness-[0.42] saturate-75"
      : "";

  return (
    <div className={`aspect-square w-full transition-all duration-300 ${stateCls}`}>
      {sym === "WILD" && <GarudaWildSvg />}
      {(sym === "RED" || sym === "BLUE" || sym === "GREEN") && <GemTileSvg type={sym} />}
      {(sym === "A" || sym === "K" || sym === "Q" || sym === "J") && <RoyalTile rank={sym} />}
    </div>
  );
};

export const Fg2SpecialBadge: React.FC<{
  item: Fg2SpecialItem;
  extraBet: boolean;
  active?: boolean;
}> = ({ item, extraBet, active = false }) => {
  if (item === "WHEEL") {
    return (
      <div
        className={`relative flex aspect-square w-full flex-col items-center justify-center rounded-xl p-1 transition-all ${
          active ? "scale-105" : "opacity-75 scale-90"
        }`}
      >
        <div
          className={`relative grid h-[74%] w-[78%] place-items-center rounded-full border-2 border-[#FFE066] shadow-lg ${
            extraBet
              ? "bg-[conic-gradient(#D92B2B,#FFD65A,#A626A4,#E02424,#1E64C8,#FFD65A)] shadow-[0_0_16px_rgba(255,60,60,0.85)]"
              : "bg-[conic-gradient(#1E64C8,#2D7A4D,#A626A4,#D4A024,#1E64C8,#2D7A4D)]"
          }`}
        >
          <span className="h-4 w-4 rounded-full border border-[#FFE066] bg-[#FFD54F]" />
        </div>
        <span
          className={`-mt-2 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FFE66D] border border-[#FFE066] shadow ${
            extraBet
              ? "bg-[linear-gradient(180deg,#E02424,#7D0A0A)]"
              : "bg-[linear-gradient(180deg,#159947,#095724)]"
          }`}
        >
          WHEEL
        </span>
      </div>
    );
  }

  const lotusColor =
    item === 15
      ? "from-[#FF6B6B] via-[#E02424] to-[#7D0A0A]"
      : item === 10
        ? "from-[#FF85E4] via-[#C026D3] to-[#6B1278]"
        : item === 5
          ? "from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]"
          : item === 3
            ? "from-[#5EEAD4] via-[#0D9488] to-[#115E59]"
            : item === 2
              ? "from-[#86EFAC] via-[#16A34A] to-[#14532D]"
              : "from-[#CBD5E1] via-[#64748B] to-[#334155]";

  return (
    <div
      className={`relative flex aspect-square w-full items-center justify-center transition-all ${
        active ? "scale-105" : "opacity-70 scale-90"
      }`}
    >
      <div
        className={`relative flex h-[78%] w-[80%] items-center justify-center rounded-full border-2 border-[#FFE680] bg-gradient-to-b ${lotusColor} shadow-[0_4px_12px_rgba(0,0,0,0.65)]`}
      >
        <span
          className="font-serif text-2xl font-black italic text-[#FFF5B8] sm:text-[26px]"
          style={{ textShadow: "0 2px 0 #7C3D00, 0 3px 6px rgba(0,0,0,0.85)" }}
        >
          {item}x
        </span>
      </div>
    </div>
  );
};

export const LUCKY_WHEEL_WEDGES = [
  1000, 3, 50, 8, 200, 5, 100, 1, 30, 10, 20, 15,
] as const;

const WEDGE_COLORS = [
  "#A626A4",
  "#1E64C8",
  "#2D7A4D",
  "#7A5638",
  "#A626A4",
  "#1E64C8",
  "#2D7A4D",
  "#7A5638",
  "#A626A4",
  "#1E64C8",
  "#2D7A4D",
  "#7A5638",
];

function formatCompactPrize(val: number): string {
  if (val >= 1000) return `${+(val / 1000).toFixed(1)}K`;
  if (val >= 10) return Math.round(val).toString();
  return val.toFixed(val % 1 === 0 ? 0 : 1);
}

export const LuckyWheelGraphic: React.FC<{
  bet: number;
  rotationDeg: number;
  spinning: boolean;
}> = ({ bet, rotationDeg, spinning }) => {
  const n = LUCKY_WHEEL_WEDGES.length;
  const sliceDeg = 360 / n;

  return (
    <div className="relative flex aspect-square w-full items-center justify-center select-none">
      {/* Top red jewel pointer */}
      <div className="pointer-events-none absolute -top-2 z-30 flex flex-col items-center">
        <div className="h-5 w-4 rounded-b-full border-2 border-[#FFE066] bg-[#D92B2B] shadow-[0_2px_8px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Rotating Wheel */}
      <div
        className="relative h-full w-full rounded-full border-[6px] border-[#D4A024] bg-[#2D1808] shadow-[0_0_28px_rgba(255,214,90,0.45)]"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transition: spinning ? "transform 2.6s cubic-bezier(0.12, 0.82, 0.16, 1)" : "transform 0.4s ease-out",
        }}
      >
        <svg viewBox="0 0 200 200" className="h-full w-full rounded-full">
          {LUCKY_WHEEL_WEDGES.map((mult, i) => {
            const a0 = ((i * sliceDeg - 90 - sliceDeg / 2) * Math.PI) / 180;
            const a1 = (((i + 1) * sliceDeg - 90 - sliceDeg / 2) * Math.PI) / 180;
            const x0 = 100 + 96 * Math.cos(a0);
            const y0 = 100 + 96 * Math.sin(a0);
            const x1 = 100 + 96 * Math.cos(a1);
            const y1 = 100 + 96 * Math.sin(a1);
            const midAngle = i * sliceDeg - 90;
            const prizeText = formatCompactPrize(bet * mult);
            return (
              <g key={`${mult}-${i}`}>
                <path
                  d={`M100,100 L${x0},${y0} A96,96 0 0,1 ${x1},${y1} Z`}
                  fill={WEDGE_COLORS[i]}
                  stroke="#E5B94B"
                  strokeWidth="1.2"
                />
                <text
                  x="152"
                  y="103"
                  textAnchor="middle"
                  fill="#FFF8C8"
                  fontSize="10"
                  fontWeight="900"
                  fontFamily="sans-serif"
                  transform={`rotate(${midAngle}, 100, 100)`}
                  style={{ textShadow: "0 1px 2px #000" }}
                >
                  {prizeText}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center Garuda Gold Medallion */}
        <div className="absolute inset-[34%] flex items-center justify-center rounded-full border-2 border-[#FFF3B0] bg-[radial-gradient(circle_at_35%_30%,#FFE57F,#D49A12,#7A4E02)] shadow-xl">
          <span className="text-lg">🦅</span>
        </div>
      </div>
    </div>
  );
};
