import { useState } from "react";
import { Menu, X, Globe, Crown } from "lucide-react";

const navItems = [
  { label: "হোম", href: "#home" },
  { label: "গেমস", href: "#games" },
  { label: "প্রমোশন", href: "#promo" },
  { label: "VIP", href: "#vip" },
  { label: "সাপোর্ট", href: "#support" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<"BN" | "EN">("BN");

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-[color-mix(in_oklab,var(--neon-purple)_30%,transparent)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-gold glow-gold">
            <Crown className="h-5 w-5 text-[var(--background)]" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-black tracking-tight">
            <span className="text-gradient-gold">ASIK</span>
            <span className="text-foreground"> GAME</span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-md px-4 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary/60 hover:text-[var(--neon-gold)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
            className="hidden items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs font-bold text-foreground/80 transition-colors hover:text-[var(--neon-cyan)] sm:flex"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang}
          </button>
          <button className="hidden rounded-md border border-[var(--neon-cyan)]/50 px-4 py-2 text-sm font-bold text-[var(--neon-cyan)] transition-all hover:bg-[var(--neon-cyan)]/10 hover:glow-cyan sm:inline-flex">
            লগইন
          </button>
          <button className="rounded-md bg-gradient-neon px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:glow-pink">
            রেজিস্টার
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-md border border-border lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-[var(--surface)]/95 px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-semibold text-foreground/80 hover:bg-secondary hover:text-[var(--neon-gold)]"
              >
                {item.label}
              </a>
            ))}
            <div className="mt-2 flex gap-2 sm:hidden">
              <button className="flex-1 rounded-md border border-[var(--neon-cyan)]/50 px-4 py-2 text-sm font-bold text-[var(--neon-cyan)]">
                লগইন
              </button>
              <button
                onClick={() => setLang(lang === "BN" ? "EN" : "BN")}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-bold"
              >
                <Globe className="h-3.5 w-3.5" /> {lang}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
