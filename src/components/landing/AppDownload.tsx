import { Smartphone, Apple, QrCode } from "lucide-react";
import phone from "@/assets/phone-mockup.png";

export function AppDownload() {
  return (
    <section id="download" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--neon-purple)]/40 bg-gradient-to-br from-[var(--surface)] via-[var(--surface-elevated)] to-[var(--surface)] p-6 sm:p-10 lg:p-14">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[var(--neon-purple)]/20 blur-3xl" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-[var(--neon-pink)]/20 blur-3xl" />

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--neon-cyan)]">
              <Smartphone className="h-3.5 w-3.5" /> মোবাইল অ্যাপ
            </div>
            <h2 className="text-3xl font-black sm:text-4xl lg:text-5xl">
              যেকোনো জায়গায়, <br />
              <span className="text-gradient-neon">যেকোনো সময়</span> খেলুন
            </h2>
            <p className="mt-4 text-foreground/80">
              আমাদের অফিসিয়াল অ্যাপ ডাউনলোড করুন এবং পান এক্সক্লুসিভ মোবাইল বোনাস, দ্রুত গেমপ্লে ও ইনস্ট্যান্ট নোটিফিকেশন।
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-3 rounded-xl bg-gradient-gold px-5 py-3 text-[var(--background)] shadow-lg transition-all hover:glow-gold">
                <Smartphone className="h-7 w-7" />
                <span className="text-left">
                  <span className="block text-[10px] font-bold uppercase opacity-80">ডাউনলোড করুন</span>
                  <span className="block font-black">Android APK</span>
                </span>
              </button>
              <button className="inline-flex items-center gap-3 rounded-xl border border-border bg-secondary/60 px-5 py-3 transition-all hover:border-[var(--neon-cyan)] hover:glow-cyan">
                <Apple className="h-7 w-7" />
                <span className="text-left">
                  <span className="block text-[10px] font-bold uppercase opacity-70">আসছে শীঘ্রই</span>
                  <span className="block font-black">iOS App</span>
                </span>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-background/40 p-3 sm:hidden">
              <span className="text-xs font-bold">QR কোড স্ক্যান করুন →</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center gap-6">
            <img
              src={phone}
              alt="App"
              width={400}
              height={500}
              loading="lazy"
              className="w-48 animate-float drop-shadow-2xl sm:w-64 lg:w-80"
            />
            <div className="hidden flex-col items-center gap-2 rounded-2xl border border-[var(--neon-cyan)]/40 bg-background/60 p-4 backdrop-blur sm:flex">
              <div className="grid h-32 w-32 place-items-center rounded-lg bg-white p-2 lg:h-40 lg:w-40">
                <QrCode className="h-full w-full text-[var(--background)]" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-bold text-[var(--neon-cyan)]">স্ক্যান করুন</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
