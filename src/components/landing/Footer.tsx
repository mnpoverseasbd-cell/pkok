import { Crown, Facebook, Youtube, Send, MessageCircle } from "lucide-react";

const cols = [
  {
    title: "কুইক লিংক",
    items: ["হোম", "গেমস", "প্রমোশন", "VIP ক্লাব", "টুর্নামেন্ট"],
  },
  {
    title: "গেমস",
    items: ["স্লট", "লাইভ ক্যাসিনো", "ক্র্যাশ গেম", "ফিশিং", "টেবিল গেম"],
  },
  {
    title: "সাপোর্ট",
    items: ["সাহায্য কেন্দ্র", "লাইভ চ্যাট", "FAQ", "যোগাযোগ", "ব্যাংকিং"],
  },
  {
    title: "লিগ্যাল",
    items: ["শর্তাবলী", "প্রাইভেসি পলিসি", "রেসপনসিবল গেমিং", "AML নীতি", "লাইসেন্স"],
  },
];

const socials = [
  { icon: Facebook, label: "Facebook" },
  { icon: Send, label: "Telegram" },
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Youtube, label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[var(--surface)]/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_2fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-gold glow-gold">
                <Crown className="h-5 w-5 text-[var(--background)]" strokeWidth={2.5} />
              </span>
              <span className="font-display text-xl font-black">
                <span className="text-gradient-gold">ASIK</span>
                <span> GAME</span>
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm text-foreground/70">
              বাংলাদেশের সবচেয়ে বিশ্বস্ত অনলাইন গেমিং প্ল্যাটফর্ম। নিরাপদ, দ্রুত ও মজার গেমিং
              অভিজ্ঞতা পান আমাদের সাথে।
            </p>
            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-secondary/40 text-foreground/70 transition-all hover:border-[var(--neon-purple)] hover:text-[var(--neon-purple)] hover:glow-purple"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {cols.map((c) => (
              <div key={c.title}>
                <h4 className="mb-3 font-display text-sm font-black uppercase tracking-wider text-[var(--neon-gold)]">
                  {c.title}
                </h4>
                <ul className="space-y-2">
                  {c.items.map((i) => (
                    <li key={i}>
                      <a href="#" className="text-sm text-foreground/70 transition-colors hover:text-[var(--neon-cyan)]">
                        {i}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <h4 className="mb-3 font-display text-sm font-black uppercase tracking-wider text-[var(--neon-gold)]">
              পেমেন্ট মেথড
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {["bKash", "Nagad", "Rocket", "Upay", "Tap", "Visa"].map((m) => (
                <div
                  key={m}
                  className="grid h-10 place-items-center rounded-md border border-border bg-secondary/40 text-[10px] font-bold text-foreground/70"
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-center text-xs text-foreground/60 sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} Asik Game. সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full border border-[var(--neon-pink)]/50 text-[10px] font-black text-[var(--neon-pink)]">18+</span>
            শুধুমাত্র ডেমো UI — কোনো real-money gaming নয়। দায়িত্বশীল গেমিং।
          </p>
        </div>
      </div>
    </footer>
  );
}
