import React from "react";
import type { SuperAceCell } from "@/lib/provablyFair";

export type CardVisualState = "normal" | "win" | "dim" | "flip" | "clone" | "drop";

const SUIT_META = {
  S: { color: "#1D2430", label: "♠" },
  H: { color: "#9E1C1C", label: "♥" },
  D: { color: "#C9522B", label: "♦" },
  C: { color: "#2D63A8", label: "♣" },
} as const;

function SuitSvg({ type, className = "w-7 h-7" }: { type: "S" | "H" | "D" | "C"; className?: string }) {
  if (type === "S") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        <defs>
          <linearGradient id="sa-spade-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2A3342" />
            <stop offset="100%" stopColor="#12161E" />
          </linearGradient>
        </defs>
        <path
          d="M32 6C22 18 9 28 9 39c0 8.2 6.3 13.6 13.5 13.6 4.1 0 7.1-1.9 8.7-4.4-.5 4.8-2.3 8.2-6 10.6h13.6c-3.7-2.4-5.5-5.8-6-10.6 1.6 2.5 4.6 4.4 8.7 4.4 7.2 0 13.5-5.4 13.5-13.6C55 28 42 18 32 6z"
          fill="url(#sa-spade-g)"
        />
      </svg>
    );
  }
  if (type === "H") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        <defs>
          <linearGradient id="sa-heart-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D32F2F" />
            <stop offset="100%" stopColor="#821010" />
          </linearGradient>
        </defs>
        <path
          d="M32 56C18 45 7 35.5 7 22.8 7 14.3 13.4 8 21.3 8c4.9 0 8.6 2.5 10.7 6 2.1-3.5 5.8-6 10.7-6C50.6 8 57 14.3 57 22.8 57 35.5 46 45 32 56z"
          fill="url(#sa-heart-g)"
        />
      </svg>
    );
  }
  if (type === "D") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden>
        <defs>
          <linearGradient id="sa-dia-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#EA6A3A" />
            <stop offset="100%" stopColor="#A63816" />
          </linearGradient>
        </defs>
        <path d="M32 6L55 32 32 58 9 32z" fill="url(#sa-dia-g)" />
        <path d="M32 6L55 32 32 32z" fill="rgba(255,255,255,0.14)" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="sa-club-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4181D4" />
          <stop offset="100%" stopColor="#204D8C" />
        </linearGradient>
      </defs>
      <path
        d="M32 7a11.5 11.5 0 0 0-8.6 19.1A12.2 12.2 0 0 0 8 37.5c0 6.8 5.4 12.2 12.2 12.2 4.3 0 8.1-2.2 10.2-5.6-.5 5.6-2.4 9.7-6.2 12.9h15.6c-3.8-3.2-5.7-7.3-6.2-12.9 2.1 3.4 5.9 5.6 10.2 5.6C50.6 49.7 56 44.3 56 37.5a12.2 12.2 0 0 0-15.4-11.4A11.5 11.5 0 0 0 32 7z"
        fill="url(#sa-club-g)"
      />
    </svg>
  );
}

function AceArt() {
  return (
    <svg viewBox="0 0 64 72" className="h-[74%] w-[78%]" aria-hidden>
      <defs>
        <linearGradient id="sa-ace-spade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#28282E" />
          <stop offset="100%" stopColor="#0E0E12" />
        </linearGradient>
        <linearGradient id="sa-ace-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF0A6" />
          <stop offset="50%" stopColor="#F4B41A" />
          <stop offset="100%" stopColor="#B8790E" />
        </linearGradient>
      </defs>
      <path
        d="M32 6C21 19 8 29 8 41c0 8.5 6.5 14 14 14 4.2 0 7.4-2 9-4.6-.5 5.2-2.3 9-6.2 11.8h14.4c-3.9-2.8-5.7-6.6-6.2-11.8 1.6 2.6 4.8 4.6 9 4.6 7.5 0 14-5.5 14-14C56 29 43 19 32 6z"
        fill="url(#sa-ace-spade)"
        stroke="url(#sa-ace-gold)"
        strokeWidth="2.8"
      />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill="url(#sa-ace-gold)"
        fontSize="12"
        fontWeight="900"
        fontFamily="Georgia, serif"
        letterSpacing="1"
      >
        ACE
      </text>
    </svg>
  );
}

function CourtArt({ rank }: { rank: "K" | "Q" | "J" }) {
  const palette =
    rank === "K"
      ? { coat: "#1C4E9C", coatDark: "#0F2F64", sash: "#F4B41A", crown: "#FFD54F", gem: "#E53935" }
      : rank === "Q"
        ? { coat: "#B71C1C", coatDark: "#6E0E0E", sash: "#FFE082", crown: "#DCE2EA", gem: "#E02424" }
        : { coat: "#1F3A7A", coatDark: "#122450", sash: "#E2C07D", crown: "#F2D8A7", gem: "#28D152" };

  return (
    <svg viewBox="0 0 64 72" className="h-[76%] w-[80%]" aria-hidden>
      {/* Shoulders / robe */}
      <path d="M12 66c1-13 9-20 20-20s19 7 20 20H12z" fill={palette.coat} stroke="#D4A138" strokeWidth="1.6" />
      <path d="M24 46l8 12 8-12" fill="none" stroke={palette.sash} strokeWidth="3" strokeLinecap="round" />
      {/* Face */}
      <ellipse cx="32" cy="33" rx="10.5" ry="12" fill="#F6D0B1" stroke="#8C593B" strokeWidth="1.2" />
      {/* Hair / beard detail */}
      {rank === "K" && (
        <path d="M22 36c2 6 6 9 10 9s8-3 10-9c-2 2-5 3-10 3s-8-1-10-3z" fill="#6D4C41" />
      )}
      {rank === "Q" && (
        <path d="M20 28c-2 6-1 14 2 17M44 28c2 6 1 14-2 17" stroke="#3E2723" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      )}
      {rank === "J" && (
        <path d="M21 25c2 3 2 9 0 13" stroke="#E0BE86" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {/* Eyes */}
      <circle cx="28" cy="31" r="1.4" fill="#231F20" />
      <circle cx="36" cy="31" r="1.4" fill="#231F20" />
      {/* Crown / Cap */}
      <path
        d={rank === "J" ? "M20 24c0-7 6-12 12-12s12 5 12 12H20z" : "M19 23l3-11 6 6 4-9 4 9 6-6 3 11H19z"}
        fill={palette.crown}
        stroke="#8C5E14"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="17" r="2.2" fill={palette.gem} />
    </svg>
  );
}

function JokerArt({ big }: { big: boolean }) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between p-1">
      {/* Top corner WILD mark */}
      <div className="flex w-full items-center justify-between px-0.5 text-[9px] font-black leading-none tracking-tight">
        <span className={big ? "text-[#9E1010]" : "text-[#144CA8]"}>W</span>
        <span className="text-[8px]">{big ? "👑" : "★"}</span>
      </div>
      {/* Center Jester Hat */}
      <svg viewBox="0 0 80 62" className="h-[58%] w-[90%] drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]" aria-hidden>
        {big ? (
          <>
            <path
              d="M12 46L6 16l19 14L40 8l15 22 19-14-6 30H12z"
              fill="#E02424"
              stroke="#FFE066"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <path d="M25 30l15-22 15 22" fill="#FFB703" opacity="0.9" />
            <circle cx="6" cy="15" r="4.5" fill="#FFE066" stroke="#8C5300" strokeWidth="1.4" />
            <circle cx="40" cy="7" r="5" fill="#FFE066" stroke="#8C5300" strokeWidth="1.4" />
            <circle cx="74" cy="15" r="4.5" fill="#FFE066" stroke="#8C5300" strokeWidth="1.4" />
          </>
        ) : (
          <>
            <path
              d="M15 46C9 34 7 22 11 12c9 3 16 10 19 19l10-22 10 22c3-9 10-16 19-19 4 10 2 22-4 34H15z"
              fill="#1D6FE8"
              stroke="#FFE066"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            <path d="M29 45L40 9l11 36z" fill="#28D152" stroke="#FFE066" strokeWidth="2" />
            <circle cx="11" cy="12" r="4" fill="#FFD23F" stroke="#0C3270" strokeWidth="1.2" />
            <circle cx="40" cy="8" r="4.5" fill="#FFD23F" stroke="#0E6B24" strokeWidth="1.2" />
            <circle cx="69" cy="12" r="4" fill="#FFD23F" stroke="#0C3270" strokeWidth="1.2" />
          </>
        )}
      </svg>
      {/* WILD ribbon */}
      <div
        className={`w-[96%] rounded-sm border px-1 py-0.5 text-center text-[11px] font-black leading-none tracking-wider shadow-md sm:text-xs ${
          big
            ? "border-[#FFE066] bg-[linear-gradient(180deg,#E52424,#8E0D0D)] text-[#FFE66D]"
            : "border-[#FFE066] bg-[linear-gradient(180deg,#1F6CE0,#103B8A)] text-[#FFE66D]"
        }`}
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.85)" }}
      >
        WILD
      </div>
    </div>
  );
}

function ScatterArt() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center p-1">
      <div className="relative grid h-[66%] w-[78%] place-items-center rounded-full border-2 border-[#FFE680] bg-[radial-gradient(circle_at_35%_30%,#FFF4B8_0%,#FFB703_55%,#B36800_100%)] shadow-[0_0_16px_rgba(255,193,7,0.65)]">
        <span className="font-serif text-2xl font-black text-[#6E3500] drop-shadow-[0_1px_0_rgba(255,248,200,0.8)] sm:text-3xl">
          $
        </span>
      </div>
      <div
        className="-mt-2 w-[98%] rounded-sm border border-[#FFE066] bg-[linear-gradient(180deg,#D91616,#7F0808)] px-1 py-0.5 text-center text-[9px] font-black uppercase tracking-wider text-[#FFE47A] shadow-md sm:text-[10px]"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.9)" }}
      >
        SCATTER
      </div>
    </div>
  );
}

export const SuperAceCard: React.FC<{
  cell: SuperAceCell;
  state?: CardVisualState;
  dropDelayMs?: number;
}> = ({ cell, state = "normal", dropDelayMs = 0 }) => {
  const { sym, golden } = cell;
  const isWild = sym === "LITTLE_JOKER" || sym === "BIG_JOKER";
  const isScatter = sym === "SCATTER";

  // Card backing style
  const cardBg = isScatter
    ? "bg-[radial-gradient(circle_at_50%_40%,#612408_0%,#2E0E04_70%,#1A0602_100%)] border-[#F4C95D]"
    : golden || isWild
      ? "bg-[linear-gradient(155deg,#FFF4B8_0%,#F4C95D_34%,#D69E2E_76%,#AD7612_100%)] border-[#FFE680]"
      : "bg-[linear-gradient(180deg,#FFFFFF_0%,#EEF2F7_72%,#DCE3EE_100%)] border-[#B8C2CC]";

  const stateCls =
    state === "win"
      ? "z-20 scale-[1.04] brightness-110 ring-2 ring-[#FFF59D] shadow-[0_0_22px_rgba(255,220,90,0.95)]"
      : state === "dim"
        ? "brightness-[0.38] saturate-75"
        : state === "flip"
          ? "z-20 scale-105 ring-2 ring-[#FFE066] shadow-[0_0_22px_rgba(255,190,40,0.95)] [transform:rotateY(360deg)]"
          : state === "clone"
            ? "z-20 scale-105 ring-2 ring-[#FF4D4D] shadow-[0_0_24px_rgba(255,70,70,0.95)] animate-pulse"
            : "";

  const cornerMeta = (() => {
    if (sym === "A") return { txt: "A", color: "#141418", mini: "♠" };
    if (sym === "K") return { txt: "K", color: "#1C4E9C", mini: "♠" };
    if (sym === "Q") return { txt: "Q", color: "#B71C1C", mini: "♥" };
    if (sym === "J") return { txt: "J", color: "#1F3A7A", mini: "♣" };
    if (sym === "S" || sym === "H" || sym === "D" || sym === "C") {
      return { txt: SUIT_META[sym].label, color: SUIT_META[sym].color, mini: "" };
    }
    return null;
  })();

  return (
    <div
      className={`relative aspect-[3/4] w-full select-none overflow-hidden rounded-[6px] border-2 transition-all duration-300 shadow-[0_3px_8px_rgba(0,0,0,0.5)] ${cardBg} ${stateCls}`}
      style={{
        transitionDelay: state === "drop" ? `${dropDelayMs}ms` : "0ms",
      }}
    >
      {/* Inner specular sheen & golden corner filigree */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.38)_0%,transparent_42%,rgba(0,0,0,0.08)_100%)]"
      />
      {(golden || isWild || isScatter) && (
        <>
          <span aria-hidden className="pointer-events-none absolute top-0.5 right-0.5 h-2 w-2 border-t-2 border-r-2 border-[#FFF8C8]/80" />
          <span aria-hidden className="pointer-events-none absolute bottom-0.5 left-0.5 h-2 w-2 border-b-2 border-l-2 border-[#FFF8C8]/80" />
        </>
      )}

      {/* Card back overlay briefly visible mid-flip */}
      {state === "flip" && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0.5 rounded-[4px] border border-[#FFE066]/70 bg-[#B82026]/20"
        />
      )}

      {isWild ? (
        <JokerArt big={sym === "BIG_JOKER"} />
      ) : isScatter ? (
        <ScatterArt />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center p-1">
          {cornerMeta && (
            <div
              className="absolute top-0.5 left-1 flex flex-col items-center font-serif leading-none"
              style={{ color: cornerMeta.color }}
            >
              <span className="text-[11px] font-black sm:text-[13px]">{cornerMeta.txt}</span>
              {cornerMeta.mini && <span className="text-[8px] -mt-0.5">{cornerMeta.mini}</span>}
            </div>
          )}

          {sym === "A" && <AceArt />}
          {(sym === "K" || sym === "Q" || sym === "J") && <CourtArt rank={sym} />}
          {(sym === "S" || sym === "H" || sym === "D" || sym === "C") && (
            <SuitSvg type={sym} className="h-[58%] w-[64%] drop-shadow-[0_2px_3px_rgba(0,0,0,0.22)]" />
          )}

          {/* Subtle golden badge indicator on Golden Cards (reels 2-4) */}
          {golden && (
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0.5 right-0.5 rounded bg-[#7C4B00]/80 px-1 text-[7px] font-black uppercase tracking-wider text-[#FFE680]"
            >
              GOLD
            </span>
          )}
        </div>
      )}
    </div>
  );
};
