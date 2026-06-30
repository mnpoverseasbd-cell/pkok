import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/poker")({
  head: () => ({
    meta: [
      { title: "পোকার গেমস — Asik Game" },
      { name: "description", content: "Texas Holdem, Video Poker — সেরা পোকার গেমস।" },
      { property: "og:title", content: "পোকার গেমস — Asik Game" },
      { property: "og:description", content: "সেরা পোকার গেমস।" },
    ],
  }),
  component: () => <GamesCategoryPage category="poker" title="♠️ পোকার গেমস" subtitle="Texas Holdem থেকে Video Poker — সব পোকার ভ্যারিয়েন্ট।" />,
});
