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

const vendors = [
  "UG2","PIN","POLY","SV3","RCB","SB","TF","IA","KP","TCG_SEA","JL","NS","SPB","PG","JDB","FC","BNG","PP","MG","BT","SG","SS","YB","PS","AMG","FS","WD","GM","5G","BOM","KA","BGA","L22","VA","HS","JK","NG","AMBS","MAS","MAHA","AE","FTG","EZG","MA","EP","RLX","TPG","AUX","PAS","OCT","GPI","RT","CG","NE","BTG","NLC","YGD","BSP","FP","PT","AVT","IO","RP","EGT","BBR","TB","ID","WS","CQ9","KM","R88","MW","RG","2J","SWG","EG4","SEX","EZ","VIA","WJ","AIL","SA","DG","U9W","LUC","BTI","FB",
];

const cdnBase = "https://images.23924894.com/TCG_PROD_IMAGES/RNG_LIST_VENDOR";

function DownloadPage() {
  return (
    <SiteShell footer>
      <h1 className="sr-only">PKOK APP ডাউনলোড</h1>

      <section className="mx-auto max-w-6xl px-4 pt-6 pb-10">
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          {/* Hero image */}
          <div className="order-2 md:order-1 flex justify-center">
            <img
              src={heroImg}
              alt="PKOK mobile app preview"
              width={1024}
              height={1024}
              className="w-full max-w-md drop-shadow-2xl"
            />
          </div>

          {/* Copy + CTAs */}
          <div className="order-1 md:order-2 space-y-6 text-center md:text-left">
            <div>
              <p className="text-sm uppercase tracking-widest text-[var(--neon-green)]">সেরা অভিজ্ঞতা</p>
              <h2 className="mt-2 text-4xl md:text-5xl font-black text-foreground">
                PKOK <span className="text-[var(--neon-green)]">APP</span>
              </h2>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80 max-w-lg mx-auto md:mx-0">
              বিশ্বের সেরা সমন্বিত বিনোদনমূলক নেটিভ অ্যাপ, যা মসৃণ এবং নিখুঁত ব্যবহারকারীর অভিজ্ঞতা প্রদান করে।
              প্রচুর স্পোর্টস, শীর্ষ ই-স্পোর্টস ইভেন্ট, লাইভ ডিলার, স্লট, লটারি এবং ইলেকট্রনিক গেমস এখন আপনার হাতের মুঠোয়।
              QR কোড স্ক্যান করে এখনই ডাউনলোড করুন।
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="rounded-xl bg-white p-3 shadow-lg">
                <img src={qrImg} alt="Download QR code" width={140} height={140} className="h-[140px] w-[140px]" loading="lazy" />
              </div>

              <div className="flex flex-col gap-3 w-full sm:w-auto">
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 rounded-full bg-green-button px-6 py-3 font-bold text-[var(--background)] shadow-md hover:brightness-110 transition"
                >
                  <Smartphone className="h-5 w-5" />
                  Android APP
                </a>
                <a
                  href="#"
                  className="flex items-center justify-center gap-2 rounded-full bg-gold-button px-6 py-3 font-bold text-[var(--background)] shadow-md hover:brightness-110 transition"
                >
                  <Apple className="h-5 w-5" />
                  iOS APP
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor logos grid */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h3 className="mb-4 text-center text-lg font-semibold text-foreground/90">
          আমাদের পার্টনার প্রোভাইডার
        </h3>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {vendors.map((code) => (
            <div
              key={code}
              className="flex aspect-square items-center justify-center rounded-lg border border-border/40 bg-black/30 p-2 transition hover:border-[var(--neon-green)]/60 hover:bg-black/40"
            >
              <img
                src={`${cdnBase}/${code}-COLOR.png`}
                alt={code}
                loading="lazy"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-foreground/60 max-w-4xl mx-auto text-center">
          স্লট গেম সবসময়ই PKOK ক্যাসিনোর সবচেয়ে জনপ্রিয় গেম ধরণের একটি। বৈচিত্র্যময় থিম, মনোমুগ্ধকর
          গ্রাফিক্স এবং উদ্ভাবনী বৈশিষ্ট্যসহ PKOK স্লট খেলোয়াড়দের একটি অতুলনীয় রোমাঞ্চকর অভিজ্ঞতা প্রদান করে।
        </p>
      </section>
    </SiteShell>
  );
}
