import { Clock, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Props = {
  providers?: string[];
  title?: string;
  message?: string;
};

export function ComingSoonBanner({
  providers,
  title = "শীঘ্রই আসছে",
  message = "এই section এর provider integration এখনো active নয়। বৈধ provider access পেলে চালু হবে।",
}: Props) {
  return (
    <div className="mx-auto mb-4 w-[1200px] max-w-[calc(100vw-32px)]">
      <div className="relative overflow-hidden rounded-xl border border-[var(--neon-gold)]/40 bg-gradient-to-r from-black/70 via-yellow-950/40 to-black/70 p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--neon-gold)]/20 ring-1 ring-[var(--neon-gold)]/60">
            <Clock className="h-5 w-5 text-[var(--neon-gold)]" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[var(--neon-gold)] px-2 py-0.5 text-[10px] font-black uppercase text-black">
                Coming Soon
              </span>
              <h3 className="text-sm font-bold text-white">{title}</h3>
            </div>
            <p className="mt-1 text-xs text-white/75">{message}</p>
            {providers && providers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {providers.map((p) => (
                  <span
                    key={p}
                    className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/90 ring-1 ring-white/15"
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/esports"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--neon-gold)] px-3 py-2 text-xs font-black text-black transition hover:brightness-110"
          >
            <Sparkles className="h-3.5 w-3.5" />
            আমার গেমস খেলুন
          </Link>
        </div>
      </div>
    </div>
  );
}
