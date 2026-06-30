import { createContext, useContext, useState, type ReactNode } from "react";
import {
  X,
  User,
  Wallet,
  Banknote,
  FileText,
  ClipboardList,
  TrendingUp,
  Gift,
  Users,
  Target,
  MessageSquare,
  Lock,
  CreditCard,
  Smartphone,
  Eye,
  RefreshCw,
  Edit3,
  Plus,
  AlertCircle,
  ChevronDown,
  ThumbsUp,
  CheckCircle2,
  Power,
  Coins,
} from "lucide-react";

type ModalKey = "account" | "deposit" | "withdraw" | null;

const Ctx = createContext<{ open: ModalKey; setOpen: (k: ModalKey) => void } | null>(null);

export function ModalsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<ModalKey>(null);
  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      {open && <PortalModal />}
    </Ctx.Provider>
  );
}

export function useModals() {
  const c = useContext(Ctx);
  if (!c) throw new Error("ModalsProvider missing");
  return c;
}

const sideMenu = [
  { key: "account", icon: User, label: "আমার অ্যাকাউন্ট" },
  { key: "deposit", icon: Wallet, label: "ডিপোজিট" },
  { key: "withdraw", icon: Banknote, label: "উত্তোলন" },
  { key: "bet", icon: FileText, label: "বেটিং রেকর্ড" },
  { key: "record", icon: ClipboardList, label: "অ্যাকাউন্ট রেকর্ড" },
  { key: "pnl", icon: TrendingUp, label: "লাভ ও ক্ষতি" },
  { key: "rewards", icon: Gift, label: "পুরস্কার কেন্দ্র", badge: 2 },
  { key: "friends", icon: Users, label: "বন্ধুদের আমন্ত্রণ করুন" },
  { key: "mission", icon: Target, label: "মিশন", badge: 1 },
  { key: "inbox", icon: MessageSquare, label: "অভ্যন্তরীণ বার্তা", badge: 6 },
];

// shared neon class snippets
const cls = {
  panel: "rounded-2xl border border-[var(--neon-green)]/40 panel-dark p-4",
  panelSubtle: "rounded-xl border border-[var(--neon-green)]/30 bg-black/35 p-3",
  chip: "rounded-md border border-[var(--neon-green)]/40 bg-black/35 px-3 py-2 text-sm font-bold text-white/85 transition-colors hover:border-[var(--neon-gold)] hover:text-[var(--neon-gold)]",
  goldBtn: "rounded-full bg-gold-button px-4 py-2 text-xs font-black text-[var(--background)] transition-transform hover:scale-[1.02]",
  greenBtn: "rounded-full bg-green-button px-4 py-2 text-xs font-black text-[var(--background)] transition-transform hover:scale-[1.02]",
  heading: "flex items-center gap-2 text-sm font-black text-[var(--neon-gold)]",
};

function PortalModal() {
  const { open, setOpen } = useModals();
  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/70 p-2 sm:p-4 backdrop-blur-sm"
      onClick={() => setOpen(null)}
    >
      <div
        className="portal-shell relative my-auto flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--neon-green)]/45 text-foreground shadow-[0_20px_80px_-20px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <SideMenu active={open!} />
        <div className="relative min-w-0 flex-1 overflow-y-auto bg-[color-mix(in_oklab,var(--surface)_85%,black)]">
          <button
            onClick={() => setOpen(null)}
            aria-label="close"
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/40 text-white/80 transition-colors hover:bg-[var(--neon-pink)] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          {open === "account" && <AccountPanel />}
          {open === "deposit" && <DepositPanel />}
          {open === "withdraw" && <WithdrawPanel />}
        </div>
      </div>
    </div>
  );
}

function SideMenu({ active }: { active: Exclude<ModalKey, null> }) {
  const { setOpen } = useModals();
  return (
    <aside className="hidden w-[210px] shrink-0 flex-col bg-navbar py-4 text-white sm:flex">
      <div className="px-4 pb-3 text-center font-display text-xl font-black leading-tight text-gradient-gold">
        ব্যক্তিগত
        <br />
        কেন্দ্র
      </div>
      <nav className="mt-2 flex flex-col text-sm">
        {sideMenu.map((m) => {
          const isActive = m.key === active;
          const clickable = m.key === "account" || m.key === "deposit" || m.key === "withdraw";
          return (
            <button
              key={m.key}
              onClick={() => (clickable ? setOpen(m.key as ModalKey) : null)}
              className={`relative flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-[var(--neon-gold)] font-black text-black shadow-inner"
                  : "text-white/85 hover:bg-white/10 hover:text-[var(--neon-gold)]"
              }`}
            >
              <m.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{m.label}</span>
              {m.badge && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-[var(--neon-pink)] px-1 text-[10px] font-bold text-white">
                  {m.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/* ---------------- ACCOUNT ---------------- */

const securityItems = [
  { icon: User, color: "bg-[var(--neon-gold)] text-black", title: "ব্যক্তিগত তথ্য", body: "আপনার অ্যাকাউন্ট নিরাপত্তা উন্নত করতে ব্যক্তিগত তথ্য পূরণ করুন।", warn: true },
  { icon: Lock, color: "bg-[var(--neon-green)] text-black", title: "লগইন পাসওয়ার্ড", body: "অক্ষর ও সংখ্যার সমন্বয়ে প্রস্তাবিত পাসওয়ার্ড, ছোট ও বড় হাতের অক্ষর মিশে আছে।", ok: true },
  { icon: CreditCard, color: "bg-[var(--neon-cyan)] text-black", title: "ব্যাংক হিসাব", body: "বন্ধন করা ব্যাংক হিসাবগুলি উত্তোলন, অভ্যন্তরিক স্থানান্তর বা অন্যান্য কার্যক্রমের জন্য ব্যবহার করা যেতে পারে।", warn: true },
  { icon: Smartphone, color: "bg-[var(--neon-pink)] text-white", title: "ই-ওয়ালেট বাঁধুন", body: "উত্তোলনের জন্য ই-ওয়ালেট বাঁধুন।", warn: true },
  { icon: Lock, color: "bg-[var(--neon-purple)] text-white", title: "লেনদেন পাসওয়ার্ড", body: "আপনার পরিচয় যাচাই করতে লেনদেনের পাসওয়ার্ড ব্যবহার করতে হবে অ্যাকাউন্টের নিরাপত্তার উদ্দেশ্যে এবং ফান্ড সংক্রান্ত যেকোনো অপারেশনের জন্য।", warn: true },
  { icon: Power, color: "bg-white/15 text-white", title: "লগআউট", body: "নিরাপদ লগআউট করুন" },
];

function AccountPanel() {
  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className={cls.panel}>
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[var(--neon-pink)] to-[var(--neon-purple)] text-2xl">👩</div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold text-[var(--neon-gold)]">
                <span>VIP</span>
                <span className="rounded-sm bg-[var(--neon-gold)] px-1 text-black">0</span>
              </div>
              <div className="mt-1 flex items-center gap-1 truncate text-sm font-bold text-white">
                1316517684 <Edit3 className="h-3.5 w-3.5 text-white/50" />
              </div>
              <div className="text-[11px] text-foreground/70">যোগদান করেছেন ২০২৫-০৬-২৩</div>
            </div>
            <div className="ml-auto text-3xl opacity-50">💍</div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-xs text-foreground/70">
            1316517684 <Edit3 className="h-3 w-3" />
          </div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-black text-[var(--neon-gold)]">
            ৳ 0.00 <RefreshCw className="h-4 w-4 text-white/50" /> <Eye className="h-4 w-4 text-white/50" />
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <Row icon="💰" title="0 জমা দেওয়ার অনুরোধ প্রস্তুত চ…" date="৩০/০৬/২০২৬" />
            <Row icon="💵" title="0 উত্তোলন অনুরোধ প্রস্তুত চলছে।" date="৩০/০৬/২০২৬" />
            <Row icon="🛡️" title="শেষ লগইন সময়: ২০২৬-০৬-৩০ ১৩:৩০:১৯" date="শেষ লগইন আইপি: 103.23.255.112" />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--neon-pink)]/50 bg-[radial-gradient(circle_at_center,rgba(239,41,105,0.35),rgba(7,22,16,0.85))] p-5 text-center text-white">
          <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-black/55 ring-2 ring-[var(--neon-pink)]/50">
            <div>
              <div className="text-3xl font-black text-[var(--neon-pink)]">নিম্ন</div>
              <div className="text-[10px] font-semibold text-white/80">নিরাপত্তা শতকরা</div>
            </div>
          </div>
          <div className="mt-3 text-sm">স্কোর হল <b className="text-[var(--neon-gold)]">14</b> পয়েন্ট</div>
          <div className="text-xs opacity-90">আপনার অ্যাকাউন্ট নিরাপত্তা স্তর হল নিম্ন</div>

          <div className="mt-4 rounded-lg border border-white/10 bg-black/40 p-3 text-xs">
            <div className="mb-2 font-bold text-[var(--neon-gold)]">পরামর্শিত সেটিং</div>
            <div className="flex justify-around">
              {[
                { i: User, l: "ব্যক্তিগত তথ্য", c: "bg-[var(--neon-gold)] text-black" },
                { i: CreditCard, l: "ব্যাংক হিসাব", c: "bg-[var(--neon-cyan)] text-black" },
                { i: Smartphone, l: "ই-ওয়ালেট", c: "bg-[var(--neon-pink)] text-white" },
              ].map((x) => (
                <div key={x.l} className="flex flex-col items-center gap-1 text-[10px] text-white/80">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${x.c}`}><x.i className="h-5 w-5" /></span>
                  {x.l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {securityItems.map((s) => (
          <div key={s.title} className={`${cls.panelSubtle} flex items-start gap-3 transition-colors hover:border-[var(--neon-gold)]/60`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${s.color}`}><s.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-bold text-white">
                {s.title}
                {s.warn && <AlertCircle className="h-3.5 w-3.5 text-[var(--neon-pink)]" />}
                {s.ok && <CheckCircle2 className="h-3.5 w-3.5 text-[var(--neon-green)]" />}
              </div>
              <p className="mt-1 text-[12px] leading-5 text-foreground/70">{s.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Row({ icon, title, date }: { icon: string; title: string; date: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--neon-cyan)]/20 text-sm">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-foreground/85">{title}</div>
        <div className="text-[11px] text-foreground/55">{date}</div>
      </div>
    </div>
  );
}

/* ---------------- DEPOSIT ---------------- */

const payChannels = [
  { name: "NAGAD", color: "bg-orange-500", letter: "ন" },
  { name: "Bkash", color: "bg-[var(--neon-pink)]", letter: "b" },
  { name: "USDT", color: "bg-[var(--neon-green)] text-black", letter: "₮" },
  { name: "TRX", color: "bg-rose-500", letter: "T" },
  { name: "ETH", color: "bg-slate-500", letter: "Ξ" },
];
const depositTags = ["NAGAD-CON", "NAGAD-SU", "NAGAD-BD99", "NAGAD-INR"];
const amounts = ["100", "200", "500", "1,000", "2,000", "3,000", "5,000", "10,000", "30,000", "50,000"];

function DepositPanel() {
  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[200px_1fr]">
      <div className="space-y-2">
        {payChannels.map((c, i) => (
          <button
            key={c.name}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold transition-colors ${
              i === 0
                ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10 text-white shadow-[0_0_0_1px_rgba(245,197,66,0.25)_inset]"
                : "border-[var(--neon-green)]/30 bg-black/30 text-white/85 hover:border-[var(--neon-gold)]/60 hover:text-[var(--neon-gold)]"
            }`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-black ${c.color} text-white`}>{c.letter}</span>
            <span className="truncate">{c.name}</span>
            {i === 0 && <ThumbsUp className="ml-auto h-4 w-4 text-[var(--neon-gold)]" />}
          </button>
        ))}
      </div>

      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className={cls.heading}>
            <span className="h-4 w-1 rounded bg-[var(--neon-green)]" /> জমার তথ্য
          </h3>
          <button className="inline-flex items-center gap-1 rounded-full border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 px-3 py-1 text-xs font-bold text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/20">
            <ClipboardList className="h-3.5 w-3.5" /> জমা রেকর্ড
          </button>
        </div>

        <div className="rounded-lg border border-[var(--neon-gold)]/40 bg-[var(--neon-gold)]/10 p-3 text-[12px] leading-5 text-[var(--neon-gold)]">
          ডিপোজিট করার নোট: ডিপোজিট করার পরে আপনার NAGAD-ID জমা দিন। সর্বদা সর্বশেষ অ্যাকাউন্ট ব্যবহার করুন। ব্যর্থতা এড়াতে পুরোনো অ্যাকাউন্ট তথ্য পুনরায় ব্যবহার করবেন না।
        </div>

        <div className="flex flex-wrap gap-2">
          {depositTags.map((t, i) => (
            <button
              key={t}
              className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-bold transition-colors ${
                i === 0
                  ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10 text-[var(--neon-gold)]"
                  : "border-[var(--neon-green)]/30 bg-black/30 text-white/80 hover:border-[var(--neon-gold)]/60 hover:text-[var(--neon-gold)]"
              }`}
            >
              <ThumbsUp className="h-3 w-3 text-[var(--neon-gold)]" /> {t}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-[var(--neon-pink)]/30 bg-black/40 p-3 text-[12px] text-foreground/80">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-pink)]" />
          <div className="min-w-0 flex-1 truncate">
            আপনাদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, আমাদের একমাত্র ডিপোজিট পেমেন্ট অপশন হলো — 'Cash Out' / 'Send Money', 'Make Payment' অথবা 'Mobile Recharge' কোনোভাবেই গ্রহণযোগ্য নয়।
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-white/50" />
        </div>

        <div>
          <div className="mb-2 text-sm font-bold text-white">জমার পরিমান:</div>
          <div className="flex flex-wrap gap-2">
            {amounts.map((a) => (
              <button key={a} className={`${cls.chip} min-w-[68px] py-2`}>{a}</button>
            ))}
          </div>
          <input
            placeholder="জমার পরিমান"
            className="mt-3 w-full rounded-md border border-[var(--neon-green)]/30 bg-black/40 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[var(--neon-gold)]"
          />
          <div className="mt-2 text-xs text-[var(--neon-green)]">জমাসীমা: ৳ 100 - ৳ 50,000</div>
        </div>

        <div>
          <div className="mb-2 text-sm font-bold text-white">প্রচার নির্বাচন করুন:</div>
          <label className="flex items-start gap-3 rounded-md border border-[var(--neon-green)]/30 bg-black/30 p-2">
            <input type="radio" name="promo" className="mt-1 accent-[var(--neon-gold)]" />
            <div className="flex-1 rounded bg-gradient-to-r from-[#0c3b22] to-[#1a7a44] p-3 text-white">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>🎁 প্রথম জমায় উপভোগ করুন ৫০% বোনাস</span>
                <span className="text-[var(--neon-gold)]">৳ 100.00</span>
              </div>
              <div className="mt-1 text-xs opacity-90">🎁 নতুন সদস্যের প্রথম ডিপোজিট বোনাস</div>
            </div>
          </label>
        </div>

        <button className="w-full rounded-full bg-green-button py-3 text-sm font-black text-[var(--background)] shadow-[0_8px_30px_-10px_rgba(34,197,94,0.6)] transition-transform hover:scale-[1.01]">
          জমার জন্য আবেদন করুন
        </button>
      </div>
    </div>
  );
}

/* ---------------- WITHDRAW ---------------- */

const wAmounts = ["100", "200", "300", "500", "1,000", "3,000", "5,000", "10,000"];
const wChannels = [
  { name: "bKash", color: "text-[var(--neon-pink)]", icon: "b" },
  { name: "নগদ", color: "text-orange-400", icon: "ন" },
  { name: "ব্যাংক অ্যাকাউন্ট", color: "text-[var(--neon-cyan)]", icon: "🏦" },
];

function WithdrawPanel() {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-6 border-b border-[var(--neon-green)]/30 text-sm font-bold">
        <button className="border-b-2 border-[var(--neon-gold)] pb-2 text-[var(--neon-gold)]">উত্তোলন</button>
        <button className="pb-2 text-white/60 hover:text-white">অ্যাকাউন্ট ব্যবস্থাপনা</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {wChannels.map((c, i) => (
              <button
                key={c.name}
                className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-bold transition-colors ${
                  i === 0
                    ? "border-[var(--neon-gold)] bg-[var(--neon-gold)]/10 text-white"
                    : "border-[var(--neon-green)]/30 bg-black/30 text-white/85 hover:border-[var(--neon-gold)]/60"
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full bg-black/50 ${c.color}`}>{c.icon}</span>
                {c.name}
              </button>
            ))}
            <button className="grid h-10 w-10 place-items-center rounded-md bg-green-button text-[var(--background)] hover:scale-[1.05] transition-transform">
              <Edit3 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <div className={`${cls.panelSubtle} flex flex-col items-center justify-center p-6`}>
              <div className="grid h-28 w-40 place-items-center rounded-md border border-[var(--neon-green)]/30 bg-black/40 text-white/40">
                <CreditCard className="h-12 w-12" />
              </div>
              <div className="mt-3 text-xs text-foreground/65">খালি ই-ওয়ালেট</div>
              <button className="mt-4 inline-flex items-center gap-1 rounded-full bg-[var(--neon-pink)] px-5 py-2 text-xs font-black text-white shadow-[0_6px_24px_-8px_rgba(239,41,105,0.7)] hover:scale-[1.02] transition-transform">
                <Plus className="h-3.5 w-3.5" /> ওয়ালেট যোগ করুন
              </button>
            </div>

            <div className="rounded-lg border border-[var(--neon-gold)]/40 bg-[var(--neon-gold)]/10 p-3 text-[12px] leading-5 text-foreground/85">
              <div className="font-bold text-[var(--neon-gold)]">উত্তোলন সময়:</div>
              <div className="mb-2 font-bold text-[var(--neon-pink)]">24 ঘন্টা</div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--neon-green)]" />
                <div>
                  সৌজন্যমূলক স্মরণিকা: <b className="text-[var(--neon-pink)]">ASIK অ্যাকাউন্ট</b> উত্তোলনের আগে অনুগ্রহ করে নিশ্চিত করুন যে আপনার ইলেকট্রনিক ওয়ালেট <b className="text-[var(--neon-pink)]">(bKash, Nagad)</b> সঠিকভাবে সংযুক্ত করা আছে। তথ্য ভুল হলে লেনদেন বিলম্বিত হতে পারে বা উত্তোলন ব্যর্থ হতে পারে।
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <div className="text-foreground/70">কেন্দ্রীয় ওয়ালেট:</div>
            <div className="font-bold text-[var(--neon-cyan)]">0.00</div>
            <div className="text-foreground/70">প্রাপ্ত পরিমান:</div>
            <div className="font-bold text-[var(--neon-cyan)]">0.00</div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {wAmounts.map((a) => (
              <button key={a} className={`${cls.chip} py-2`}>{a}</button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button className="rounded-full bg-white/10 px-6 py-2 text-sm font-bold text-white/60 cursor-not-allowed">জমা দিন</button>
            <div className="text-xs text-foreground/75">
              আজ বাকি উত্তোলনের সংখ্যা: <span className="font-black text-[var(--neon-pink)]">99</span>
            </div>
          </div>
        </div>

        <div className="border-l border-[var(--neon-green)]/20 pl-5">
          <div className={`${cls.heading} mb-2`}>
            <span className="h-3 w-1 rounded bg-[var(--neon-cyan)]" /> সাম্প্রতিক উত্তোলন
          </div>
          <div className={`${cls.panelSubtle} text-center text-xs text-foreground/60`}>
            <Coins className="mx-auto mb-2 h-10 w-10 text-[var(--neon-gold)]/40" />
            উত্তোলনের অনুরোধ পাওয়া যায়নি
          </div>
          <div className="mt-4 text-center text-xs text-foreground/50">ফাঁকা</div>
        </div>
      </div>
    </div>
  );
}
