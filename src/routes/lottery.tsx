import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/lottery")({
  head: () => ({
    meta: [
      { title: "লটারি গেমস — Asik Game" },
      { name: "description", content: "Lucky Lotto, Bingo Bash — লটারি ও বিঙ্গো গেমস।" },
      { property: "og:title", content: "লটারি গেমস — Asik Game" },
      { property: "og:description", content: "লটারি ও বিঙ্গো গেমস।" },
    ],
  }),
  component: () => <GamesCategoryPage category="lottery" title="🎟️ লটারি ও বিঙ্গো" subtitle="ভাগ্য পরীক্ষা করুন লটারি ও বিঙ্গো গেমসে।" />,
});
