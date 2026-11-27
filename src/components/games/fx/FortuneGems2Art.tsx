import React from "react";
import type { Fg2SpecialItem, Fg2Symbol } from "@/lib/provablyFair";
import symWild from "@/assets/fg2/sym-wild.jpg";
import symRed from "@/assets/fg2/sym-red.jpg";
import symBlue from "@/assets/fg2/sym-blue.jpg";
import symGreen from "@/assets/fg2/sym-green.jpg";
import symA from "@/assets/fg2/sym-a.jpg";
import symK from "@/assets/fg2/sym-k.jpg";
import symQ from "@/assets/fg2/sym-q.jpg";
import symJ from "@/assets/fg2/sym-j.jpg";
import wheelLion from "@/assets/fg2/wheel-lion.jpg";

const SYMBOL_IMAGES: Record<Fg2Symbol, string> = {
  WILD: symWild,
  RED: symRed,
  BLUE: symBlue,
  GREEN: symGreen,
  A: symA,
  K: symK,
  Q: symQ,
  J: symJ,
};

export const Fg2SymbolTile: React.FC<{
  sym: Fg2Symbol;
  winning?: boolean;
  dim?: boolean;
}> = ({ sym, winning = false, dim = false }) => {
  const stateCls = winning
    ? "z-20 scale-[1.04] ring-2 ring-[#FFF59D] shadow-[0_0_26px_rgba(255,220,70,0.98)] brightness-115"
    : dim
      ? "brightness-[0.38] saturate-75"
      : "";

  return (
    <div
      className={`relative h-full w-full min-h-0 overflow-hidden rounded-[6px] border border-[#3B200B] bg-[#2D180A] shadow-[0_2px_6px_rgba(0,0,0,0.55)] transition-all duration-300 ${stateCls}`}
    >
      <img
        src={SYMBOL_IMAGES[sym]}
        alt={sym}
        draggable={false}
        className="h-full w-full object-cover"
      />
      {winning && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[6px] ring-2 ring-inset ring-[#FFE875] shadow-[inset_0_0_16px_rgba(255,225,90,0.65)]"
        />
      )}
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
        <div className="relative aspect-square h-[78%] max-w-[84%] overflow-hidden rounded-full border-[3px] border-[#F5C954] shadow-[0_4px_14px_rgba(0,0,0,0.85)] ring-1 ring-[#6E4402]">
          <svg viewBox="0 0 64 64" className="h-full w-full">
            <path d="M32,32 L32,2 A30,30 0 0,1 58,17 Z" fill={extraBet ? "#E02424" : "#1E64C8"} stroke="#FFE066" strokeWidth="1.2" />
            <path d="M32,32 L58,17 A30,30 0 0,1 58,47 Z" fill="#D49A12" stroke="#FFE066" strokeWidth="1.2" />
            <path d="M32,32 L58,47 A30,30 0 0,1 32,62 Z" fill={extraBet ? "#B81212" : "#2D7A4D"} stroke="#FFE066" strokeWidth="1.2" />
            <path d="M32,32 L32,62 A30,30 0 0,1 6,47 Z" fill="#9E1F9C" stroke="#FFE066" strokeWidth="1.2" />
            <path d="M32,32 L6,47 A30,30 0 0,1 6,17 Z" fill={extraBet ? "#E02424" : "#1E64C8"} stroke="#FFE066" strokeWidth="1.2" />
            <path d="M32,32 L6,17 A30,30 0 0,1 32,2 Z" fill="#D49A12" stroke="#FFE066" strokeWidth="1.2" />
            <circle cx="32" cy="32" r="9.5" fill="#F5C954" stroke="#5E3600" strokeWidth="1.8" />
          </svg>
        </div>
        <span
          className={`-mt-2.5 z-10 rounded-sm border border-[#FFE680] px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#FFE66D] shadow-md sm:text-[10px] ${
            extraBet
              ? "bg-[linear-gradient(180deg,#E51C23,#78050A)]"
              : "bg-[linear-gradient(180deg,#169B49,#085422)]"
          }`}
        >
          WHEEL
        </span>
      </div>
    );
  }

  const lotusTheme =
    item === 15
      ? { pLight: "#FF758F", pDark: "#B91C1C", coreTop: "#DC2626", coreBot: "#7F1D1D", numStroke: "#520707" }
      : item === 10
        ? { pLight: "#E879F9", pDark: "#86198F", coreTop: "#C026D3", coreBot: "#581C87", numStroke: "#3B0764" }
        : item === 5
          ? { pLight: "#60A5FA", pDark: "#1E40AF", coreTop: "#2563EB", coreBot: "#172554", numStroke: "#0F172A" }
          : item === 3
            ? { pLight: "#2DD4BF", pDark: "#0F766E", coreTop: "#0D9488", coreBot: "#134E4A", numStroke: "#042F2E" }
            : item === 2
              ? { pLight: "#4ADE80", pDark: "#15803D", coreTop: "#16A34A", coreBot: "#14532D", numStroke: "#052E16" }
              : { pLight: "#CBD5E1", pDark: "#475569", coreTop: "#64748B", coreBot: "#1E293B", numStroke: "#0F172A" };

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center transition-all ${
        active ? "scale-105" : "opacity-85 scale-90"
      }`}
    >
      <svg viewBox="0 0 100 100" className="h-[92%] w-[92%] drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]" aria-hidden>
        <defs>
          <linearGradient id={`fg2-goldrim-${item}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFF7C2" />
            <stop offset="45%" stopColor="#F4BC38" />
            <stop offset="100%" stopColor="#8C5305" />
          </linearGradient>
          <radialGradient id={`fg2-core-${item}`} cx="38%" cy="32%" r="72%">
            <stop offset="0%" stopColor={lotusTheme.pLight} />
            <stop offset="55%" stopColor={lotusTheme.coreTop} />
            <stop offset="100%" stopColor={lotusTheme.coreBot} />
          </radialGradient>
          <linearGradient id={`fg2-num-${item}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFCE0" />
            <stop offset="50%" stopColor="#FFE169" />
            <stop offset="100%" stopColor="#E08E0B" />
          </linearGradient>
        </defs>
        {/* Outer gold coin ring */}
        <circle cx="50" cy="50" r="46" fill={`url(#fg2-goldrim-${item})`} stroke="#4A2700" strokeWidth="2" />
        <circle cx="50" cy="50" r="41" fill={lotusTheme.coreBot} />
        {/* Layered pointed 3D lotus petals */}
        {Array.from({ length: 12 }).map((_, i) => (
          <path
            key={i}
            d="M50,11 Q58,26 50,42 Q42,26 50,11 Z"
            fill={`url(#fg2-core-${item})`}
            stroke="rgba(255,235,160,0.65)"
            strokeWidth="1"
            transform={`rotate(${i * 30}, 50, 50)`}
          />
        ))}
        <circle cx="50" cy="50" r="24" fill={`url(#fg2-core-${item})`} stroke="#FFE885" strokeWidth="1.5" />
        {/* Big tilted metallic gold multiplier matching JILI Fortune Gems 2 */}
        <text
          x="50"
          y="59"
          textAnchor="middle"
          fill={`url(#fg2-num-${item})`}
          stroke={lotusTheme.numStroke}
          strokeWidth="5"
          paintOrder="stroke fill"
          fontSize="30"
          fontWeight="900"
          fontStyle="italic"
          fontFamily="Georgia, serif"
          transform="rotate(-7, 50, 50)"
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
  "#9E1F9C",
  "#1C5FC4",
  "#267346",
  "#734F32",
  "#9E1F9C",
  "#1C5FC4",
  "#267346",
  "#734F32",
  "#9E1F9C",
  "#1C5FC4",
  "#267346",
  "#734F32",
];

function formatCompactPrize(val: number): string {
  if (val >= 1000) return `${+(val / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  if (val >= 10) return Math.round(val).toLocaleString("en-US");
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
      {/* Top Ruby Drop Pointer matching live JILI wheel */}
      <div className="pointer-events-none absolute -top-2.5 z-30 flex flex-col items-center">
        <div className="h-7 w-5 rounded-b-full border-2 border-[#FFE680] bg-[radial-gradient(circle_at_35%_30%,#FF758F,#D91627,#75040E)] shadow-[0_4px_12px_rgba(0,0,0,0.9)]" />
      </div>

      {/* Outer Aztec Meander Gold Rim */}
      <div
        className="relative h-full w-full rounded-full border-[12px] border-[#C9911A] bg-[#2D1808] shadow-[0_0_40px_rgba(255,214,90,0.5),inset_0_0_18px_rgba(0,0,0,0.85)] ring-2 ring-[#5E3802]"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
          transition: spinning ? "transform 2.6s cubic-bezier(0.12, 0.82, 0.16, 1)" : "transform 0.4s ease-out",
        }}
      >
        <svg viewBox="0 0 220 220" className="h-full w-full rounded-full">
          <defs>
            <linearGradient id="fg2-spoke-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFF6C4" />
              <stop offset="50%" stopColor="#E5A91A" />
              <stop offset="100%" stopColor="#8C5305" />
            </linearGradient>
          </defs>
          {/* Decorative Aztec blocks along inner bezel */}
          <circle cx="110" cy="110" r="106" fill="none" stroke="url(#fg2-spoke-g)" strokeWidth="6" strokeDasharray="8 4" opacity="0.7" />
          {LUCKY_WHEEL_WEDGES.map((mult, i) => {
            const a0 = ((i * sliceDeg - 90 - sliceDeg / 2) * Math.PI) / 180;
            const a1 = (((i + 1) * sliceDeg - 90 - sliceDeg / 2) * Math.PI) / 180;
            const x0 = 110 + 102 * Math.cos(a0);
            const y0 = 110 + 102 * Math.sin(a0);
            const x1 = 110 + 102 * Math.cos(a1);
            const y1 = 110 + 102 * Math.sin(a1);
            const midAngle = i * sliceDeg - 90;
            const prizeText = formatCompactPrize(bet * mult);
            return (
              <g key={`${mult}-${i}`}>
                <path
                  d={`M110,110 L${x0},${y0} A102,102 0 0,1 ${x1},${y1} Z`}
                  fill={WEDGE_COLORS[i]}
                  stroke="url(#fg2-spoke-g)"
                  strokeWidth="2.2"
                />
                <text
                  x="166"
                  y="114"
                  textAnchor="middle"
                  fill="#FFF8C8"
                  stroke="#1C0C00"
                  strokeWidth="1.8"
                  paintOrder="stroke fill"
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="sans-serif"
                  transform={`rotate(${midAngle}, 110, 110)`}
                >
                  {prizeText}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Center 3D Sculpted Gold Lion-Garuda Medallion */}
        <div className="absolute inset-[32%] overflow-hidden rounded-full border-[3px] border-[#FFF3B0] bg-[#2D1808] shadow-[0_6px_22px_rgba(0,0,0,0.9)]">
          <img
            src={wheelLion}
            alt="Lucky Wheel Guardian"
            draggable={false}
            className="h-full w-full scale-110 object-cover"
          />
        </div>
      </div>
    </div>
  );
};
