import { Link } from "@tanstack/react-router";
import { CircleDollarSign, Crown, Dice5, Eye, EyeOff, Fish, Flame, Gamepad2, Gift, Globe, Headphones, Home, Mail, MessageCircle, Radio, Smartphone, Spade, Ticket, Trophy } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { ModalsProvider, useModals } from "@/components/landing/PortalModals";
import { WelcomePopup } from "@/components/landing/WelcomePopup";
import twoJLogo from "@/assets/providers/2J.png.asset.json";
import ailLogo from "@/assets/providers/AIL.png.asset.json";
import bngLogo from "@/assets/providers/BNG.png.asset.json";
import btgLogo from "@/assets/providers/BTG.png.asset.json";
import btiLogo from "@/assets/providers/BTI.png.asset.json";
import cq9Logo from "@/assets/providers/CQ9.png.asset.json";
import dgLogo from "@/assets/providers/DG.png.asset.json";
import eg4Logo from "@/assets/providers/EG4.png.asset.json";
import ezgLogo from "@/assets/providers/EZG.png.asset.json";
import fbLogo from "@/assets/providers/FB.png.asset.json";
import fcLogo from "@/assets/providers/FC.png.asset.json";
import iaLogo from "@/assets/providers/IA.png.asset.json";
import jdbLogo from "@/assets/providers/JDB.png.asset.json";
import jlLogo from "@/assets/providers/JL.png.asset.json";
import kmLogo from "@/assets/providers/KM.png.asset.json";
import kpLogo from "@/assets/providers/KP.png.asset.json";
import lucLogo from "@/assets/providers/LUC.png.asset.json";
import mgLogo from "@/assets/providers/MG.png.asset.json";
import mwLogo from "@/assets/providers/MW.png.asset.json";
import nsLogo from "@/assets/providers/NS.png.asset.json";
import pgLogo from "@/assets/providers/PG.png.asset.json";
import polyLogo from "@/assets/providers/POLY.png.asset.json";
import ppLogo from "@/assets/providers/PP.png.asset.json";
import r88Logo from "@/assets/providers/R88.png.asset.json";
import rgLogo from "@/assets/providers/RG.png.asset.json";
import saLogo from "@/assets/providers/SA.png.asset.json";
import sbLogo from "@/assets/providers/SB.png.asset.json";
import sexLogo from "@/assets/providers/SEX.png.asset.json";
import spbLogo from "@/assets/providers/SPB.png.asset.json";
import sv3Logo from "@/assets/providers/SV3.png.asset.json";
import swgLogo from "@/assets/providers/SWG.png.asset.json";
import tcgLogo from "@/assets/providers/TCG_SEA.png.asset.json";
import tfLogo from "@/assets/providers/TF.png.asset.json";
import ug2Logo from "@/assets/providers/UG2.png.asset.json";
import vaLogo from "@/assets/providers/VA.png.asset.json";
import wdLogo from "@/assets/providers/WD.png.asset.json";
import wsLogo from "@/assets/providers/WS.png.asset.json";

const topMenu: { label: string; to: string; icon: ComponentType<{ className?: string }> }[] = [
  { label: "হোম", to: "/", icon: Home },
  { label: "গরম", to: "/hot", icon: Flame },
  { label: "স্লট", to: "/slots", icon: Dice5 },
  { label: "ফিশিং", to: "/fish", icon: Fish },
  { label: "লাইভ", to: "/live", icon: Radio },
  { label: "স্পোর্টস", to: "/sports", icon: Trophy },
  { label: "ই-স্পোর্টস", to: "/esports", icon: Gamepad2 },
  { label: "পোকার", to: "/poker", icon: Spade },
  { label: "লটারি", to: "/lottery", icon: Ticket },
  { label: "APP", to: "/download", icon: Smartphone },
  { label: "প্রমোশন", to: "/promotion", icon: Gift },
];


const sideActions = ["24CS", "Telegram", "Facebook", "TG Channel", "Whatsapp"];

export function SiteShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <ModalsProvider>
      <div className="portal-shell min-h-screen text-foreground">
        <TopBar />
        <MainNav />
        <main className="pb-8">{children}</main>
        {footer ? <FooterBlock /> : null}
        <SocialRail />
        <LeftFloatingBadges />
        <WelcomePopup />
      </div>
    </ModalsProvider>
  );
}

function TopBar() {
  const { setOpen } = useModals();
  const [showPw, setShowPw] = useState(false);
  return (
    <div className="bg-topbar border-b border-border/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2 text-xs sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 text-foreground/90">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--neon-pink)]" />
          <span className="truncate">বাংলা</span>
          <Globe className="h-3.5 w-3.5 shrink-0" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Wallet chip — visible md+ */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-border/70 bg-black/25 px-2 py-1 sm:px-3">
            <CircleDollarSign className="h-3.5 w-3.5 text-foreground/80" />
            <span className="text-[var(--neon-green)]">৳ 0.00</span>
            <button onClick={() => setOpen("deposit")} className="rounded-full bg-green-button px-3 py-1 font-bold text-[var(--background)]">ডিপোজিট</button>
            <button onClick={() => setOpen("withdraw")} className="rounded-full bg-gold-button px-3 py-1 font-bold text-[var(--background)]">উত্তোলন</button>
          </div>
          {/* PKOK-style phone + password quick login */}
          <div className="hidden items-center gap-1.5 lg:flex">
            <div className="flex items-center gap-1 rounded-md border border-border/70 bg-black/30 px-2 py-1.5">
              <span className="h-3 w-4 rounded-sm bg-[var(--neon-pink)]" />
              <span className="font-bold text-white/90">+880</span>
            </div>
            <input
              type="tel"
              placeholder="মোবাইল নাম্বার"
              className="h-7 w-36 rounded-md border border-border/70 bg-black/30 px-2 text-[11px] text-white placeholder:text-foreground/55 outline-none focus:border-[var(--neon-green)]"
            />
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                placeholder="পাসওয়ার্ড"
                className="h-7 w-32 rounded-md border border-border/70 bg-black/30 px-2 pr-6 text-[11px] text-white placeholder:text-foreground/55 outline-none focus:border-[var(--neon-green)]"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-foreground/60">
                {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <Link to="/login" className="inline-flex items-center gap-1 rounded-md bg-gold-button px-3 py-1.5 font-bold text-[var(--background)]">লগইন</Link>
          <Link to="/register" className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-pink)] px-3 py-1.5 font-bold text-white">রেজিস্টার</Link>
        </div>
      </div>
    </div>
  );
}

function MainNav() {
  return (
    <header className="bg-navbar sticky top-0 z-40 border-b border-black/20 shadow-lg shadow-black/25">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-4 lg:px-6">
        <Link to="/" aria-label="PKOK home" className="flex shrink-0 items-center gap-1 font-display text-4xl font-black leading-none">
          <span className="text-white drop-shadow">PK</span>
          <span className="rounded-[6px] bg-[#ff9700] px-1.5 text-black shadow-[0_2px_0_rgba(0,0,0,0.35)]">OK</span>
          <span className="-ml-1 text-[#ff9700] drop-shadow">👌</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-hidden whitespace-nowrap text-[13px] font-bold text-white lg:flex">
          {topMenu.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="group flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors hover:text-[var(--neon-gold)]"
              activeProps={{ className: "shrink-0 text-[var(--neon-gold)]" }}
            >
              <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 text-white lg:ml-2">
          <Mail className="h-5 w-5" />
          <Link to="/login" className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-xs font-bold">A</Link>
        </div>
      </div>
      <div className="overflow-x-auto border-t border-white/10 px-3 py-2 text-xs font-semibold text-white/90 lg:hidden">
        <div className="flex w-max gap-3">
          {topMenu.map((item) => (
            <Link key={item.label} to={item.to} className="flex flex-col items-center gap-0.5">
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}


const providerLogos = [
  { name: "CQ9", logo: cq9Logo.url },
  { name: "RICH GAME", logo: rgLogo.url },
  { name: "Sexy", logo: sexLogo.url },
  { name: "AI LIVE CASINO", logo: ailLogo.url },
  { name: "LUCKY", logo: lucLogo.url },
  { name: "SABA SPORTS", logo: sbLogo.url },
  { name: "TC GAMING", logo: tcgLogo.url },
  { name: "PG", logo: pgLogo.url },
  { name: "PRAGMATIC PLAY", logo: ppLogo.url },
  { name: "KING MIDAS", logo: kmLogo.url },
  { name: "2J.COM", logo: twoJLogo.url },
  { name: "Ezugi", logo: ezgLogo.url },
  { name: "SA GAMING", logo: saLogo.url },
  { name: "BTi", logo: btiLogo.url },
  { name: "POLY", logo: polyLogo.url },
  { name: "TF GAMING", logo: tfLogo.url },
  { name: "JILI", logo: jlLogo.url },
  { name: "JDB", logo: jdbLogo.url },
  { name: "Microgaming", logo: mgLogo.url },
  { name: "R88", logo: r88Logo.url },
  { name: "SW GAMING", logo: swgLogo.url },
  { name: "V.A", logo: vaLogo.url },
  { name: "DREAM GAMING", logo: dgLogo.url },
  { name: "FB SPORTS", logo: fbLogo.url },
  { name: "SV388", logo: sv3Logo.url },
  { name: "IA E-SPORTS", logo: iaLogo.url },
  { name: "NEXTSPIN", logo: nsLogo.url },
  { name: "FA CHAI", logo: fcLogo.url },
  { name: "BT GAMING", logo: btgLogo.url },
  { name: "MEGAWIN", logo: mwLogo.url },
  { name: "Evolution", logo: eg4Logo.url },
  { name: "W", logo: wdLogo.url },
  { name: "WICKETS", logo: wsLogo.url },
  { name: "UNITED GAMING", logo: ug2Logo.url },
  { name: "SBO", logo: sbLogo.url },
  { name: "KING'S POKER", logo: kpLogo.url },
  { name: "SPRIBE", logo: spbLogo.url },
  { name: "BNG", logo: bngLogo.url },
];

function ProvidersStrip() {
  return (
    <section className="bg-black py-5">
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-x-4 gap-y-4 px-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {providerLogos.map((item) => (
          <div key={item.name} className="flex h-10 items-center justify-center px-1">
            <img
              src={item.logo}
              alt={item.name}
              loading="lazy"
              className="max-h-8 max-w-full object-contain opacity-90 transition duration-200 hover:scale-105 hover:opacity-100"
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function FooterBlock() {
  return (
    <>
      <ProvidersStrip />
      <footer className="bg-[#2a2a27] text-foreground/90">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-6">
          <div>
            <p className="max-w-2xl text-sm leading-7 text-foreground/85">
              স্লট গেম সম্পর্কিত PKOK ক্যাসিনো সবচেয়ে জনপ্রিয় গেম ধরনের একটি এবং PKOK এ আছে সেরা স্লট গেম প্রোভাইডার সহ নিজি — PKOK-এর রয়েছে পাগলামুস্ত কোম্পানি সুরুক্ষীলতা ও উত্তেজনার গ্যারান্টি অধিকরণ করার প্রতিদ্বন্দিতা প্রধান। বৈচিত্র্যময় থিম, মনোমুগ্ধকর গ্রাফিক্স এবং উদ্ভাবনী বৈশিষ্ট্যের PKOK এর স্লটগুলোতে একটি অতুলনীয় রোমাঞ্চকর অভিজ্ঞতা প্রদান করা।
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
          কপিরাইট © 2026 PKOK gaming. সমস্ত অধিকার সংরক্ষিত।
        </div>
      </footer>
    </>
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
