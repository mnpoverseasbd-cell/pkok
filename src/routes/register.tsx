import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Eye, EyeOff, Gift, Loader2, Lock, Phone, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/landing/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { createPhoneAccount } from "@/lib/auth.functions";
import { phoneRegex } from "@/lib/auth-utils";

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

const registerSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, { message: "১১ ডিজিটের সঠিক ফোন নম্বর দিন (01XXXXXXXXX)" }),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }).max(72),
});

function RegisterPage() {
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const registerAccount = useServerFn(createPhoneAccount);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ phone, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ভুল ইনপুট");
      return;
    }

    try {
      setLoading(true);
      const result = await registerAccount({ data: parsed.data });

      if (!result.success) {
        toast.error("এই ফোন নম্বর দিয়ে আগে অ্যাকাউন্ট আছে");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: parsed.data.password,
      });

      if (signInError) {
        toast.error("অ্যাকাউন্ট তৈরি হয়েছে, এখন ফোন নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন");
        return;
      }

      toast.success("অ্যাকাউন্ট তৈরি হয়েছে! স্বাগতম 🎉");
      navigate({ to: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "রেজিস্ট্রেশন করা যায়নি";
      toast.error(message.includes("rate limit") ? "অনেক বেশি রিকোয়েস্ট হয়েছে, কিছুক্ষণ পর আবার চেষ্টা করুন" : message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto grid max-w-6xl gap-6 px-3 py-8 sm:px-4 lg:grid-cols-[1fr_1.05fr] lg:px-6">
        <div className="rounded-3xl border border-[var(--neon-green)]/45 panel-dark p-6 sm:p-8 order-2 lg:order-1">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black text-gradient-gold">নতুন অ্যাকাউন্ট</h1>
            <p className="mt-1 text-xs text-foreground/70">১০ সেকেন্ডে রেজিস্ট্রেশন সম্পূর্ণ করুন</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground/85">ফোন নম্বর <span className="text-[var(--neon-pink)]">*</span></label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
                <Phone className="h-4 w-4 text-foreground/70" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground/85">পাসওয়ার্ড <span className="text-[var(--neon-pink)]">*</span></label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
                <Lock className="h-4 w-4 text-foreground/70" />
                <input
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="৬+ অক্ষর"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
                />
                <button type="button" onClick={() => setShow(!show)} className="text-foreground/70">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

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
