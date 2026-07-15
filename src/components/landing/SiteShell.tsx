import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, CircleDollarSign, Crown, Dice5, Eye, EyeOff, Fish, Flame, Gamepad2, Gift, Globe, Headphones, Home, LogOut, Mail, MessageCircle, Radio, Smartphone, Spade, Ticket, Trophy, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useProfile, signOut } from "@/hooks/useAuth";
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import { ModalsProvider, useModals } from "@/components/landing/PortalModals";
import { WelcomePopup } from "@/components/landing/WelcomePopup";
import { LanguageProvider, useLang, type Lang } from "@/components/landing/LanguageContext";
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

const topMenu: { key: "navHome"|"navHot"|"navSlots"|"navFish"|"navLive"|"navSports"|"navEsports"|"navPoker"|"navLottery"|"navApp"|"navPromo"; to: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "navHome", to: "/", icon: Home },
  { key: "navHot", to: "/hot", icon: Flame },
  { key: "navSlots", to: "/slots", icon: Dice5 },
  { key: "navFish", to: "/fish", icon: Fish },
  { key: "navLive", to: "/live", icon: Radio },
  { key: "navSports", to: "/sports", icon: Trophy },
  { key: "navEsports", to: "/esports", icon: Gamepad2 },
  { key: "navPoker", to: "/poker", icon: Spade },
  { key: "navLottery", to: "/lottery", icon: Ticket },
  { key: "navApp", to: "/download", icon: Smartphone },
  { key: "navPromo", to: "/promotion", icon: Gift },
];


const sideActions = ["24CS", "Telegram", "Facebook", "TG Channel", "Whatsapp"];

export function SiteShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  return (
    <LanguageProvider>
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
    </LanguageProvider>
  );
}

function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const options: { code: Lang; label: string; flag: string }[] = [
    { code: "BN", label: "বাংলা", flag: "🇧🇩" },
    { code: "EN", label: "English", flag: "🇬🇧" },
  ];
  const current = options.find((o) => o.code === lang)!;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-1.5 rounded-full border border-border/60 bg-black/25 px-2.5 py-1 text-foreground/90 hover:text-white"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span className="truncate">{current.label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md border border-border/70 bg-[var(--surface)] shadow-lg">
          {options.map((o) => (
            <button
              key={o.code}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setLang(o.code); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-black/40 ${o.code === lang ? "text-[var(--neon-green)]" : "text-white/90"}`}
            >
              <span>{o.flag}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TopBar() {
  const { setOpen } = useModals();
  const [showPw, setShowPw] = useState(false);
  const { t } = useLang();
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    toast.success("লগআউট হয়েছে");
    navigate({ to: "/" });
  }

  const balance = profile?.wallet_balance ?? 0;
  const displayName = profile?.display_name || profile?.username || user?.email?.split("@")[0] || "User";

  return (
    <div className="bg-topbar border-b border-border/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2 text-xs sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-2 text-foreground/90">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <LangSwitcher />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              {/* Signed-in wallet chip */}
              <div className="hidden md:flex items-center gap-2 rounded-full border border-border/70 bg-black/25 px-2 py-1 sm:px-3">
                <CircleDollarSign className="h-3.5 w-3.5 text-foreground/80" />
                <span className="text-[var(--neon-green)] font-bold">৳ {balance.toFixed(2)}</span>
                <Link to="/wallet" search={{ tab: "deposit" }} className="rounded-full bg-green-button px-3 py-1 font-bold text-[var(--background)]">{t("deposit")}</Link>
                <Link to="/wallet" search={{ tab: "withdraw" }} className="rounded-full bg-gold-button px-3 py-1 font-bold text-[var(--background)]">{t("withdraw")}</Link>
              </div>
              <Link to="/profile" className="flex items-center gap-1.5 rounded-full border border-border/70 bg-black/25 px-2.5 py-1 hover:border-[var(--neon-gold)]">
                <UserIcon className="h-3.5 w-3.5 text-[var(--neon-gold)]" />
                <span className="max-w-[100px] truncate font-bold text-white">{displayName}</span>
              </Link>
              <button
                onClick={handleSignOut}
                title="লগআউট"
                className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-pink)]/80 px-2.5 py-1.5 font-bold text-white hover:brightness-110"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>

          ) : (
            <>
              <Link to="/login" className="inline-flex items-center gap-1 rounded-md bg-gold-button px-3 py-1.5 font-bold text-[var(--background)]">{t("login")}</Link>
              <Link to="/register" className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-pink)] px-3 py-1.5 font-bold text-white">{t("register")}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MainNav() {
  const { t } = useLang();
  return (
    <header className="bg-navbar sticky top-0 z-40 border-b border-black/20 shadow-lg shadow-black/25">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 sm:px-4 lg:px-6">
        <Link to="/" aria-label="PKOK home" className="flex shrink-0 items-center gap-1 font-display text-3xl font-black leading-none">
          <span className="text-white drop-shadow">PK</span>
          <span className="rounded-[6px] bg-[#ff9700] px-1.5 text-black shadow-[0_2px_0_rgba(0,0,0,0.35)]">OK</span>
          <span className="-ml-1 text-[#ff9700] drop-shadow">👌</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-start gap-1 whitespace-nowrap pl-4 text-[15px] font-bold text-white lg:flex">
          {topMenu.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="group flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 transition-colors hover:text-[var(--neon-gold)]"
              activeProps={{ className: "shrink-0 text-[var(--neon-gold)]" }}
            >
              <item.icon className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span>{t(item.key)}</span>
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
            <Link key={item.key} to={item.to} className="flex flex-col items-center gap-0.5">
              <item.icon className="h-4 w-4" />
              <span>{t(item.key)}</span>
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
  const { t } = useLang();
  return (
    <>
      <ProvidersStrip />
      <footer className="bg-[#2a2a27] text-foreground/90">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_1fr_1fr] lg:px-6">
          <div>
            <p className="max-w-2xl text-sm leading-7 text-foreground/85">{t("footerAbout")}</p>
          </div>
          <div className="space-y-3 text-center lg:text-left">
            <div className="text-3xl font-black text-white/80">mga</div>
            <div className="text-lg font-semibold text-white/90">{t("mgaCert")}</div>
          </div>
          <div className="space-y-3 text-center lg:text-left">
            <div className="text-3xl font-black text-white/80">BVI</div>
            <div className="text-lg font-semibold text-white/90">{t("bviCert")}</div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl border-t border-white/10 px-4 py-6 text-center text-sm text-foreground/65 sm:px-6 lg:px-6">
          {t("footerCopy")}
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
    <div className="fixed bottom-6 left-2 z-20 hidden flex-col gap-3 2xl:flex">
      {["🏆", "🎁", "🏆"].map((icon, index) => (
        <button key={`${icon}-${index}`} className="grid h-14 w-14 place-items-center rounded-full border border-[var(--neon-gold)]/40 bg-[color-mix(in_oklab,var(--surface)_90%,black)] text-3xl shadow-lg shadow-black/30">
          {icon}
        </button>
      ))}
    </div>
  );
}
