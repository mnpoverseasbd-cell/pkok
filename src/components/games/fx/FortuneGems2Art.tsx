import React from "react";
import type { Fg2SpecialItem, Fg2Symbol } from "@/lib/provablyFair";

function GarudaWildSvg() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-[#FFD65A] bg-[radial-gradient(circle_at_50%_40%,#8A5A12_0%,#3D1E04_75%,#1F0C01_100%)] p-1 shadow-[inset_0_0_12px_rgba(255,214,90,0.45)]">
      <svg viewBox="0 0 80 72" className="h-[82%] w-[88%] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]" aria-hidden>
        <defs>
          <linearGradient id="fg2-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF7C2" />
            <stop offset="45%" stopColor="#F5B81D" />
            <stop offset="100%" stopColor="#9A6008" />
          </linearGradient>
        </defs>
        <path
          d="M10 38C6 22 14 10 26 8l14 6 14-6c12 2 20 14 16 30-4 12-16 20-30 22-14-2-26-10-30-22z"
          fill="url(#fg2-gold)"
          stroke="#6A3E00"
          strokeWidth="2"
        />
        <path d="M32 6l8-4 8 4-3 10H35z" fill="#E02424" stroke="#FFE066" strokeWidth="1.4" />
        <path d="M22 27l10 3-8 4z" fill="#231202" />
        <path d="M58 27l-10 3 8 4z" fill="#231202" />
        <circle cx="28" cy="29" r="2.2" fill="#FFF8A8" />
        <circle cx="52" cy="29" r="2.2" fill="#FFF8A8" />
        <path d="M35 33l5 12 5-12-5-4z" fill="#D48806" stroke="#4D2900" strokeWidth="1.5" />
        <circle cx="40" cy="52" r="4.5" fill="#E01E26" stroke="#FFE066" strokeWidth="1.4" />
      </svg>
      <div
        className="absolute inset-x-1.5 bottom-0.5 rounded border border-[#FFE066] bg-[linear-gradient(180deg,#E51C23,#8C090D)] py-0.5 text-center font-serif text-[10px] font-black leading-none tracking-widest text-[#FFE66D] shadow-md sm:text-xs"
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
      ? { frame: "#E5B43B", bg: "#6E1418", c1: "#FF8DA1", c2: "#F01E3A", c3: "#7A0614", shape: "circle" as const }
      : type === "BLUE"
        ? { frame: "#E5B43B", bg: "#10326E", c1: "#90E0FF", c2: "#1677FF", c3: "#062A7A", shape: "octagon" as const }
        : { frame: "#E5B43B", bg: "#114D24", c1: "#9DFFAF", c2: "#18C943", c3: "#085C1C", shape: "hex" as const };

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 p-1 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]"
      style={{
        borderColor: cfg.frame,
        background: `radial-gradient(circle at 50% 45%, ${cfg.bg} 0%, #241409 100%)`,
      }}
    >
      <span aria-hidden className="pointer-events-none absolute top-0.5 left-0.5 h-2.5 w-2.5 border-t-2 border-l-2 border-[#FFD65A]" />
      <span aria-hidden className="pointer-events-none absolute top-0.5 right-0.5 h-2.5 w-2.5 border-t-2 border-r-2 border-[#FFD65A]" />
      <span aria-hidden className="pointer-events-none absolute bottom-0.5 left-0.5 h-2.5 w-2.5 border-b-2 border-l-2 border-[#FFD65A]" />
      <span aria-hidden className="pointer-events-none absolute bottom-0.5 right-0.5 h-2.5 w-2.5 border-b-2 border-r-2 border-[#FFD65A]" />

      <svg viewBox="0 0 64 64" className="h-[84%] w-[84%] drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)]" aria-hidden>
        <defs>
          <radialGradient id={`fg2-gem-${type}`} cx="36%" cy="32%" r="70%">
            <stop offset="0%" stopColor={cfg.c1} />
            <stop offset="52%" stopColor={cfg.c2} />
            <stop offset="100%" stopColor={cfg.c3} />
          </radialGradient>
        </defs>
        {cfg.shape === "circle" && (
          <>
            <circle cx="32" cy="32" r="24" fill={`url(#fg2-gem-${type})`} stroke="#FFD65A" strokeWidth="2.2" />
            <polygon points="32,12 48,24 44,46 20,46 16,24" fill="rgba(255,255,255,0.24)" />
            <polygon points="32,18 42,27 38,40 26,40 22,27" fill="rgba(255,255,255,0.28)" />
          </>
        )}
        {cfg.shape === "octagon" && (
          <>
            <polygon points="22,8 42,8 56,22 56,42 42,56 22,56 8,42 8,22" fill={`url(#fg2-gem-${type})`} stroke="#FFD65A" strokeWidth="2.2" />
            <polygon points="24,16 40,16 48,24 48,40 40,48 24,48 16,40 16,24" fill="rgba(255,255,255,0.22)" />
            <polygon points="27,22 37,22 42,27 42,37 37,42 27,42 22,37 22,27" fill="rgba(255,255,255,0.3)" />
          </>
        )}
        {cfg.shape === "hex" && (
          <>
            <polygon points="32,7 54,19 54,45 32,57 10,45 10,19" fill={`url(#fg2-gem-${type})`} stroke="#FFD65A" strokeWidth="2.2" />
            <polygon points="32,15 47,23 47,41 32,49 17,41 17,23" fill="rgba(255,255,255,0.25)" />
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
        ? "#C026D3"
        : rank === "Q"
          ? "#1677FF"
          : "#18C943";

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 border-[#D4A024]/85 bg-[radial-gradient(circle_at_50%_35%,#8C6843_0%,#5B3F24_65%,#3B2613_100%)] shadow-[inset_0_1px_4px_rgba(255,235,170,0.25)]">
      {/* Subtle carved inner stone border */}
      <div aria-hidden className="pointer-events-none absolute inset-1 rounded border border-[#FFE066]/20" />
      <span
        className="bg-[linear-gradient(180deg,#FFF6C4_0%,#F4C04A_50%,#A86B10_100%)] bg-clip-text font-serif text-3xl font-black tracking-tight text-transparent sm:text-4xl"
        style={{ filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.9))" }}
      >
        {rank}
      </span>
      <span
        aria-hidden
        className="absolute right-1.5 bottom-1.5 h-3 w-3 rotate-45 rounded-[2px] border border-[#FFE680]"
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
    ? "z-20 scale-[1.03] ring-2 ring-[#FFF59D] shadow-[0_0_22px_rgba(255,220,70,0.95)] brightness-110"
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
        className={`relative flex h-full w-full flex-col items-center justify-center p-1 transition-all ${
          active ? "scale-105" : "opacity-80 scale-90"
        }`}
      >
        <div className="relative aspect-square h-[76%] max-w-[82%] rounded-full border-2 border-[#FFE680] shadow-lg overflow-hidden">
          <svg viewBox="0 0 64 64" className="h-full w-full">
            <path d="M32,32 L32,2 A30,30 0 0,1 58,17 Z" fill={extraBet ? "#E02424" : "#1E64C8"} stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L58,17 A30,30 0 0,1 58,47 Z" fill="#F5B81D" stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L58,47 A30,30 0 0,1 32,62 Z" fill={extraBet ? "#B81212" : "#2D7A4D"} stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L32,62 A30,30 0 0,1 6,47 Z" fill="#A626A4" stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L6,47 A30,30 0 0,1 6,17 Z" fill={extraBet ? "#E02424" : "#1E64C8"} stroke="#FFE066" strokeWidth="1" />
            <path d="M32,32 L6,17 A30,30 0 0,1 32,2 Z" fill="#F5B81D" stroke="#FFE066" strokeWidth="1" />
            <circle cx="32" cy="32" r="8" fill="#FFD54F" stroke="#7A4E02" strokeWidth="1.5" />
          </svg>
        </div>
        <span
          className={`-mt-2 z-10 rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#FFE66D] border border-[#FFE066] shadow sm:text-[9px] ${
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
      ? { petal: "#F43F5E", core: "#9F1239" }
      : item === 10
        ? { petal: "#E879F9", core: "#86198F" }
        : item === 5
          ? { petal: "#60A5FA", core: "#1E40AF" }
          : item === 3
            ? { petal: "#2DD4BF", core: "#115E59" }
            : item === 2
              ? { petal: "#4ADE80", core: "#166534" }
              : { petal: "#94A3B8", core: "#334155" };

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center transition-all ${
        active ? "scale-105" : "opacity-75 scale-90"
      }`}
    >
      <svg viewBox="0 0 80 80" className="h-[88%] w-[88%] drop-shadow-[0_3px_8px_rgba(0,0,0,0.7)]" aria-hidden>
        {/* 8-petal lotus medallion */}
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={i}
            cx="40"
            cy="15"
            rx="10"
            ry="14"
            fill={lotusPalette.petal}
            stroke="#FFE680"
            strokeWidth="1.4"
            transform={`rotate(${i * 45}, 40, 40)`}
          />
        ))}
        <circle cx="40" cy="40" r="24" fill={lotusPalette.core} stroke="#FFE680" strokeWidth="2.4" />
        <circle cx="40" cy="40" r="20" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
      </svg>
      <span
        className="pointer-events-none absolute font-serif text-lg font-black italic text-[#FFF5B8] sm:text-2xl"
        style={{ textShadow: "0 2px 0 #7C3D00, 0 3px 6px rgba(0,0,0,0.9)" }}
      >
        {item}x
      </span>
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
      {/* Red jewel top pointer */}
      <div className="pointer-events-none absolute -top-2 z-30 flex flex-col items-center">
        <div className="h-5 w-4 rounded-b-full border-2 border-[#FFE066] bg-[#D92B2B] shadow-[0_2px_8px_rgba(0,0,0,0.85)]" />
      </div>

      {/* Ornate double gold bezel rotating wheel */}
      <div
        className="relative h-full w-full rounded-full border-[8px] border-[#D4A024] bg-[#2D1808] shadow-[0_0_32px_rgba(255,214,90,0.5),inset_0_0_12px_rgba(0,0,0,0.8)] ring-2 ring-[#7C4B00]"
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
                  strokeWidth="1.4"
                />
                <text
                  x="152"
                  y="103"
                  textAnchor="middle"
                  fill="#FFF8C8"
                  fontSize="10.5"
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

        <div className="absolute inset-[34%] flex items-center justify-center rounded-full border-2 border-[#FFF3B0] bg-[radial-gradient(circle_at_35%_30%,#FFE57F,#D49A12,#7A4E02)] shadow-xl">
          <span className="text-xl">🦁</span>
        </div>
      </div>
    </div>
  );
};
