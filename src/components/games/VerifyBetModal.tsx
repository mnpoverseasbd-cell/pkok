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
} from "@/lib/provablyFair";

export type VerifyGameKey =
  | "dice" | "limbo" | "crash" | "coinflip" | "wheel" | "plinko" | "mines";

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
