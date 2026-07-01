import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/landing/SiteShell";
import { Apple, Smartphone } from "lucide-react";
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

function DownloadPage() {
  return (
    <SiteShell footer>
      <h1 className="sr-only">PKOK APP ডাউনলোড</h1>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Hero image */}
          <div className="flex justify-center">
            <img
              src={heroImg}
              alt="PKOK mobile app preview"
              width={1024}
              height={1024}
              className="w-full max-w-lg drop-shadow-2xl"
            />
          </div>

          {/* Copy + QR codes */}
          <div className="space-y-6 text-center md:text-left">
            <div>
              <p className="text-sm uppercase tracking-widest text-foreground/80">BEST EXPERIENCE</p>
              <h2 className="mt-2 text-4xl md:text-5xl font-black text-[var(--neon-green)]">
                PKOK APP
              </h2>
              <div className="mt-3 h-px w-full bg-gradient-to-r from-[var(--neon-green)]/60 to-transparent" />
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">
              World's best integrated entertainment native APP, providing a smooth and perfect user experience.
              Massive sports, top e-sports events, live dealer, slots, lottery and electronic games are all in
              the palm of your hand. To experience the most complete entertainment scan qr code now to download.
            </p>

            <div className="flex flex-row items-start justify-center md:justify-start gap-4 pt-2">
              <div className="rounded-xl border-2 border-[var(--neon-green)] bg-transparent p-3 w-[180px]">
                <img src={qrImg} alt="Android QR" width={160} height={160} className="h-[150px] w-[150px] mx-auto" loading="lazy" />
                <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-foreground">
                  <Smartphone className="h-4 w-4 text-[var(--neon-green)]" />
                  Android APP
                </div>
              </div>
              <div className="rounded-xl border-2 border-[var(--neon-green)] bg-transparent p-3 w-[180px]">
                <img src={qrImg} alt="iOS QR" width={160} height={160} className="h-[150px] w-[150px] mx-auto" loading="lazy" />
                <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-foreground">
                  <Apple className="h-4 w-4 text-[var(--neon-green)]" />
                  iOS APP
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
