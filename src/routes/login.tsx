import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteShell } from "@/components/landing/SiteShell";
import { supabase } from "@/integrations/supabase/client";
import { phoneToEmail } from "@/lib/auth-utils";

const loginSearchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "লগইন — Asik Game" },
      { name: "description", content: "Asik Game-এ লগইন করে আপনার অ্যাকাউন্টে প্রবেশ করুন। নিরাপদ ও দ্রুত অ্যাক্সেস।" },
      { property: "og:title", content: "লগইন — Asik Game" },
      { property: "og:description", content: "অ্যাকাউন্টে প্রবেশ করুন এবং প্রিয় গেম উপভোগ করুন।" },
    ],
  }),
  validateSearch: (s) => loginSearchSchema.parse(s),
  component: LoginPage,
});

const phoneRegex = /^01[3-9]\d{8}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const loginSchema = z.object({
  identifier: z.string().trim().min(3, { message: "ফোন নম্বর দিন" }).max(255),
  password: z.string().min(6, { message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষর" }).max(72),
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { redirect } = Route.useSearch();

  async function resolveDestination(userId: string): Promise<string> {
    if (redirect && redirect.startsWith("/")) return redirect;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return data ? "/admin" : "/";
  }

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const dest = await resolveDestination(user.id);
      navigate({ to: dest, replace: true });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ identifier: username, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "ভুল ইনপুট");
      return;
    }
    const id = parsed.data.identifier;
    let email: string;
    if (phoneRegex.test(id)) email = phoneToEmail(id);
    else if (emailRegex.test(id)) email = id.toLowerCase();
    else email = `${id.toLowerCase()}@asikgame.app`;

    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "ফোন নম্বর বা পাসওয়ার্ড ভুল" : error.message);
      return;
    }
    toast.success("সফলভাবে লগইন হয়েছে");
    const uid = authData.user?.id;
    const dest = uid ? await resolveDestination(uid) : "/";
    navigate({ to: dest, replace: true });
  }

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

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground/85">ফোন নম্বর</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
                <User className="h-4 w-4 text-foreground/70" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-foreground/40"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold text-foreground/85">পাসওয়ার্ড</label>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--neon-green)]/45 bg-black/35 px-3 py-2.5">
                <Lock className="h-4 w-4 text-foreground/70" />
                <input
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
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
              লগইন করুন
            </button>

            <p className="text-center text-sm text-foreground/75">
              অ্যাকাউন্ট নেই? <Link to="/register" className="font-bold text-[var(--neon-gold)] hover:underline">রেজিস্টার করুন</Link>
            </p>
          </form>
        </div>
      </section>
    </SiteShell>
  );
}
