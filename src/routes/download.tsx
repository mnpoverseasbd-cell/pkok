import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import { Apple, Smartphone, Download, Zap, Shield, Gift, Wifi, Bell } from "lucide-react";
import heroImg from "@/assets/download-hero.jpg";
import qrImg from "@/assets/download-qr.jpg";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "PKOK APP ডাউনলোড — সেরা মোবাইল ক্যাসিনো অভিজ্ঞতা" },
      { name: "description", content: "PKOK এর অফিসিয়াল Android ও iOS অ্যাপ ডাউনলোড করুন। স্পোর্টস, লাইভ ক্যাসিনো, স্লট, লটারি ও পোকার — সব হাতের মুঠোয়।" },
      { property: "og:title", content: "PKOK APP ডাউনলোড" },
      { property: "og:description", content: "মসৃণ ও দ্রুত মোবাইল অ্যাপ — এখনই ডাউনলোড করুন।" },
    ],
  }),
  component: DownloadPage,
});

const features = [
  { icon: Zap,   title: "সুপার ফাস্ট",     desc: "ওয়েবের চেয়ে ৩x দ্রুত লোডিং" },
  { icon: Shield, title: "নিরাপদ ও সুরক্ষিত", desc: "SSL এনক্রিপশন ও 2FA সাপোর্ট" },
  { icon: Bell,  title: "ইন্সট্যান্ট নোটিফিকেশন", desc: "বোনাস ও ম্যাচ আপডেট মিস হবে না" },
  { icon: Wifi,  title: "কম ডাটা খরচ",    desc: "3G/4G তেও মসৃণ চলে" },
  { icon: Gift,  title: "এক্সক্লুসিভ বোনাস",  desc: "অ্যাপ-ওনলি ৳৫০০ সাইন-আপ বোনাস" },
  { icon: Download, title: "ইজি ইনস্টল",  desc: "মাত্র ১৫ সেকেন্ডে ইনস্টল সম্পূর্ণ" },
];

function DownloadPage() {
  return (
    <SiteShell footer>
      <h1 className="sr-only">PKOK APP ডাউনলোড</h1>

      {/* Hero section */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(120,255,180,0.20), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(255,220,120,0.16), transparent 55%), linear-gradient(180deg, #0f5a34 0%, #0a4527 55%, #062e19 100%)",
        }}
      >
        {/* Floating gold particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[10%] top-[15%] h-2 w-2 animate-ping rounded-full bg-[var(--neon-gold)] opacity-60" />
          <div className="absolute left-[85%] top-[30%] h-1.5 w-1.5 animate-ping rounded-full bg-[var(--neon-green)] opacity-70" style={{ animationDelay: "0.8s" }} />
          <div className="absolute left-[70%] top-[70%] h-2 w-2 animate-ping rounded-full bg-[var(--neon-gold)] opacity-50" style={{ animationDelay: "1.4s" }} />
          <div className="absolute left-[25%] top-[80%] h-1.5 w-1.5 animate-ping rounded-full bg-white opacity-60" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-14">
          <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
            {/* Hero image with float animation */}
            <div className="flex justify-center animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 -z-10 rounded-full bg-[var(--neon-green)]/30 blur-3xl" />
                <img
                  src={heroImg}
                  alt="PKOK mobile app preview"
                  width={1024}
                  height={1024}
                  className="w-full max-w-lg drop-shadow-2xl"
                  style={{ animation: "float 4s ease-in-out infinite" }}
                />
              </div>
            </div>

            {/* Copy + QR codes */}
            <div className="space-y-6 text-center md:text-left animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "backwards" }}>
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--neon-gold)] ring-1 ring-[var(--neon-gold)]/50">
                  <Download className="h-3 w-3" /> BEST EXPERIENCE · v2.4.1
                </span>
                <h2 className="mt-3 text-4xl md:text-5xl font-black text-[var(--neon-gold)] drop-shadow-[0_2px_12px_rgba(255,215,80,0.35)]">
                  PKOK APP
                </h2>
                <div className="mt-3 h-px w-full bg-gradient-to-r from-[var(--neon-gold)]/60 to-transparent" />
              </div>
              <p className="text-sm leading-relaxed text-white/85">
                বিশ্বের সেরা ইন্টিগ্রেটেড এন্টারটেইনমেন্ট নেটিভ অ্যাপ — মসৃণ ও পারফেক্ট ইউজার এক্সপেরিয়েন্স।
                বিশাল স্পোর্টস, টপ ই-স্পোর্টস, লাইভ ডিলার, স্লট, লটারি ও ইলেকট্রনিক গেমস — সব হাতের মুঠোয়।
                এখনই QR কোড স্ক্যান করে ডাউনলোড করুন।
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-1">
                <div className="text-center">
                  <div className="text-2xl font-black text-[var(--neon-gold)]">4.9★</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">রেটিং</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-black text-[var(--neon-green)]">10M+</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">ডাউনলোড</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div className="text-center">
                  <div className="text-2xl font-black text-white">45MB</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/60">সাইজ</div>
                </div>
              </div>

              <div className="flex flex-row items-start justify-center md:justify-start gap-4 pt-2">
                <div className="group rounded-xl border-2 border-[var(--neon-green)] bg-black/30 p-3 w-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(120,255,180,0.35)]">
                  <div className="relative">
                    <img src={qrImg} alt="Android QR" width={160} height={160} className="h-[150px] w-[150px] mx-auto rounded" loading="lazy" />
                    <div className="pointer-events-none absolute inset-0 rounded ring-0 ring-[var(--neon-gold)] transition-all group-hover:ring-2" />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-white">
                    <Smartphone className="h-4 w-4 text-[var(--neon-green)]" />
                    Android APK
                  </div>
                </div>
                <div className="group rounded-xl border-2 border-[var(--neon-green)] bg-black/30 p-3 w-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_28px_rgba(120,255,180,0.35)]">
                  <div className="relative">
                    <img src={qrImg} alt="iOS QR" width={160} height={160} className="h-[150px] w-[150px] mx-auto rounded" loading="lazy" />
                    <div className="pointer-events-none absolute inset-0 rounded ring-0 ring-[var(--neon-gold)] transition-all group-hover:ring-2" />
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-white">
                    <Apple className="h-4 w-4 text-[var(--neon-green)]" />
                    iOS APP
                  </div>
                </div>
              </div>

              {/* Direct download buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
                <a href="#" className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#26e07f,#0f9b52)] px-5 py-2.5 text-sm font-bold text-black ring-1 ring-white/20 transition-transform hover:scale-105">
                  <Smartphone className="h-4 w-4" /> APK ডাউনলোড
                </a>
                <a href="#" className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur transition-transform hover:scale-105">
                  <Apple className="h-4 w-4" /> iOS ইনস্টল গাইড
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-black text-[var(--neon-gold)]">অ্যাপ ফিচারস</h3>
          <p className="mt-1 text-sm text-foreground/70">কেন PKOK অ্যাপ ব্যবহার করবেন</p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group animate-fade-in rounded-xl bg-[linear-gradient(180deg,#0f5a34,#083f22)] p-4 ring-1 ring-[var(--neon-green)]/30 transition-all duration-300 hover:-translate-y-1 hover:ring-[var(--neon-gold)]/60 hover:shadow-[0_10px_28px_rgba(255,215,80,0.25)]"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
            >
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-black/40 ring-1 ring-[var(--neon-gold)]/40">
                <f.icon className="h-5 w-5 text-[var(--neon-gold)]" />
              </div>
              <div className="text-sm font-bold text-white">{f.title}</div>
              <div className="mt-0.5 text-xs text-white/70">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Local keyframes for float */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-14px); }
        }
      `}</style>
    </SiteShell>
  );
}
