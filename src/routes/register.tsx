import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Gift, Loader2, Lock, Mail, Phone, ShieldCheck, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/landing/SiteShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "রেজিস্টার — Asik Game" },
      { name: "description", content: "Asik Game-এ নতুন অ্যাকাউন্ট তৈরি করুন এবং পান ৯৫০% ওয়েলকাম বোনাস।" },
      { property: "og:title", content: "রেজিস্টার — Asik Game" },
      { property: "og:description", content: "নতুন অ্যাকাউন্ট তৈরি করে এক্সক্লুসিভ ওয়েলকাম বোনাস পান।" },
    ],
  }),
  component: RegisterPage,
});

const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, { message: "ইউজারনেম কমপক্ষে ৩ অক্ষর" })
      .max(30, { message: "ইউজারনেম সর্বোচ্চ ৩০ অক্ষর" })
      .regex(/^[a-zA-Z0-9_]+$/, { message: "শুধু অক্ষর, সংখ্যা, _ ব্যবহার করুন" }),
    email: z.string().trim().email({ message: "সঠিক ইমেইল দিন" }).max(255),
    phone: z
      .string()
      .trim()
      .regex(/^01[3-9]\d{8}$/, { message: "সঠিক বাংলাদেশী ফোন নম্বর দিন (11 digit)" }),
    password: z
      .string()
      .min(8, { message: "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর" })
      .max(72)
      .regex(/[0-9]/, { message: "পাসওয়ার্ডে অন্তত একটি সংখ্যা রাখুন" }),
    confirm: z.string(),
    agree: z.literal(true, { message: "টার্মস মেনে নিন" }),
  })
  .refine((d) => d.password === d.confirm, { path: ["confirm"], message: "পাসওয়ার্ড মিলছে না" });

function RegisterPage() {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ username, email, phone, password, confirm, agree });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ভুল ইনপুট");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          username: parsed.data.username,
          display_name: parsed.data.username,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম 🎉");
    navigate({ to: "/" });
  }

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-3 py-8 sm:px-4 lg:grid-cols-[1fr_1.05fr] lg:px-6">
        <div className="rounded-3xl border border-[var(--neon-green)]/45 panel-dark p-6 sm:p-8 order-2 lg:order-1">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-gradient-gold">নতুন অ্যাকাউন্ট</h1>
            <p className="mt-1 text-xs text-foreground/70">৩০ সেকেন্ডে রেজিস্ট্রেশন সম্পূর্ণ করুন</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <Field icon={User} label="ইউজারনেম" placeholder="৩-৩০ অক্ষর, শুধু অক্ষর/সংখ্যা/_" value={username} onChange={setUsername} />
            <Field icon={Mail} label="ইমেইল" placeholder="you@example.com" type="email" value={email} onChange={setEmail} />
            <Field icon={Phone} label="ফোন নম্বর" placeholder="01XXXXXXXXX" type="tel" value={phone} onChange={setPhone} />
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground/85">পাসওয়ার্ড</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
                <Lock className="h-4 w-4 text-foreground/70" />
                <input
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="৮+ অক্ষর, সংখ্যা সহ"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
                />
                <button type="button" onClick={() => setShow(!show)} className="text-foreground/70">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Field icon={Lock} label="পাসওয়ার্ড নিশ্চিত করুন" placeholder="আবার লিখুন" type="password" value={confirm} onChange={setConfirm} />

            <label className="flex items-start gap-2 text-xs text-foreground/80">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-[var(--neon-green)]"
              />
              আমি ১৮+ এবং <a href="#" className="font-bold text-[var(--neon-cyan)] hover:underline">টার্মস ও কন্ডিশন</a> মেনে নিচ্ছি
            </label>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-button py-3 text-base font-black text-[var(--background)] transition hover:brightness-110 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              রেজিস্টার করুন
            </button>

            <p className="text-center text-sm text-foreground/75">
              আগে থেকে অ্যাকাউন্ট আছে? <Link to="/login" className="font-bold text-[var(--neon-gold)] hover:underline">লগইন করুন</Link>
            </p>
          </form>
        </div>

        <div className="rounded-3xl border border-[var(--neon-gold)]/40 panel-dark p-8 order-1 lg:order-2">
          <Sparkles className="h-8 w-8 text-[var(--neon-gold)]" />
          <h2 className="mt-3 text-4xl font-black text-white">
            পান <span className="text-gradient-gold">৯৫০% বোনাস</span>
          </h2>
          <p className="mt-3 text-sm leading-7 text-foreground/80">
            নতুন অ্যাকাউন্টে প্রথম ডিপোজিটে পান সর্বোচ্চ ৩০,০০০ টাকা পর্যন্ত ওয়েলকাম বোনাস। সাথে ফ্রি স্পিন, দৈনিক রিওয়ার্ড আর VIP প্রিভিলেজ।
          </p>
          <div className="mt-6 space-y-3">
            {[
              { icon: Gift, t: "৯৫০% ওয়েলকাম বোনাস", d: "প্রথম ডিপোজিটে এক্সক্লুসিভ অফার" },
              { icon: ShieldCheck, t: "১০০% নিরাপদ", d: "ব্যাংক-গ্রেড এনক্রিপশন" },
              { icon: Sparkles, t: "ইনস্ট্যান্ট অ্যাক্সেস", d: "১০০০+ গেম মুহূর্তেই" },
            ].map((p) => (
              <div key={p.t} className="flex items-center gap-3 rounded-xl border border-[var(--neon-green)]/40 bg-black/30 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-green-button text-[var(--background)]"><p.icon className="h-5 w-5" /></span>
                <div>
                  <div className="text-sm font-black text-[var(--neon-gold)]">{p.t}</div>
                  <div className="text-xs text-foreground/75">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Field({
  icon: Icon,
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  icon: typeof Phone;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-foreground/85">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
        <Icon className="h-4 w-4 text-foreground/70" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
        />
      </div>
    </div>
  );
}
