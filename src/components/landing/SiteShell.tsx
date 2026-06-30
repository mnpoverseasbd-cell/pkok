import { Link } from "@tanstack/react-router";
import { CircleDollarSign, Globe, Headphones, Mail, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";
import { ModalsProvider, useModals } from "@/components/landing/PortalModals";

const topMenu: { label: string; to: string }[] = [
  { label: "হোম", to: "/" },
  { label: "গরম", to: "/games" },
  { label: "স্লট", to: "/slots" },
  { label: "ফিশিং", to: "/fishing" },
  { label: "লাইভ", to: "/live" },
  { label: "স্পোর্টস", to: "/sports" },
  { label: "ই-স্পোর্টস", to: "/sports" },
  { label: "পোকার", to: "/poker" },
  { label: "লটারি", to: "/lottery" },
  { label: "VIP", to: "/vip" },
  { label: "প্রমোশন", to: "/promotion" },
];

const sideActions = ["24CS", "Telegram", "Facebook", "TG Channel", "Whatsapp"];

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <ModalsProvider>
      <div className="portal-shell min-h-screen text-foreground">
        <TopBar />
        <MainNav />
        <main className="pb-8">{children}</main>
        <FooterBlock />
        <SocialRail />
        <LeftFloatingBadges />
      </div>
    </ModalsProvider>
  );
}

function TopBar() {
  const { setOpen } = useModals();
  return (
    <div className="bg-topbar border-b border-border/60">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2 text-xs sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 text-foreground/90">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--neon-pink)]" />
          <span className="truncate">বাংলা</span>
          <Globe className="h-3.5 w-3.5 shrink-0" />
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-black/25 px-2 py-1 sm:px-3">
          <CircleDollarSign className="h-3.5 w-3.5 text-foreground/80" />
          <span className="text-[var(--neon-green)]">৳ 0.00</span>
          <button onClick={() => setOpen("deposit")} className="rounded-full bg-green-button px-3 py-1 font-bold text-[var(--background)]">ডিপোজিট</button>
          <button onClick={() => setOpen("withdraw")} className="rounded-full bg-gold-button px-3 py-1 font-bold text-[var(--background)]">উত্তোলন</button>
          <Link to="/login" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-bold text-white">লগইন</Link>
          <Link to="/register" className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[var(--neon-pink)] px-3 py-1 font-bold text-white">রেজিস্টার</Link>
        </div>
      </div>
    </div>
  );
}

function MainNav() {
  return (
    <header className="bg-navbar sticky top-0 z-40 border-b border-black/20 shadow-lg shadow-black/25">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-3 py-3 sm:px-4 lg:px-6">
        <Link to="/" className="shrink-0 font-display text-3xl font-black leading-none">
          <span className="text-white">AS</span>
          <span className="text-black">IK</span>
          <span className="text-gradient-gold">OK</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center gap-4 overflow-hidden whitespace-nowrap text-sm font-bold text-white/95 lg:flex">
          {topMenu.map((item) => (
            <Link key={item.label} to={item.to} search={item.search as never} className="shrink-0 transition-colors hover:text-[var(--neon-gold)]" activeProps={{ className: "shrink-0 text-[var(--neon-gold)]" }}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-white">
          <Mail className="h-5 w-5" />
          <Link to="/login" className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-xs font-bold">A</Link>
        </div>
      </div>
      <div className="overflow-x-auto border-t border-white/10 px-3 py-2 text-xs font-semibold text-white/90 lg:hidden">
        <div className="flex w-max gap-4">
          {topMenu.map((item) => (
            <Link key={item.label} to={item.to} search={item.search as never}>{item.label}</Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function FooterBlock() {
  return (
    <footer className="bg-[#2a2a27] text-foreground/90">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-6">
        <div>
          <p className="max-w-2xl text-sm leading-7 text-foreground/85">
            ASIK Game-এ পাবেন সর্বাধুনিক স্লট, লাইভ ক্যাসিনো, স্পোর্টস ও ফিশিং গেম — নিরাপদ লেনদেন, দ্রুত উত্তোলন এবং ২৪/৭ বাংলা সাপোর্ট সহ সম্পূর্ণ একটি গেমিং প্ল্যাটফর্ম।
          </p>
        </div>
        <div className="space-y-3 text-center lg:text-left">
          <div className="text-3xl font-black text-white/80">mga</div>
          <div className="text-lg font-semibold text-white/90">Maltese license (MGA) certification</div>
        </div>
        <div className="space-y-3 text-center lg:text-left">
          <div className="text-3xl font-black text-white/80">BVI</div>
          <div className="text-lg font-semibold text-white/90">British Virgin Islands (BVI) certification</div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-center text-sm text-foreground/65 sm:px-6 lg:px-6">
        কপিরাইট © 2026 Asik Game. সমস্ত অধিকার সংরক্ষিত। • শুধুমাত্র ডেমো UI • কোনো real-money gaming নয়।
      </div>
    </footer>
  );
}

function SocialRail() {
  return (
    <div className="fixed right-2 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 xl:flex">
      {sideActions.map((item, index) => (
        <a key={item} href="#" className="flex w-16 flex-col items-center rounded-[28px] border border-[var(--neon-green)]/55 bg-[color-mix(in_oklab,var(--surface)_90%,black)] px-2 py-2 text-center text-[10px] font-bold text-white shadow-lg shadow-black/30">
          <span className={`mb-1 grid h-10 w-10 place-items-center rounded-full ${index === 0 ? "bg-green-button text-[var(--background)]" : "bg-[var(--neon-green)]/25"}`}>
            {index === 0 ? <Headphones className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          </span>
          {item}
        </a>
      ))}
    </div>
  );
}

function LeftFloatingBadges() {
  return (
    <div className="fixed bottom-6 left-2 z-20 hidden flex-col gap-3 lg:flex">
      {["🏆", "🎁", "🏆"].map((icon, index) => (
        <button key={`${icon}-${index}`} className="grid h-14 w-14 place-items-center rounded-full border border-[var(--neon-gold)]/40 bg-[color-mix(in_oklab,var(--surface)_90%,black)] text-3xl shadow-lg shadow-black/30">
          {icon}
        </button>
      ))}
    </div>
  );
}
