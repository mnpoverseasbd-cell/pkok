import { useEffect, useState } from "react";
import { X, Megaphone, Volume2, Gift, Trophy, Sparkles, Crown, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import tutorialImg from "@/assets/bkash-tutorial.jpg";

type Announcement = {
  id: string;
  icon: React.ReactNode;
  title: string;
  headerIcon: React.ReactNode;
  body: React.ReactNode;
};

const BkashBody = () => (
  <>
    <img
      src={tutorialImg}
      alt="bKash payment tutorial"
      width={1280}
      height={960}
      className="w-full rounded-xl border border-white/10 bg-white"
    />
    <p className="mt-3 text-center text-xs md:text-sm text-white/70">
      সঠিক নম্বর ও ট্রানজেকশন আইডি নিশ্চিত করুন। ভুল তথ্য দিলে পেমেন্ট বাতিল হতে পারে।
    </p>
  </>
);

const NoticeBody = () => (
  <div className="space-y-4 text-white/85">
    <div className="rounded-xl border border-[var(--neon-cyan)]/40 bg-[color-mix(in_oklab,var(--neon-cyan)_10%,transparent)] p-4">
      <h4 className="mb-2 font-display text-lg font-bold text-[var(--neon-cyan)]">প্রিয় সদস্যবৃন্দ,</h4>
      <p className="text-sm leading-7">
        ASIK GAME-এর নতুন অফিসিয়াল ওয়েবসাইট চালু হয়েছে। আরও দ্রুত, নিরাপদ এবং স্মুথ গেমিং অভিজ্ঞতার জন্য আপগ্রেড করা হয়েছে।
      </p>
    </div>
    <ul className="space-y-2 text-sm">
      {[
        "নতুন ডোমেইন ও উন্নত সার্ভার",
        "১০ সেকেন্ডে ডিপোজিট, ৫ মিনিটে উইথড্র",
        "২৪/৭ বাংলা লাইভ চ্যাট সাপোর্ট",
        "১০০০+ নতুন গেম যুক্ত হয়েছে",
      ].map((t) => (
        <li key={t} className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--neon-green)]" /> {t}
        </li>
      ))}
    </ul>
    <p className="text-xs text-white/60">— ASIK GAME অফিসিয়াল টিম</p>
  </div>
);

const ReferBody = () => (
  <div className="space-y-4">
    <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-green)]/40 bg-gradient-to-br from-[#0f2a1a] via-[#0b1f14] to-[#0a1a10] p-5 text-center">
      <Gift className="mx-auto mb-2 h-10 w-10 text-[var(--neon-green)]" />
      <h4 className="font-display text-2xl font-black text-gradient-gold">১৭৭৭ টাকা বোনাস!</h4>
      <p className="mt-2 text-sm text-white/80">প্রতি বন্ধুকে আমন্ত্রণ জানিয়ে পান আকর্ষণীয় বোনাস</p>
    </div>
    <ol className="space-y-2 text-sm text-white/85">
      {[
        "আপনার রেফারেল লিংক শেয়ার করুন",
        "বন্ধু রেজিস্টার করে প্রথম ডিপোজিট করলেই বোনাস",
        "আনলিমিটেড বন্ধুকে আমন্ত্রণ জানানো যাবে",
        "বোনাস সরাসরি ওয়ালেটে যোগ হবে",
      ].map((t, i) => (
        <li key={t} className="flex items-start gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--neon-green)]/20 text-xs font-bold text-[var(--neon-green)]">
            {i + 1}
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ol>
  </div>
);

const ChampBody = () => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-[var(--neon-gold)]/40 bg-gradient-to-br from-[#2a1f0a] via-[#0b1f14] to-[#0a1a10] p-5 text-center">
      <Trophy className="mx-auto mb-2 h-10 w-10 text-[var(--neon-gold)]" />
      <h4 className="font-display text-2xl font-black text-gradient-gold">দৈনিক চ্যাম্পিয়নশিপ</h4>
      <p className="mt-1 text-sm text-white/80">পুরস্কার তহবিল</p>
      <p className="mt-1 font-display text-3xl font-black text-[var(--neon-gold)]">৳ ৫,০০,০০০</p>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      {[
        { p: "১ম", a: "৳ ১,৫০,০০০" },
        { p: "২য়", a: "৳ ৮০,০০০" },
        { p: "৩য়", a: "৳ ৪০,০০০" },
      ].map((r) => (
        <div key={r.p} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="font-bold text-[var(--neon-gold)]">{r.p}</div>
          <div className="mt-1 text-white/80">{r.a}</div>
        </div>
      ))}
    </div>
    <p className="text-center text-xs text-white/60">প্রতিদিন রাত ১২টায় বিজয়ী ঘোষণা করা হবে</p>
  </div>
);

const LuckyBody = () => (
  <div className="space-y-4">
    <div className="relative overflow-hidden rounded-2xl border border-[var(--neon-pink)]/40 bg-gradient-to-br from-[#2a0a1f] via-[#0b1f14] to-[#0a1a10] p-6 text-center">
      <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-[var(--neon-pink)]/20">
        <Sparkles className="h-8 w-8 text-[var(--neon-pink)]" />
      </div>
      <h4 className="font-display text-2xl font-black text-white">🧧 ভাগ্যবান লাল খাম</h4>
      <p className="mt-2 text-sm text-white/80">এখনই লগইন করে দৈনিক লাল খাম খুলুন</p>
    </div>
    <ul className="space-y-2 text-sm text-white/85">
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--neon-pink)]" /> সর্বোচ্চ ৳ ৮৮,৮৮৮ পর্যন্ত বোনাস</li>
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--neon-pink)]" /> প্রতিদিন ৩টি খাম ফ্রি</li>
      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[var(--neon-pink)]" /> কোনো ডিপোজিটের প্রয়োজন নেই</li>
    </ul>
  </div>
);

const VipBody = () => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-[var(--neon-gold)]/40 bg-gradient-to-br from-[#2a1f0a] via-[#0b1f14] to-[#0a1a10] p-5 text-center">
      <Crown className="mx-auto mb-2 h-10 w-10 text-[var(--neon-gold)]" />
      <h4 className="font-display text-2xl font-black text-gradient-gold">VIP এক্সক্লুসিভ সুবিধা</h4>
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      {[
        { t: "ব্রোঞ্জ", c: "text-orange-300", b: "৫% রিবেট" },
        { t: "সিলভার", c: "text-slate-200", b: "৮% রিবেট" },
        { t: "গোল্ড", c: "text-[var(--neon-gold)]", b: "১২% রিবেট" },
        { t: "প্লাটিনাম", c: "text-cyan-300", b: "১৫% রিবেট" },
        { t: "ডায়মন্ড", c: "text-pink-300", b: "২০% রিবেট + ব্যক্তিগত ম্যানেজার" },
      ].map((v) => (
        <div key={v.t} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <div className={`font-bold ${v.c}`}>{v.t}</div>
          <div className="mt-1 text-white/75">{v.b}</div>
        </div>
      ))}
    </div>
    <p className="text-center text-xs text-white/60">যত বেশি খেলবেন, তত উপরের টায়ারে উঠবেন</p>
  </div>
);

const SafetyBody = () => (
  <div className="space-y-4">
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--neon-pink)]/40 bg-[color-mix(in_oklab,var(--neon-pink)_10%,transparent)] p-4">
      <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-[var(--neon-pink)]" />
      <div>
        <h4 className="font-display text-lg font-bold text-white">নিরাপত্তা সতর্কতা</h4>
        <p className="mt-1 text-sm text-white/80">আপনার অ্যাকাউন্ট সুরক্ষিত রাখতে নিচের নির্দেশনা মেনে চলুন।</p>
      </div>
    </div>
    <ul className="space-y-2 text-sm text-white/85">
      {[
        "কারও সাথে পাসওয়ার্ড / OTP শেয়ার করবেন না",
        "শুধুমাত্র অফিসিয়াল ওয়েবসাইট থেকে লগইন করুন",
        "সাপোর্ট শুধু লাইভ চ্যাট / অফিসিয়াল হোয়াটসঅ্যাপ দিয়ে যোগাযোগ করবে",
        "সন্দেহজনক লিংকে ক্লিক করা থেকে বিরত থাকুন",
      ].map((t) => (
        <li key={t} className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-cyan)]" /> {t}
        </li>
      ))}
    </ul>
  </div>
);

const announcements: Announcement[] = [
  {
    id: "bkash",
    icon: <Megaphone className="h-4 w-4 text-[var(--neon-pink)]" />,
    title: "বিকাশ পেমেন্ট টিউটোরিয়াল",
    headerIcon: <Megaphone className="h-5 w-5 text-[var(--neon-pink)]" />,
    body: <BkashBody />,
  },
  {
    id: "notice",
    icon: <Volume2 className="h-4 w-4 text-[var(--neon-cyan)]" />,
    title: "আনুষ্ঠানিক ঘোষণা — নতুন ওয়ে…",
    headerIcon: <Volume2 className="h-5 w-5 text-[var(--neon-cyan)]" />,
    body: <NoticeBody />,
  },
  {
    id: "refer",
    icon: <Gift className="h-4 w-4 text-[var(--neon-green)]" />,
    title: "১ জন বন্ধুকে আমন্ত্রণ জানিয়ে ১৭৭…",
    headerIcon: <Gift className="h-5 w-5 text-[var(--neon-green)]" />,
    body: <ReferBody />,
  },
  {
    id: "champ",
    icon: <Trophy className="h-4 w-4 text-[var(--neon-gold)]" />,
    title: "দৈনিক চ্যাম্পিয়নশিপ, পুরস্কার তহবি…",
    headerIcon: <Trophy className="h-5 w-5 text-[var(--neon-gold)]" />,
    body: <ChampBody />,
  },
  {
    id: "lucky",
    icon: <Sparkles className="h-4 w-4 text-[var(--neon-pink)]" />,
    title: "ভাগ্যবান লাল খাম পেতে এখনই লগ…",
    headerIcon: <Sparkles className="h-5 w-5 text-[var(--neon-pink)]" />,
    body: <LuckyBody />,
  },
  {
    id: "vip",
    icon: <Crown className="h-4 w-4 text-[var(--neon-gold)]" />,
    title: "VIP এক্সক্লুসিভ সুবিধা",
    headerIcon: <Crown className="h-5 w-5 text-[var(--neon-gold)]" />,
    body: <VipBody />,
  },
  {
    id: "safety",
    icon: <ShieldAlert className="h-4 w-4 text-[var(--neon-cyan)]" />,
    title: "নিরাপত্তা সতর্কতা",
    headerIcon: <ShieldAlert className="h-5 w-5 text-[var(--neon-cyan)]" />,
    body: <SafetyBody />,
  },
];

export function WelcomePopup() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>("bkash");

  useEffect(() => {
    const dismissed = sessionStorage.getItem("welcome_popup_dismissed");
    if (!dismissed) {
      const t = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  const close = () => {
    sessionStorage.setItem("welcome_popup_dismissed", "1");
    setOpen(false);
  };

  if (!open) return null;

  const active = announcements.find((a) => a.id === activeId) ?? announcements[0];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm animate-fade-in overflow-y-auto"
      onClick={close}
    >
      <div
        className="relative flex w-full max-w-5xl flex-col gap-3 my-4 md:flex-row md:gap-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left — Announcements list */}
        <aside className="w-full md:w-[300px] shrink-0 rounded-2xl border border-[color-mix(in_oklab,var(--neon-green)_35%,transparent)] bg-[#0b1f14]/95 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
          <header className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Megaphone className="h-5 w-5 text-[var(--neon-gold)]" />
            <h2 className="font-display text-lg font-bold text-white">ঘোষণা</h2>
          </header>
          <ul className="max-h-[220px] md:max-h-[560px] overflow-y-auto p-2">
            {announcements.map((a) => {
              const isActive = a.id === activeId;
              return (
                <li key={a.id}>
                  <button
                    onClick={() => setActiveId(a.id)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-[color-mix(in_oklab,var(--neon-green)_18%,transparent)] text-white ring-1 ring-[var(--neon-green)]/50"
                        : "text-white/75 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className={`grid h-2 w-2 shrink-0 place-items-center rounded-full ${
                        isActive ? "bg-[var(--neon-gold)] shadow-[0_0_8px_var(--neon-gold)]" : "bg-white/30"
                      }`}
                    />
                    <span className="shrink-0">{a.icon}</span>
                    <span className="truncate font-medium">{a.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Right — Content panel */}
        <section className="relative flex-1 rounded-2xl border border-[color-mix(in_oklab,var(--neon-green)_35%,transparent)] bg-[#0b1f14]/95 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.7)]">
          <button
            onClick={close}
            aria-label="close"
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/60 text-[var(--neon-gold)] transition-colors hover:bg-[var(--neon-pink)] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <header className="flex items-center gap-2 border-b border-white/10 px-5 py-3 pr-14">
            {active.headerIcon}
            <h3 className="font-display text-base md:text-lg font-bold text-white truncate">{active.title}</h3>
          </header>

          <div key={active.id} className="p-4 md:p-5 max-h-[70vh] overflow-y-auto animate-fade-in">
            {active.body}
          </div>
        </section>
      </div>
    </div>
  );
}
