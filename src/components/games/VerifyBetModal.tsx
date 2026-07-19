import { useEffect, useMemo, useState } from "react";
import { X, ShieldCheck, Loader2 } from "lucide-react";
import {
  hmacSha256,
  sha256Hex,
  fairFloats,
  fairDice,
  fairLimbo,
  fairCrash,
  fairCoinflip,
  fairWheel,
  fairPlinko,
  fairMines,
  fairAndarBahar,
  fairDragonTiger,
  fairTeenPatti,
  fairSevenUpDown,
  fairBaccarat,
  fairSicBo,
  fairRoulette,
  fairBlackjackDeck,
  bjTotal,
  fair32Cards,
  t32CardLabel,
} from "@/lib/provablyFair";

export type VerifyGameKey =
  | "dice" | "limbo" | "crash" | "coinflip" | "wheel" | "plinko" | "mines"
  | "chicken-road" | "tower" | "lucky-card" | "shell-game"
  | "scratch-card" | "keno" | "hi-lo" | "color-prediction"
  | "andar-bahar" | "dragon-tiger" | "teen-patti" | "seven-up-down" | "baccarat"
  | "sic-bo" | "roulette" | "blackjack" | "32-cards" | "video-poker";


export type VerifyPrefill = {
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
  serverSeedHash?: string; // committed hash of the seed used, for comparison
};

type Props = {
  open: boolean;
  onClose: () => void;
  gameKey: VerifyGameKey;
  prefill?: VerifyPrefill;
};

function toHex(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, "0");
  return s;
}

export function VerifyBetModal({ open, onClose, gameKey, prefill }: Props) {
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | {
    message: string;
    hmacHex: string;
    firstBytes: number[];
    floats: number[];
    hashOfServer: string;
    outcome: string;
    extra?: React.ReactNode;
  }>(null);

  useEffect(() => {
    if (!open) return;
    setServerSeed(prefill?.serverSeed ?? "");
    setClientSeed(prefill?.clientSeed ?? "");
    setNonce(prefill?.nonce ?? 0);
    setResult(null);
  }, [open, prefill]);

  const canVerify = serverSeed.length > 0 && clientSeed.length > 0 && nonce >= 0;

  const compute = async () => {
    setBusy(true);
    try {
      const message = `${clientSeed}:${nonce}:0`;
      const bytes = await hmacSha256(serverSeed, message);
      const hmacHex = toHex(bytes);
      const hashOfServer = await sha256Hex(serverSeed);

      let floats: number[] = [];
      let outcome = "";
      let extra: React.ReactNode = null;

      switch (gameKey) {
        case "dice": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const roll = await fairDice(serverSeed, clientSeed, nonce);
          outcome = `Roll = ${roll} (float × 100)`;
          break;
        }
        case "limbo": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const m = await fairLimbo(serverSeed, clientSeed, nonce, 0.01);
          outcome = `Multiplier = ${m}× · formula: (1 − 0.01) / float`;
          break;
        }
        case "crash": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const m = await fairCrash(serverSeed, clientSeed, nonce, 0.01);
          outcome = `Crash @ ${m}× · float<0.03 ⇒ 1.00× (instant bust)`;
          break;
        }
        case "coinflip": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const heads = await fairCoinflip(serverSeed, clientSeed, nonce);
          outcome = `${heads ? "HEADS" : "TAILS"} · float ${heads ? "<" : "≥"} 0.5`;
          break;
        }
        case "wheel": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const idx = await fairWheel(serverSeed, clientSeed, nonce, 20);
          outcome = `Segment index = ${idx} · floor(float × 20)`;
          break;
        }
        case "plinko": {
          const rows = 10;
          floats = await fairFloats(serverSeed, clientSeed, nonce, rows);
          const path = await fairPlinko(serverSeed, clientSeed, nonce, rows);
          const bucket = path.reduce<number>((a, b) => a + b, 0);
          outcome = `Path = [${path.join(", ")}] → bucket ${bucket}`;
          extra = (
            <div className="mt-2 text-[10px] text-white/50">
              প্রতিটি float &lt; 0.5 হলে বামে (0), অন্যথায় ডানে (1)।
            </div>
          );
          break;
        }
        case "mines": {
          const total = 25, count = 3;
          floats = await fairFloats(serverSeed, clientSeed, nonce, total);
          const mines = await fairMines(serverSeed, clientSeed, nonce, total, count);
          outcome = `Mines (grid=25, count=3) at cells: [${mines.join(", ")}]`;
          extra = (
            <div className="mt-2 text-[10px] text-white/50">
              Fisher-Yates shuffle {total} সেল, তারপর প্রথম {count} নেয়।
            </div>
          );
          break;
        }
        case "chicken-road": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 12);
          outcome = `Lane survivals derived from floats < survival threshold`;
          break;
        }
        case "tower": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 8);
          outcome = `Safe tile per floor = floor(f × TILES)`;
          break;
        }
        case "lucky-card": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 2);
          const rank = 1 + Math.floor(floats[0] * 13);
          const suit = Math.floor(floats[1] * 4);
          outcome = `Rank=${rank}, Suit=${["♠","♥","♦","♣"][suit]}`;
          break;
        }
        case "shell-game": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          outcome = `Ball under cup ${Math.floor(floats[0] * 3)} (0..2)`;
          break;
        }
        case "scratch-card": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 12);
          outcome = `9-cell grid derived from float indices`;
          break;
        }
        case "keno": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 20);
          outcome = `20 draws from 1..80 via Fisher-Yates on floats`;
          break;
        }
        case "hi-lo": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const r = 1 + Math.floor(floats[0] * 13);
          outcome = `Next card rank = ${r}`;
          break;
        }
        case "color-prediction": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const idx = Math.floor(floats[0] * 3);
          outcome = `Wheel color index = ${idx} (${["Red","Green","Violet"][idx]})`;
          break;
        }
        case "andar-bahar": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
          const r = await fairAndarBahar(serverSeed, clientSeed, nonce);
          const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
          const SUITS = ["♠","♥","♦","♣"];
          const card = (c: number) => `${RANKS[c % 13]}${SUITS[Math.floor(c / 13)]}`;
          outcome = `Joker=${card(r.joker)} · Winner=${r.winner === "A" ? "Andar" : "Bahar"} · Cards drawn=${r.cardsDrawn}`;
          break;
        }
        case "dragon-tiger": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
          const r = await fairDragonTiger(serverSeed, clientSeed, nonce);
          const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
          const SUITS = ["♠","♥","♦","♣"];
          const card = (c: number) => `${RANKS[c % 13]}${SUITS[Math.floor(c / 13)]}`;
          const w = r.winner === "TIE" ? "Tie" : r.winner === "D" ? "Dragon" : "Tiger";
          outcome = `Dragon=${card(r.dragon)} · Tiger=${card(r.tiger)} · Winner=${w}`;
          break;
        }
        case "teen-patti": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
          const r = await fairTeenPatti(serverSeed, clientSeed, nonce);
          const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
          const SUITS = ["♠","♥","♦","♣"];
          const card = (c: number) => `${RANKS[c % 13]}${SUITS[Math.floor(c / 13)]}`;
          const w = r.winner === "TIE" ? "Tie" : r.winner === "P" ? "Player" : "Dealer";
          outcome = `Player=[${r.player.map(card).join(" ")}] (${r.playerCategory}) · Dealer=[${r.dealer.map(card).join(" ")}] (${r.dealerCategory}) · Winner=${w}`;
          break;
        }
        case "seven-up-down": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 2);
          const r = await fairSevenUpDown(serverSeed, clientSeed, nonce);
          outcome = `Dice = [${r.d1}, ${r.d2}] · Sum = ${r.sum} · Result = ${r.result === "SEVEN" ? "Lucky 7" : r.result === "UP" ? "Up (>7)" : "Down (<7)"}`;
          break;
        }
        case "baccarat": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
          const r = await fairBaccarat(serverSeed, clientSeed, nonce);
          const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
          const SUITS = ["♠","♥","♦","♣"];
          const card = (c: number) => `${RANKS[c % 13]}${SUITS[Math.floor(c / 13)]}`;
          const w = r.winner === "TIE" ? "Tie" : r.winner === "P" ? "Player" : "Banker";
          outcome = `Player=[${r.player.map(card).join(" ")}]=${r.playerTotal} · Banker=[${r.banker.map(card).join(" ")}]=${r.bankerTotal} · Winner=${w}${r.isNatural ? " (Natural)" : ""}`;
          break;
        }
        case "sic-bo": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 3);
          const r = await fairSicBo(serverSeed, clientSeed, nonce);
          const label = r.isTriple ? `Triple ${r.tripleFace}` : `${r.size} · ${r.parity}`;
          outcome = `Dice = [${r.d1}, ${r.d2}, ${r.d3}] · Sum = ${r.sum} · ${label}`;
          break;
        }
        case "roulette": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 1);
          const r = await fairRoulette(serverSeed, clientSeed, nonce);
          outcome = `Pocket = ${r.pocket} · ${r.color}${r.pocket === 0 ? "" : ` · ${r.parity} · ${r.size} · Dozen ${r.dozen}`}`;
          break;
        }
        case "blackjack": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 52);
          const deck = await fairBlackjackDeck(serverSeed, clientSeed, nonce);
          const RANKS = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
          const SUITS = ["♠","♥","♦","♣"];
          const card = (c: number) => `${RANKS[c % 13]}${SUITS[Math.floor(c / 13)]}`;
          const initP = [deck[0], deck[2]];
          const initD = [deck[1], deck[3]];
          outcome = `Deal order: P=[${initP.map(card).join(" ")}] (${bjTotal(initP).total}) · D=[${initD.map(card).join(" ")}?] (upcard ${bjTotal([initD[0]]).total}) · Next cards: ${deck.slice(4, 10).map(card).join(" ")}...`;
          break;
        }
        case "32-cards": {
          floats = await fairFloats(serverSeed, clientSeed, nonce, 32);
          const r = await fair32Cards(serverSeed, clientSeed, nonce);
          const label = (p: "A"|"B"|"C"|"D") => ({A:"Player 8",B:"Player 9",C:"Player 10",D:"Player 11"}[p]);
          const w = r.winner === "TIE" ? "Tie (House wins)" : label(r.winner);
          outcome = `Totals: P8=${r.totals.A} · P9=${r.totals.B} · P10=${r.totals.C} · P11=${r.totals.D} · Winner=${w}`;
          extra = (
            <div className="mt-2 text-[10px] text-white/50">
              First 4 cards dealt: {r.deck.slice(0, 4).map(t32CardLabel).join(" · ")}
            </div>
          );
          break;
        }
      }




      setResult({
        message,
        hmacHex,
        firstBytes: Array.from(bytes.slice(0, 16)),
        floats,
        hashOfServer,
        outcome,
        extra,
      });
    } finally {
      setBusy(false);
    }
  };

  const hashMatch = useMemo(() => {
    if (!result || !prefill?.serverSeedHash) return null;
    return result.hashOfServer === prefill.serverSeedHash;
  }, [result, prefill]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3" onClick={onClose}>
      <div
        className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#1a3321] bg-[#0a120b] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-[#00ff88]" />
          <h2 className="text-lg font-black text-white">Verify Bet · <span className="uppercase text-[#00ff88]">{gameKey}</span></h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Server Seed (revealed)" value={serverSeed} onChange={setServerSeed} mono />
          <Field label="Client Seed" value={clientSeed} onChange={setClientSeed} mono />
          <label className="col-span-full flex flex-col gap-1 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">Nonce</span>
            <input
              type="number" min={0} value={nonce}
              onChange={(e) => setNonce(Math.max(0, Number(e.target.value) || 0))}
              className="rounded border border-[#1a3321] bg-[#112216] px-2 py-1.5 font-mono text-sm text-white focus:border-[#00ff88] focus:outline-none"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={compute}
              disabled={!canVerify || busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-[#00ff88] px-4 py-2 text-sm font-black text-[#050a06] hover:bg-[#00e07a] disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Compute
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-5 space-y-3 text-xs">
            <Step n={1} title="SHA-256(serverSeed) — commitment check">
              <div className="break-all font-mono text-[11px] text-white/80">{result.hashOfServer}</div>
              {prefill?.serverSeedHash && (
                <div className={`mt-1 text-[10px] font-black ${hashMatch ? "text-[#00ff88]" : "text-[#ff4444]"}`}>
                  {hashMatch ? "✓ Matches previously committed hash" : "✗ Does NOT match committed hash"}
                </div>
              )}
              {prefill?.serverSeedHash && (
                <div className="mt-1 break-all font-mono text-[10px] text-white/40">expected: {prefill.serverSeedHash}</div>
              )}
            </Step>

            <Step n={2} title="HMAC message">
              <div className="font-mono text-[11px] text-white/80">key = serverSeed</div>
              <div className="font-mono text-[11px] text-white/80">msg = "{result.message}"</div>
            </Step>

            <Step n={3} title="HMAC-SHA256 output (hex)">
              <div className="break-all font-mono text-[11px] text-white/80">{result.hmacHex}</div>
              <div className="mt-1 text-[10px] text-white/50">
                প্রথম 16 বাইট: [{result.firstBytes.join(", ")}]
              </div>
            </Step>

            <Step n={4} title="Bytes → floats in [0,1)">
              <div className="text-[10px] text-white/60">
                প্রতিটি 4-byte গ্রুপ: b0/256 + b1/65536 + b2/16777216 + b3/2^32
              </div>
              <div className="mt-1 space-y-0.5 font-mono text-[11px] text-white/80">
                {result.floats.slice(0, 12).map((f, i) => (
                  <div key={i}>f[{i}] = {f.toFixed(10)}</div>
                ))}
                {result.floats.length > 12 && <div className="text-white/40">…+{result.floats.length - 12} more</div>}
              </div>
            </Step>

            <Step n={5} title="Game outcome">
              <div className="font-black text-[var(--neon-gold)]">{result.outcome}</div>
              {result.extra}
            </Step>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`rounded border border-[#1a3321] bg-[#112216] px-2 py-1.5 text-sm text-white focus:border-[#00ff88] focus:outline-none ${mono ? "font-mono text-[11px]" : ""}`}
      />
    </label>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[#1a3321] bg-[#112216] p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-[#00ff88] text-[10px] font-black text-[#050a06]">{n}</span>
        <span className="text-[11px] font-black uppercase tracking-widest text-white/80">{title}</span>
      </div>
      {children}
    </div>
  );
}
