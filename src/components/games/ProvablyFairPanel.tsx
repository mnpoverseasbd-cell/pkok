import { useState } from "react";
import { ShieldCheck, RefreshCw, Copy, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { useProvablyFair } from "@/hooks/useProvablyFair";

type Pf = ReturnType<typeof useProvablyFair>;

export function ProvablyFairPanel({ pf }: { pf: Pf }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [clientDraft, setClientDraft] = useState(pf.clientSeed);
  const [revealed, setRevealed] = useState<{ seed: string; hash: string } | null>(null);

  const copy = async (label: string, value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(label); setTimeout(() => setCopied(null), 1200); } catch { /* ignore */ }
  };

  const rotate = async () => {
    const r = await pf.rotateServerSeed();
    if (r) setRevealed({ seed: r.revealedSeed, hash: r.revealedHash });
  };

  if (!pf.ready) return null;

  return (
    <div className="rounded-xl border border-[#1a3321] bg-[#0a120b]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-bold text-white hover:bg-white/5"
      >
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#00ff88]" />
          Provably Fair
          <span className="rounded bg-[#00ff88]/15 px-1.5 py-0.5 text-[10px] font-black text-[#00ff88]">
            Nonce {pf.nonce}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-white/60" /> : <ChevronDown className="h-4 w-4 text-white/60" />}
      </button>

      {open && (
        <div className="space-y-3 border-t border-[#1a3321] p-4 text-xs">
          <Field label="Server Seed (Hashed)" value={pf.serverSeedHash} onCopy={(v) => copy("hash", v)} copied={copied === "hash"} />
          <Field label="Next Server Seed (Hashed)" value={pf.nextServerSeedHash} onCopy={(v) => copy("next", v)} copied={copied === "next"} />

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Client Seed (editable)</label>
            <div className="flex gap-1">
              <input
                value={clientDraft}
                onChange={(e) => setClientDraft(e.target.value)}
                className="min-w-0 flex-1 rounded border border-[#1a3321] bg-[#112216] px-2 py-1.5 font-mono text-[11px] text-white focus:border-[#00ff88] focus:outline-none"
              />
              <button
                onClick={() => pf.setClientSeed(clientDraft)}
                className="rounded bg-[#00ff88] px-3 text-[10px] font-black text-[#050a06] hover:bg-[#00e07a]"
              >
                SAVE
              </button>
            </div>
            <div className="text-[10px] text-white/40">Changing client seed resets nonce to 0.</div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={rotate}
              className="inline-flex items-center gap-1 rounded bg-[var(--neon-gold)] px-3 py-1.5 text-[11px] font-black text-[#050a06] hover:brightness-110"
            >
              <RefreshCw className="h-3 w-3" /> Rotate Server Seed
            </button>
            <span className="text-[10px] text-white/40">Reveals current seed for verification.</span>
          </div>

          {revealed && (
            <div className="space-y-1 rounded border border-[var(--neon-gold)]/40 bg-[var(--neon-gold)]/5 p-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-[var(--neon-gold)]">Revealed Server Seed</div>
              <div className="break-all font-mono text-[10px] text-white/80">{revealed.seed}</div>
              <div className="text-[10px] text-white/40">SHA-256 matches: <span className="font-mono">{revealed.hash.slice(0, 16)}…</span></div>
            </div>
          )}

          {pf.history.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/50">Recent Bets</div>
              <div className="max-h-40 overflow-y-auto rounded border border-[#1a3321]">
                <table className="w-full text-[10px]">
                  <thead className="sticky top-0 bg-[#112216] text-white/60">
                    <tr>
                      <th className="p-1.5 text-left font-bold">#</th>
                      <th className="p-1.5 text-left font-bold">Outcome</th>
                      <th className="p-1.5 text-left font-bold">Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pf.history.map((b) => (
                      <tr key={b.nonce} className="border-t border-[#1a3321]">
                        <td className="p-1.5 font-mono text-white/80">{b.nonce}</td>
                        <td className="p-1.5 text-white/80">{b.outcome}</td>
                        <td className="p-1.5 font-mono text-white/40">{b.serverSeedHash.slice(0, 10)}…</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onCopy, copied }: { label: string; value: string; onCopy: (v: string) => void; copied: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</label>
      <div className="flex gap-1">
        <div className="min-w-0 flex-1 truncate rounded border border-[#1a3321] bg-[#112216] px-2 py-1.5 font-mono text-[11px] text-white/80">
          {value}
        </div>
        <button
          onClick={() => onCopy(value)}
          className="grid w-8 place-items-center rounded bg-[#1a3321] text-white/80 hover:bg-[#254a30]"
          title="Copy"
        >
          {copied ? <Check className="h-3 w-3 text-[#00ff88]" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
