import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { LiveStats } from "@/components/landing/LiveStats";
import { GamesGrid } from "@/components/landing/GamesGrid";
import { Promotions } from "@/components/landing/Promotions";
import { Features } from "@/components/landing/Features";
import { AppDownload } from "@/components/landing/AppDownload";
import { Testimonials } from "@/components/landing/Testimonials";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asik Game — জিতুন বড়, খেলুন স্মার্ট" },
      {
        name: "description",
        content:
          "Asik Game — বাংলাদেশের প্রিমিয়াম গেমিং প্ল্যাটফর্ম। ১২০০+ স্লট, লাইভ ক্যাসিনো, ক্র্যাশ ও ফিশিং গেম। দ্রুত উত্তোলন, ২৪/৭ সাপোর্ট।",
      },
      { property: "og:title", content: "Asik Game — জিতুন বড়, খেলুন স্মার্ট" },
      {
        property: "og:description",
        content: "১২০০+ গেম, বিশাল বোনাস, দ্রুত উত্তোলন — সবকিছু এক জায়গায়।",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <LiveStats />
        <GamesGrid />
        <Promotions />
        <Features />
        <AppDownload />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
