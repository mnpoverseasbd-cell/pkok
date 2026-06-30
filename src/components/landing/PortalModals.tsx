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

function PortalModal() {
  const { open, setOpen } = useModals();
  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-sm" onClick={() => setOpen(null)}>
      <div
        className="relative my-auto flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white text-slate-800 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <SideMenu active={open!} />
        <div className="relative min-w-0 flex-1 overflow-y-auto">
          <button
            onClick={() => setOpen(null)}
            aria-label="close"
            className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
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
    <aside className="hidden w-[210px] shrink-0 flex-col bg-[#0e1116] py-4 text-white sm:flex">
      <div className="px-4 pb-3 text-center font-display text-xl font-black leading-tight">
        ব্যক্তিগত
        <br />
        কেন্দ্র
      </div>
      <nav className="mt-2 flex flex-col text-sm">
        {sideMenu.map((m) => {
          const isActive = m.key === active;
          return (
            <button
              key={m.key}
              onClick={() => (m.key === "account" || m.key === "deposit" || m.key === "withdraw" ? setOpen(m.key as ModalKey) : null)}
              className={`relative flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive ? "bg-[var(--neon-gold)] font-black text-black" : "text-white/85 hover:bg-white/5"
              }`}
            >
              <m.icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{m.label}</span>
              {m.badge && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
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
  { icon: User, color: "bg-amber-400", title: "ব্যক্তিগত তথ্য", body: "আপনার অ্যাকাউন্ট নিরাপত্তা উন্নত করতে ব্যক্তিগত তথ্য পূরণ করুন।", warn: true },
  { icon: Lock, color: "bg-teal-400", title: "লগইন পাসওয়ার্ড", body: "অক্ষর এবং সংখ্যার সমন্বয়ে প্রস্তাবিত পাসওয়ার্ড, ছোট হাতের এবং বড় হাতের অক্ষর মিশে আছে।", ok: true },
  { icon: CreditCard, color: "bg-sky-500", title: "ব্যাংক হিসাব", body: "বন্ধন করা ব্যাংক হিসাবগুলি উত্তোলন, অভ্যন্তরিক স্থানান্তর বা অন্যান্য কার্যক্রমের জন্য ব্যবহার করা যেতে পারে।", warn: true },
  { icon: Smartphone, color: "bg-fuchsia-500", title: "ই-ওয়ালেট বাঁধুন", body: "উত্তোলনের জন্য ই-ওয়ালেট বাঁধুন।", warn: true },
  { icon: Lock, color: "bg-stone-400", title: "লেনদেন পাসওয়ার্ড", body: "আপনার পরিচয় যাচাই করতে লেনদেনের পাসওয়ার্ড ব্যবহার করতে হবে অ্যাকাউন্টের নিরাপত্তার উদ্দেশ্যে এবং ফান্ড সংক্রান্ত যেকোনো অপারেশনের জন্য।", warn: true },
  { icon: Power, color: "bg-slate-400", title: "লগআউট", body: "নিরাপদ লগআউট করুন" },
];

function AccountPanel() {
  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1fr_1fr]">
      {/* Profile card */}
      <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-300 to-rose-400 text-2xl">👩</div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-bold text-amber-300">
                <span>VIP</span><span className="rounded-sm bg-amber-300 px-1 text-black">0</span>
              </div>
              <div className="mt-1 flex items-center gap-1 truncate text-sm font-bold">
                1316517684 <Edit3 className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="text-[11px] text-slate-500">যোগদান করেছেন ২০২৫-০৬-২৩</div>
            </div>
            <div className="ml-auto text-3xl opacity-60">💍</div>
          </div>

          <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">1316517684 <Edit3 className="h-3 w-3" /></div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-900">
            ৳ 0.00 <RefreshCw className="h-4 w-4 text-slate-400" /> <Eye className="h-4 w-4 text-slate-400" />
          </div>

          <div className="mt-4 space-y-3 text-xs">
            <Row icon="💰" title="0 জমা দেওয়ার অনুরোধ প্রস্তুত চ…" date="৩০/০৬/২০২৬" />
            <Row icon="💵" title="0 উত্তোলন অনুরোধ প্রস্তুত চলছে।" date="৩০/০৬/২০২৬" />
            <Row icon="🛡️" title="শেষ লগইন সময়: ২০২৬-০৬-৩০ ১৩:৩০:১৯" date="শেষ লগইন আইপি: 103.23.255.112" />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 p-5 text-center text-white">
          <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-white/95 text-rose-500">
            <div>
              <div className="text-3xl font-black">নিম্ন</div>
              <div className="text-[10px] font-semibold">নিরাপত্তা শতকরা</div>
            </div>
          </div>
          <div className="mt-3 text-sm">স্কোর হল <b>14</b> পয়েন্ট</div>
          <div className="text-xs opacity-90">আপনার অ্যাকাউন্ট নিরাপত্তা স্তর হল নিম্ন</div>

          <div className="mt-4 rounded-lg bg-white/15 p-3 text-xs">
            <div className="mb-2 font-bold">পরামর্শিত সেটিং</div>
            <div className="flex justify-around">
              {[{ i: User, l: "ব্যক্তিগত তথ্য", c: "bg-amber-400" }, { i: CreditCard, l: "ব্যাংক হিসাব", c: "bg-sky-500" }, { i: Smartphone, l: "ই-ওয়ালেট বাঁধুন", c: "bg-fuchsia-500" }].map((x) => (
                <div key={x.l} className="flex flex-col items-center gap-1 text-[10px]">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${x.c} text-white`}><x.i className="h-5 w-5" /></span>
                  {x.l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security list */}
      <div className="space-y-3">
        {securityItems.map((s) => (
          <div key={s.title} className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-white ${s.color}`}><s.icon className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm font-bold">
                {s.title}
                {s.warn && <AlertCircle className="h-3.5 w-3.5 text-rose-500" />}
                {s.ok && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">{s.body}</p>
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
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-100 text-sm">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-slate-700">{title}</div>
        <div className="text-[11px] text-slate-400">{date}</div>
      </div>
    </div>
  );
}

/* ---------------- DEPOSIT ---------------- */

const payChannels = [
  { name: "NAGAD", color: "bg-orange-500", letter: "ন" },
  { name: "Bkash", color: "bg-pink-500", letter: "b" },
  { name: "USDT", color: "bg-emerald-500", letter: "₮" },
  { name: "TRX", color: "bg-rose-500", letter: "T" },
  { name: "ETH", color: "bg-slate-600", letter: "Ξ" },
];
const depositTags = ["NAGAD-CON", "NAGAD-SU", "NAGAD-BD99", "NAGAD-INR"];
const amounts = ["100", "200", "500", "1,000", "2,000", "3,000", "5,000", "10,000", "30,000", "50,000"];

function DepositPanel() {
  return (
    <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[200px_1fr]">
      {/* Channels */}
      <div className="space-y-2">
        {payChannels.map((c, i) => (
          <button
            key={c.name}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-bold ${
              i === 0 ? "border-rose-500 bg-rose-50 text-slate-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
            }`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${c.color} text-white`}>{c.letter}</span>
            <span className="truncate">{c.name}</span>
            {i === 0 && <span className="ml-auto text-amber-500"><ThumbsUp className="h-4 w-4" /></span>}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="min-w-0 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-black text-emerald-600">
            <span className="h-4 w-1 rounded bg-emerald-500" /> জমার তথ্য
          </h3>
          <button className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold text-sky-600">
            <ClipboardList className="h-3.5 w-3.5" /> জমা রেকর্ড
          </button>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[12px] leading-5 text-amber-800">
          ডিপোজিট করার নোট: ডিপোজিট করার পরে আপনার NAGAD-ID জমা দিন। সর্বদা সর্বশেষ অ্যাকাউন্ট ব্যবহার করুন। ব্যর্থতা এড়াতে পুরোনো অ্যাকাউন্ট তথ্য পুনরায় ব্যবহার করবেন না।
        </div>

        <div className="flex flex-wrap gap-2">
          {depositTags.map((t, i) => (
            <button
              key={t}
              className={`inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-bold ${
                i === 0 ? "border-rose-500 text-slate-800" : "border-slate-200 text-slate-600"
              }`}
            >
              <ThumbsUp className="h-3 w-3 text-amber-500" /> {t}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-slate-100 p-3 text-[12px] text-slate-600">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          <div className="min-w-0 flex-1 truncate">
            আপনাদের সদয় অবগতির জন্য জানানো যাচ্ছে যে, আমাদের একমাত্র ডিপোজিট পেমেন্ট অপশন হলো — 'Cash Out' / 'Send Money', 'Make Payment' অথবা 'Mobile Recharge' কোনোভাবেই গ্রহণযোগ্য নয়।
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
        </div>

        <div>
          <div className="mb-2 text-sm font-bold text-slate-700">জমার পরিমান:</div>
          <div className="flex flex-wrap gap-2">
            {amounts.map((a) => (
              <button key={a} className="min-w-[68px] rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-rose-400 hover:text-rose-500">
                {a}
              </button>
            ))}
          </div>
          <input placeholder="জমার পরিমান" className="mt-3 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-rose-400" />
          <div className="mt-2 text-xs text-emerald-600">জমাসীমা: ৳ 100 - ৳ 50,000</div>
        </div>

        <div>
          <div className="mb-2 text-sm font-bold text-slate-700">প্রচার নির্বাচন করুন:</div>
          <label className="flex items-start gap-3 rounded-md border border-slate-200 p-2">
            <input type="radio" name="promo" className="mt-1" />
            <div className="flex-1 rounded bg-gradient-to-r from-emerald-700 to-emerald-500 p-3 text-white">
              <div className="flex items-center justify-between text-sm font-bold">
                <span>🎁 প্রথম জমায় উপভোগ করুন ৫০% বোনাস</span>
                <span>৳ 100.00</span>
              </div>
              <div className="mt-1 text-xs">🎁 নতুন সদস্যের প্রথম ডিপোজিট বোনাস</div>
            </div>
          </label>
        </div>

        <button className="w-full rounded-full bg-rose-500 py-3 text-sm font-black text-white shadow-lg shadow-rose-500/30 hover:bg-rose-600">
          জমার জন্য আবেদন করুন
        </button>
      </div>
    </div>
  );
}

/* ---------------- WITHDRAW ---------------- */

const wAmounts = ["100", "200", "300", "500", "1,000", "3,000", "5,000", "10,000"];
const wChannels = [
  { name: "bKash", color: "text-pink-500", border: "border-rose-500", icon: "b" },
  { name: "নগদ", color: "text-orange-500", icon: "ন" },
  { name: "ব্যাংক অ্যাকাউন্ট", color: "text-sky-500", icon: "🏦" },
];

function WithdrawPanel() {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-6 border-b border-slate-200 text-sm font-bold">
        <button className="border-b-2 border-rose-500 pb-2 text-slate-800">উত্তোলন</button>
        <button className="pb-2 text-slate-500">অ্যাকাউন্ট ব্যবস্থাপনা</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            {wChannels.map((c, i) => (
              <button
                key={c.name}
                className={`inline-flex items-center gap-2 rounded-md border bg-white px-4 py-2 text-sm font-bold ${
                  i === 0 ? "border-rose-500" : "border-slate-200"
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full bg-slate-100 ${c.color}`}>{c.icon}</span>
                {c.name}
              </button>
            ))}
            <button className="grid h-10 w-10 place-items-center rounded-md border border-emerald-400 bg-emerald-500 text-white">
              <Edit3 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="grid h-28 w-40 place-items-center rounded-md bg-slate-200 text-slate-400">
                <CreditCard className="h-12 w-12" />
              </div>
              <div className="mt-3 text-xs text-slate-500">খালি ই-ওয়ালেট</div>
              <button className="mt-4 inline-flex items-center gap-1 rounded-full bg-rose-500 px-5 py-2 text-xs font-black text-white">
                <Plus className="h-3.5 w-3.5" /> ওয়ালেট যোগ করুন
              </button>
            </div>

            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900">
              <div className="font-bold text-amber-700">উত্তোলন সময়:</div>
              <div className="mb-2 text-rose-600 font-bold">24 ঘন্টা</div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  সৌজন্যমূলক স্মরণিকা: <b className="text-rose-500">PKOK অ্যাকাউন্ট</b> উত্তোলনের আগে অনুগ্রহ করে নিশ্চিত করুন যে আপনার ইলেকট্রনিক ওয়ালেট <b className="text-rose-500">(bKash, Nagad)</b> সঠিকভাবে সংযুক্ত করা আছে। তথ্য ভুল হলে লেনদেন বিলম্বিত হতে পারে বা উত্তোলন ব্যর্থ হতে পারে।
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <div className="text-slate-600">কেন্দ্রীয় ওয়ালেট:</div>
            <div className="font-bold text-sky-500">0.00</div>
            <div className="text-slate-600">প্রাপ্ত পরিমান:</div>
            <div className="font-bold text-sky-500">0.00</div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {wAmounts.map((a) => (
              <button key={a} className="rounded-md border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:border-rose-400">
                {a}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button className="rounded-md bg-slate-200 px-6 py-2 text-sm font-bold text-slate-500">জমা দিন</button>
            <div className="text-xs text-slate-600">
              আজ বাকি উত্তোলনের সংখ্যা: <span className="font-black text-rose-500">99</span>
            </div>
          </div>
        </div>

        <div className="border-l border-slate-200 pl-5">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold text-sky-600">
            <span className="h-3 w-1 rounded bg-sky-500" /> সাম্প্রতিক উত্তোলন
          </div>
          <div className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-400">
            <Coins className="mx-auto mb-2 h-10 w-10 opacity-40" />
            উত্তোলনের অনুরোধ পাওয়া যায়নি
          </div>
          <div className="mt-4 text-center text-xs text-slate-400">ফাঁকা</div>
        </div>
      </div>
    </div>
  );
}
