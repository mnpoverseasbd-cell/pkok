import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, CircleDollarSign, Crown, Dice5, Eye, EyeOff, Fish, Flame, Gamepad2, Gift, Globe, Headphones, Home, LogOut, Mail, MessageCircle, Radio, RefreshCw, Smartphone, Spade, Ticket, Trophy, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useProfile, signOut } from "@/hooks/useAuth";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { ModalsProvider, useModals } from "@/components/landing/PortalModals";
import { WelcomePopup } from "@/components/landing/WelcomePopup";
import { GoldenEggPopup } from "@/components/landing/GoldenEggPopup";
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
          <div className="sticky top-0 z-40">
            <TopBar />
            <MainNav />
          </div>
          <main className="pb-8">{children}</main>
          {footer ? <FooterBlock /> : null}
          <SocialRail />
          <LeftFloatingBadges />
          <WelcomePopup />
          <GoldenEggPopup />
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

function ProfileMenu({ displayName, onSignOut }: { displayName: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const items: { to: string; search?: Record<string, string>; icon: typeof UserIcon; label: string }[] = [
    { to: "/profile", icon: UserIcon, label: "সদস্য" },
    { to: "/wallet", search: { tab: "deposit" }, icon: CircleDollarSign, label: "ডিপোজিট" },
    { to: "/wallet", search: { tab: "withdraw" }, icon: RefreshCw, label: "উত্তোলন" },
    { to: "/wallet", search: { tab: "history" }, icon: Ticket, label: "অ্যাকাউন্ট রেকর্ড" },
    { to: "/profile", icon: Trophy, label: "বেটিং রেকর্ড" },
  ];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full bg-black/25 px-1 py-0.5 pr-2 hover:brightness-110"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-gold)] to-[var(--neon-pink)] text-[11px] font-black text-black">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[110px] truncate font-bold text-white">{displayName}</span>
        <ChevronDown className={`h-3 w-3 text-white/70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-[100] mt-2 w-56 overflow-hidden rounded-xl border border-[var(--neon-gold)]/50 bg-[#0b1f14]/98 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)] backdrop-blur animate-fade-in">
          <ul className="py-1">
            {items.map((it) => (
              <li key={it.label}>
                <Link
                  to={it.to}
                  search={it.search as never}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/90 hover:bg-[var(--neon-green)]/15 hover:text-white"
                >
                  <it.icon className="h-4 w-4 text-[var(--neon-gold)]" />
                  <span>{it.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-white/10">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut(); }}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--neon-pink)]/20"
            >
              <LogOut className="h-4 w-4" />
              সাইন আউট
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function TopBar() {
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLang();
  const { user, loading: authLoading } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile(user?.id);
  const navigate = useNavigate();

  async function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    const started = Date.now();
    try {
      await refetchProfile();
    } finally {
      // keep spinner visible at least 400ms to avoid flicker
      const elapsed = Date.now() - started;
      if (elapsed < 400) await new Promise((r) => setTimeout(r, 400 - elapsed));
      setRefreshing(false);
    }
  }


  async function handleSignOut() {
    await signOut();
    toast.success("লগআউট হয়েছে");
    navigate({ to: "/" });
  }

  async function handleQuickLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("ফোন ও পাসওয়ার্ড দিন");
      return;
    }
    setSubmitting(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const email = `${phone.replace(/\D/g, "")}@asikgame.app`;
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("লগইন সফল");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "লগইন ব্যর্থ");
    } finally {
      setSubmitting(false);
    }
  }

  const balance = profile?.wallet_balance ?? 0;
  const displayName = profile?.display_name || profile?.username || user?.email?.split("@")[0] || "User";

  return (
    <div className="bg-topbar border-b border-border/60">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-3 py-2.5 text-[13px] sm:px-4 lg:px-6">

        <div className="flex min-w-0 items-center gap-2 text-foreground/90">
          <Globe className="h-3.5 w-3.5 shrink-0" />
          <LangSwitcher />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {authLoading ? (
            <div className="h-8 w-56 animate-pulse rounded-md bg-white/10" aria-hidden />
          ) : user ? (
            <>
              <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 text-white">
                <CircleDollarSign className="h-4 w-4 text-[var(--neon-gold)]" />
                <span className={`font-bold tabular-nums transition-opacity duration-200 ${refreshing ? "opacity-60" : "opacity-100"}`}>
                  {showPw ? `৳ ${balance.toFixed(2)}` : "৳ ****"}
                </span>
                <button type="button" onClick={() => setShowPw((v) => !v)} className="text-white/70 hover:text-white">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  title="রিফ্রেশ"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  aria-busy={refreshing}
                  className="text-white/70 hover:text-white disabled:opacity-70"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </div>

              <Link to="/wallet" search={{ tab: "deposit" }} className="rounded-md bg-green-button px-3 py-1.5 font-bold text-[var(--background)]">{t("deposit")}</Link>
              <Link to="/wallet" search={{ tab: "withdraw" }} className="rounded-md bg-gold-button px-3 py-1.5 font-bold text-[var(--background)]">{t("withdraw")}</Link>
              <button type="button" title="ইনবক্স" className="relative grid h-8 w-8 place-items-center rounded-full bg-gold-button text-[var(--background)]">
                <Mail className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--neon-pink)] px-1 text-[10px] font-bold text-white">5</span>
              </button>
              <ProfileMenu displayName={displayName} onSignOut={handleSignOut} />
              <button
                onClick={handleSignOut}
                title="লগআউট"
                className="inline-flex items-center gap-1 rounded-md bg-[var(--neon-pink)]/80 px-2 py-1.5 font-bold text-white hover:brightness-110"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <form onSubmit={handleQuickLogin} className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-[13px] text-black">
                <span className="text-base leading-none">🇧🇩</span>
                <span className="font-semibold text-black/70">+880</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-32 border-none bg-transparent text-black placeholder:text-black/40 focus:outline-none"
                />
              </div>
              <div className="hidden md:flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-[13px] text-black">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="পাসওয়ার্ড"
                  className="w-28 border-none bg-transparent text-black placeholder:text-black/40 focus:outline-none"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="text-black/50 hover:text-black">
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1 rounded-md bg-green-button px-3 py-1.5 font-bold text-[var(--background)] disabled:opacity-60"
              >
                {t("login")}
                <span className="mx-0.5 h-3.5 w-px bg-black/30" />
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <Link to="/register" className="inline-flex items-center gap-1 rounded-md bg-gold-button px-3 py-1.5 font-bold text-[var(--background)]">
                {t("register")}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function MainNav() {
  const { t } = useLang();
  return (
    <header className="bg-navbar border-b border-black/20 shadow-lg shadow-black/25">
      <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-3 py-3 sm:px-4 sm:py-3.5 lg:px-6 lg:py-4">
        <Link to="/" aria-label="PKOK home" className="flex shrink-0 items-center gap-1 font-display text-2xl font-black leading-none sm:text-[28px] lg:text-[32px]">
          <span className="text-white drop-shadow">PK</span>
          <span className="rounded-[6px] bg-[#ff9700] px-1.5 text-black shadow-[0_2px_0_rgba(0,0,0,0.35)]">OK</span>
          <span className="-ml-1 text-[#ff9700] drop-shadow">👌</span>
        </Link>
        <nav className="hidden min-w-0 flex-1 items-center justify-start gap-1 whitespace-nowrap pl-4 text-[14px] font-bold text-white lg:flex xl:gap-2 xl:pl-6 xl:text-[15px]">
          {topMenu.map((item) => (
            <Link
              key={item.key}
              to={item.to}
              className="group flex shrink-0 items-center gap-1.5 rounded-md px-2 py-2 transition-colors hover:text-[var(--neon-gold)]"
              activeProps={{ className: "shrink-0 text-[var(--neon-gold)]" }}
            >
              <item.icon className="h-7 w-7 transition-transform group-hover:scale-110" />
              <span>{t(item.key)}</span>
            </Link>
          ))}
        </nav>
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
    <section className="bg-[#1a1a1a] py-6 sm:py-8">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-4 gap-x-4 gap-y-5 sm:grid-cols-6 sm:gap-x-6 md:grid-cols-8 lg:grid-cols-10">
          {providerLogos.map((item, i) => (
            <div key={`${item.name}-${i}`} className="flex h-10 items-center justify-center">
              <img
                src={item.logo}
                alt={item.name}
                loading="lazy"
                className="max-h-8 max-w-full object-contain opacity-90 transition duration-200 hover:scale-110 hover:opacity-100"
                style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.4))" }}
              />
            </div>
          ))}
        </div>
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
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-10 sm:px-6 sm:py-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-12 lg:px-8">
          <div>
            <p className="max-w-2xl text-sm leading-7 text-foreground/85 sm:text-[15px] sm:leading-7">{t("footerAbout")}</p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-lg font-black text-[#c11d1d]">M</span>
              <div className="flex flex-col leading-tight">
                <span className="text-xl font-black tracking-wide text-white">mga</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Malta Gaming Authority</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-white/90 sm:text-base">{t("mgaCert")}</div>
          </div>
          <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/95 text-sm font-black text-[#1a4a8a]">BVI</span>
              <div className="flex flex-col leading-tight">
                <span className="text-lg font-black tracking-wide text-white">British Virgin Islands</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Financial Services Commission</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-white/90 sm:text-base">{t("bviCert")}</div>
          </div>
        </div>
        <div className="mx-auto max-w-[1440px] border-t border-white/10 px-4 py-6 text-center text-sm text-foreground/65 sm:px-6 sm:text-base lg:px-8">
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
