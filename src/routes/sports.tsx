import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/sports")({
  head: () => ({
    meta: [
      { title: "স্পোর্টস বেটিং — Asik Game" },
      { name: "description", content: "ক্রিকেট, ফুটবল, টেনিস ও আরও — লাইভ স্পোর্টস বেটিং।" },
      { property: "og:title", content: "স্পোর্টস বেটিং — Asik Game" },
      { property: "og:description", content: "লাইভ স্পোর্টস বেটিং।" },
    ],
  }),
  component: () => <GamesCategoryPage category="sports" title="⚽ স্পোর্টস বেটিং" subtitle="ক্রিকেট, ফুটবল, টেনিস — সব লাইভ ম্যাচ।" />,
});
