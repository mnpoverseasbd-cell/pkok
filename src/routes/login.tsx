import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Lock, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/landing/SiteShell";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "লগইন — Asik Game" },
      { name: "description", content: "Asik Game-এ লগইন করে আপনার অ্যাকাউন্টে প্রবেশ করুন। নিরাপদ ও দ্রুত অ্যাক্সেস।" },
      { property: "og:title", content: "লগইন — Asik Game" },
      { property: "og:description", content: "অ্যাকাউন্টে প্রবেশ করুন এবং প্রিয় গেম উপভোগ করুন।" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-3 py-8 sm:px-4 lg:grid-cols-[1.05fr_1fr] lg:px-6">
        <div className="hidden flex-col justify-center rounded-3xl border border-[var(--neon-gold)]/40 panel-dark p-8 lg:flex">
          <Sparkles className="h-8 w-8 text-[var(--neon-gold)]" />
          <h2 className="mt-3 text-4xl font-black text-white">
            স্বাগতম <span className="text-gradient-gold">ASIK GAME</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-foreground/80">
            লগইন করুন আর উপভোগ করুন ১০০০+ গেম, এক্সক্লুসিভ বোনাস, দৈনিক ক্যাশব্যাক এবং বিশাল জ্যাকপট।
          </p>
          <ul className="mt-6 space-y-3 text-sm text-foreground/85">
            {["১২৮-bit SSL এনক্রিপ্টেড নিরাপদ লগইন", "৫ মিনিটে দ্রুত উত্তোলন", "২৪/৭ বাংলা লাইভ সাপোর্ট"].map((t) => (
              <li key={t} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--neon-green)]" /> {t}</li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-[var(--neon-green)]/45 panel-dark p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-gradient-gold">লগইন</h1>
            <p className="mt-1 text-xs text-foreground/70">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Field icon={Phone} label="ফোন নম্বর / ইউজারনেম" placeholder="01XXXXXXXXX" />
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground/85">পাসওয়ার্ড</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
                <Lock className="h-4 w-4 text-foreground/70" />
                <input type={show ? "text" : "password"} placeholder="••••••••" className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40" />
                <button type="button" onClick={() => setShow(!show)} className="text-foreground/70">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-foreground/80">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[var(--neon-green)]" /> মনে রাখুন
              </label>
              <a href="#" className="font-bold text-[var(--neon-cyan)] hover:underline">পাসওয়ার্ড ভুলে গেছেন?</a>
            </div>

            <button className="w-full rounded-xl bg-gold-button py-3 text-base font-black text-[var(--background)] transition hover:brightness-110">লগইন করুন</button>

            <div className="relative my-2 text-center text-xs text-foreground/55">
              <span className="bg-[var(--surface)] px-2 relative z-10">অথবা</span>
              <div className="absolute left-0 right-0 top-1/2 -z-0 h-px bg-[var(--neon-green)]/30" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["Google", "Telegram", "WhatsApp"].map((s) => (
                <button key={s} type="button" className="rounded-xl border border-[var(--neon-green)]/40 bg-black/30 py-2 text-xs font-bold text-white hover:bg-[var(--neon-green)]/25">{s}</button>
              ))}
            </div>

            <p className="text-center text-sm text-foreground/75">
              অ্যাকাউন্ট নেই? <Link to="/register" className="font-bold text-[var(--neon-gold)] hover:underline">রেজিস্টার করুন</Link>
            </p>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({ icon: Icon, label, placeholder, type = "text" }: { icon: typeof Phone; label: string; placeholder: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-foreground/85">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
        <Icon className="h-4 w-4 text-foreground/70" />
        <input type={type} placeholder={placeholder} className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40" />
      </div>
    </div>
  );
}
