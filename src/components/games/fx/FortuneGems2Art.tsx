import React from "react";
import type { Fg2SpecialItem, Fg2Symbol } from "@/lib/provablyFair";

function GarudaWildSvg() {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] border-2 border-[#FFE67A] bg-[radial-gradient(circle_at_50%_42%,#C98A1C_0%,#6A3B06_70%,#2A1102_100%)] shadow-[inset_0_0_14px_rgba(255,220,100,0.55)]">
      {/* Edge-to-edge carved golden Garuda head matching live JILI WILD */}
      <svg viewBox="0 0 100 92" className="h-full w-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.85)]" aria-hidden>
        <defs>
          <linearGradient id="fg2-garuda-gold" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#FFF8C9" />
            <stop offset="35%" stopColor="#FAD048" />
            <stop offset="72%" stopColor="#D48E10" />
            <stop offset="100%" stopColor="#7C4704" />
          </linearGradient>
          <linearGradient id="fg2-wild-red" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF3B3B" />
            <stop offset="100%" stopColor="#99080C" />
          </linearGradient>
        </defs>
        {/* Outer feathered wings/plumes filling tile */}
        <path
          d="M4 52 C2 28 12 10 30 6 L42 14 L50 3 L58 14 L70 6 C88 10 98 28 96 52 C92 70 78 82 50 86 C22 82 8 70 4 52 Z"
          fill="url(#fg2-garuda-gold)"
          stroke="#592F02"
          strokeWidth="2.5"
        />
        {/* Feathered wing ridges */}
        <path d="M12 34 L28 38 M10 46 L26 48 M88 34 L72 38 M90 46 L74 48" stroke="#7A4505" strokeWidth="2.4" strokeLinecap="round" />
        {/* Crown ruby */}
        <polygon points="50,6 57,17 50,24 43,17" fill="#E81C34" stroke="#FFF2A6" strokeWidth="1.5" />
        {/* Side cheek rubies */}
        <circle cx="24" cy="24" r="3.5" fill="#E81C34" stroke="#FFE066" strokeWidth="1.2" />
        <circle cx="76" cy="24" r="3.5" fill="#E81C34" stroke="#FFE066" strokeWidth="1.2" />
        {/* Fierce Garuda brow & glowing eyes */}
        <path d="M25 32 L45 39 L30 43 Z" fill="#3B1D02" />
        <path d="M75 32 L55 39 L70 43 Z" fill="#3B1D02" />
        <circle cx="34" cy="38" r="3.2" fill="#FFFBE0" stroke="#7A4505" strokeWidth="1" />
        <circle cx="66" cy="38" r="3.2" fill="#FFFBE0" stroke="#7A4505" strokeWidth="1" />
        <circle cx="34" cy="38" r="1.4" fill="#1C0B00" />
        <circle cx="66" cy="38" r="1.4" fill="#1C0B00" />
        {/* Hooked eagle beak */}
        <path d="M42 42 L50 37 L58 42 L50 61 Z" fill="#F2AE1C" stroke="#592F02" strokeWidth="2" />
        <path d="M45 45 L50 56 L55 45" fill="none" stroke="#FFF4B0" strokeWidth="1.3" />
        {/* Ruby-crimson carved WILD banner */}
        <path d="M14 68 Q50 76 86 68 L83 84 Q50 91 17 84 Z" fill="url(#fg2-wild-red)" stroke="#FFE680" strokeWidth="2" />
        <text
          x="50"
          y="80"
          textAnchor="middle"
          fill="#FFE66D"
          fontSize="14.5"
          fontWeight="900"
          fontFamily="Georgia, serif"
          letterSpacing="2"
          stroke="#400303"
          strokeWidth="0.9"
        >
          WILD
        </text>
      </svg>
    </div>
  );
}

function GemTileSvg({ type }: { type: "RED" | "BLUE" | "GREEN" }) {
  const cfg =
    type === "RED"
      ? { bg: "#5C0A10", c1: "#FF9EB0", c2: "#F21B35", c3: "#7A0412", shape: "circle" as const }
      : type === "BLUE"
        ? { bg: "#0B2457", c1: "#9EE7FF", c2: "#1677FF", c3: "#05266E", shape: "octagon" as const }
        : { bg: "#0A3F1B", c1: "#A8FFB8", c2: "#16C942", c3: "#065217", shape: "hex" as const };

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] border-[3px] border-[#EAB83E] shadow-[inset_0_0_12px_rgba(0,0,0,0.75)]"
      style={{
        background: `radial-gradient(circle at 50% 48%, ${cfg.bg} 0%, #1F1106 95%)`,
      }}
    >
      {/* Ornate gold Aztec corner scrollwork matching Fortune Gems 2 */}
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id={`fg2-scroll-${type}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF0A6" />
            <stop offset="50%" stopColor="#E5A91A" />
            <stop offset="100%" stopColor="#9A6008" />
          </linearGradient>
          <radialGradient id={`fg2-gem-${type}`} cx="36%" cy="32%" r="70%">
            <stop offset="0%" stopColor={cfg.c1} />
            <stop offset="52%" stopColor={cfg.c2} />
            <stop offset="100%" stopColor={cfg.c3} />
          </radialGradient>
        </defs>
        {/* 4 Aztec gold corner filigrees */}
        <path d="M2,2 H30 C22,12 12,22 2,30 Z" fill={`url(#fg2-scroll-${type})`} opacity="0.92" />
        <path d="M98,2 H70 C78,12 88,22 98,30 Z" fill={`url(#fg2-scroll-${type})`} opacity="0.92" />
        <path d="M2,98 H30 C22,88 12,78 2,70 Z" fill={`url(#fg2-scroll-${type})`} opacity="0.92" />
        <path d="M98,98 H70 C78,88 88,78 98,70 Z" fill={`url(#fg2-scroll-${type})`} opacity="0.92" />
        <rect x="6" y="6" width="88" height="88" rx="6" fill="none" stroke={`url(#fg2-scroll-${type})`} strokeWidth="2.4" />

        {/* Large faceted gemstone */}
        {cfg.shape === "circle" && (
          <g className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            <circle cx="50" cy="50" r="34" fill={`url(#fg2-gem-${type})`} stroke="#FFE066" strokeWidth="2.8" />
            <polygon points="50,20 74,38 66,70 34,70 26,38" fill="rgba(255,255,255,0.22)" />
            <polygon points="50,28 65,41 60,62 40,62 35,41" fill="rgba(255,255,255,0.26)" />
            <circle cx="38" cy="34" r="4.5" fill="rgba(255,255,255,0.55)" />
          </g>
        )}
        {cfg.shape === "octagon" && (
          <g className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            <polygon points="35,16 65,16 84,35 84,65 65,84 35,84 16,65 16,35" fill={`url(#fg2-gem-${type})`} stroke="#FFE066" strokeWidth="2.8" />
            <polygon points="38,26 62,26 74,38 74,62 62,74 38,74 26,62 26,38" fill="rgba(255,255,255,0.22)" />
            <polygon points="42,35 58,35 65,42 65,58 58,65 42,65 35,58 35,42" fill="rgba(255,255,255,0.3)" />
            <circle cx="39" cy="34" r="3.8" fill="rgba(255,255,255,0.5)" />
          </g>
        )}
        {cfg.shape === "hex" && (
          <g className="drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            <polygon points="50,14 82,32 82,68 50,86 18,68 18,32" fill={`url(#fg2-gem-${type})`} stroke="#FFE066" strokeWidth="2.8" />
            <polygon points="50,25 72,38 72,62 50,75 28,62 28,38" fill="rgba(255,255,255,0.25)" />
            <circle cx="38" cy="35" r="4" fill="rgba(255,255,255,0.5)" />
          </g>
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
        ? "#C026D3"
        : rank === "Q"
          ? "#1677FF"
          : "#18C943";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] border-2 border-[#D4A024] bg-[radial-gradient(circle_at_50%_38%,#9E784E_0%,#6D4D2E_64%,#422B16_100%)] shadow-[inset_0_1px_6px_rgba(255,235,175,0.3)]">
      <div aria-hidden className="pointer-events-none absolute inset-1 rounded-[5px] border border-[#FFE066]/30" />
      <svg viewBox="0 0 80 80" className="h-[80%] w-[80%]" aria-hidden>
        <defs>
          <linearGradient id={`fg2-r-${rank}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF7CC" />
            <stop offset="48%" stopColor="#F4BE46" />
            <stop offset="100%" stopColor="#94580A" />
          </linearGradient>
        </defs>
        <text
          x="40"
          y="55"
          textAnchor="middle"
          fill={`url(#fg2-r-${rank})`}
          stroke="#3B1E04"
          strokeWidth="2.4"
          paintOrder="stroke fill"
          fontSize="46"
          fontWeight="900"
          fontFamily="Georgia, serif"
        >
          {rank}
        </text>
      </svg>
      <span
        aria-hidden
        className="absolute right-2 bottom-2 h-3.5 w-3.5 rotate-45 rounded-[2px] border border-[#FFF2A6]"
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
    ? "z-20 scale-[1.04] ring-2 ring-[#FFF59D] shadow-[0_0_26px_rgba(255,220,70,0.98)] brightness-110"
    : dim
      ? "brightness-[0.42] saturate-75"
      : "";

  return (
    <div className={`h-full w-full min-h-0 transition-all duration-300 ${stateCls}`}>
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
        className={`relative flex h-full w-full flex-col items-center justify-center p-0.5 transition-all ${
          active ? "scale-105" : "opacity-85 scale-90"
        }`}
      >
        <div className="relative aspect-square h-[78%] max-w-[84%] overflow-hidden rounded-full border-2 border-[#FFE680] shadow-[0_3px_12px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 64 64" className="h-full w-full">
            <path d="M32,32 L32,2 A30,30 0 0,1 58,17 Z" fill={extraBet ? "#E02424" : "#1E64C8"} stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L58,17 A30,30 0 0,1 58,47 Z" fill="#F5B81D" stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L58,47 A30,30 0 0,1 32,62 Z" fill={extraBet ? "#B81212" : "#2D7A4D"} stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L32,62 A30,30 0 0,1 6,47 Z" fill="#A626A4" stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L6,47 A30,30 0 0,1 6,17 Z" fill={extraBet ? "#E02424" : "#1E64C8"} stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L6,17 A30,30 0 0,1 32,2 Z" fill="#F5B81D" stroke="#FFE066" strokeWidth="1" />
            <circle cx="32" cy="32" r="9" fill="#FFD54F" stroke="#7A4E02" strokeWidth="1.6" />
          </svg>
        </div>
        <span
          className={`-mt-2.5 z-10 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FFE66D] border border-[#FFE066] shadow-md sm:text-[10px] ${
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

  const lotusPalette =
    item === 15
      ? { petal: "#FB7185", core: "#BE123C" }
      : item === 10
        ? { petal: "#F0ABFC", core: "#A21CAF" }
        : item === 5
          ? { petal: "#93C5FD", core: "#1D4ED8" }
          : item === 3
            ? { petal: "#5EEAD4", core: "#0F766E" }
            : item === 2
              ? { petal: "#86EFAC", core: "#15803D" }
              : { petal: "#CBD5E1", core: "#475569" };

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center transition-all ${
        active ? "scale-105" : "opacity-80 scale-90"
      }`}
    >
      <svg viewBox="0 0 90 90" className="h-[90%] w-[90%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.75)]" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={i}
            cx="45"
            cy="16"
            rx="12"
            ry="16"
            fill={lotusPalette.petal}
            stroke="#FFE680"
            strokeWidth="1.5"
            transform={`rotate(${i * 45}, 45, 45)`}
          />
        ))}
        <circle cx="45" cy="45" r="27" fill={lotusPalette.core} stroke="#FFE680" strokeWidth="2.6" />
        <circle cx="45" cy="45" r="22" fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.2" />
        <text
          x="45"
          y="53"
          textAnchor="middle"
          fill="#FFF6BD"
          stroke="#6A2B00"
          strokeWidth="3.5"
          paintOrder="stroke fill"
          fontSize="24"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Georgia, serif"
        >
          {item}x
        </text>
      </svg>
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
  if (val >= 1000) return `${+(val / 1000).toFixed(1).replace(/\.0$/, "")}K`;
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
        <div className="h-6 w-5 rounded-b-full border-2 border-[#FFE680] bg-[linear-gradient(180deg,#FF3B3B,#9E0B0F)] shadow-[0_3px_10px_rgba(0,0,0,0.9)]" />
      </div>

      {/* Ornate Aztec fretwork gold rim */}
      <div
        className="relative h-full w-full rounded-full border-[11px] border-[#D4A024] bg-[#2D1808] shadow-[0_0_36px_rgba(255,214,90,0.55),inset_0_0_16px_rgba(0,0,0,0.85)] ring-2 ring-[#7C4B00]"
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
                  stroke="#F5C954"
                  strokeWidth="1.6"
                />
                <text
                  x="152"
                  y="104"
                  textAnchor="middle"
                  fill="#FFF8C8"
                  stroke="#1C0C00"
                  strokeWidth="1.2"
                  paintOrder="stroke fill"
                  fontSize="11"
                  fontWeight="900"
                  fontFamily="sans-serif"
                  transform={`rotate(${midAngle}, 100, 100)`}
                >
                  {prizeText}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center Golden Lion/Garuda Medallion */}
        <div className="absolute inset-[33%] flex items-center justify-center rounded-full border-[3px] border-[#FFF3B0] bg-[radial-gradient(circle_at_35%_30%,#FFE885,#D49A12,#6E4302)] shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          <span className="text-2xl drop-shadow">🦁</span>
        </div>
      </div>
    </div>
  );
};
