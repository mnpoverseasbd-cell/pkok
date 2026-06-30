import { Download, Sparkles, ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

export function Hero() {
  return (
    <section id="home" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroBg}
          alt=""
          width={1920}
          height={900}
          className="h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)]/40 via-[var(--background)]/60 to-[var(--background)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-transparent to-[var(--background)]/30" />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--neon-gold)]/40 bg-[var(--neon-gold)]/10 px-4 py-1.5 text-xs font-bold text-[var(--neon-gold)] sm:text-sm">
          <Sparkles className="h-3.5 w-3.5" />
          #১ অনলাইন গেমিং প্ল্যাটফর্ম
        </span>

        <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <span className="block text-foreground">জিতুন বড়,</span>
          <span className="block text-gradient-gold animate-neon-pulse">খেলুন স্মার্ট</span>
        </h1>

        <p className="max-w-xl text-base text-foreground/80 sm:text-lg">
          ১০০০+ প্রিমিয়াম গেম, লাইভ ক্যাসিনো, স্লট, ক্র্যাশ ও ফিশিং — সবকিছু এক জায়গায়।
          নিরাপদ, দ্রুত উত্তোলন এবং ২৪/৭ লাইভ সাপোর্ট।
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="group inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-gold px-6 py-3.5 text-base font-black text-[var(--background)] shadow-xl transition-all hover:glow-gold sm:px-8">
            এখনই জয়েন করুন
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </button>
          <button className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 px-6 py-3.5 text-base font-bold text-[var(--neon-cyan)] backdrop-blur-sm transition-all hover:bg-[var(--neon-cyan)]/15 hover:glow-cyan sm:px-8">
            <Download className="h-5 w-5" />
            অ্যাপ ডাউনলোড করুন
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-foreground/60 sm:text-sm">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-neon-pulse" />
            ১২,৪৮৩ জন এখন অনলাইনে
          </span>
          <span>✓ লাইসেন্সড ও বিশ্বস্ত</span>
          <span>✓ ৫ মিনিটে উত্তোলন</span>
        </div>
      </div>
    </section>
  );
}
