import { useEffect, useState } from "react";
import { X, Megaphone, Volume2, Gift, Trophy, Sparkles, Crown, ShieldAlert } from "lucide-react";
import tutorialImg from "@/assets/bkash-tutorial.jpg";

type Announcement = {
  id: string;
  icon: React.ReactNode;
  title: string;
};

const announcements: Announcement[] = [
  { id: "bkash", icon: <Megaphone className="h-4 w-4 text-[var(--neon-pink)]" />, title: "বিকাশ পেমেন্ট টিউটোরিয়াল" },
  { id: "notice", icon: <Volume2 className="h-4 w-4 text-[var(--neon-cyan)]" />, title: "আনুষ্ঠানিক ঘোষণা — নতুন ওয়ে…" },
  { id: "refer", icon: <Gift className="h-4 w-4 text-[var(--neon-green)]" />, title: "১ জন বন্ধুকে আমন্ত্রণ জানিয়ে ১৭৭…" },
  { id: "champ", icon: <Trophy className="h-4 w-4 text-[var(--neon-gold)]" />, title: "দৈনিক চ্যাম্পিয়নশিপ, পুরস্কার তহবি…" },
  { id: "lucky", icon: <Sparkles className="h-4 w-4 text-[var(--neon-pink)]" />, title: "ভাগ্যবান লাল খাম পেতে এখনই লগ…" },
  { id: "vip", icon: <Crown className="h-4 w-4 text-[var(--neon-gold)]" />, title: "VIP এক্সক্লুসিভ সুবিধা" },
  { id: "safety", icon: <ShieldAlert className="h-4 w-4 text-[var(--neon-cyan)]" />, title: "নিরাপত্তা সতর্কতা" },
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
          <ul className="max-h-[220px] md:max-h-[520px] overflow-y-auto p-2">
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
            <Megaphone className="h-5 w-5 text-[var(--neon-pink)]" />
            <h3 className="font-display text-base md:text-lg font-bold text-white truncate">{active.title}</h3>
          </header>

          <div className="p-3 md:p-5">
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
          </div>
        </section>
      </div>
    </div>
  );
}
