import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/slots")({
  head: () => ({
    meta: [
      { title: "স্লট গেমস — Asik Game" },
      { name: "description", content: "PG, JILI, Pragmatic এবং আরও অনেক প্রোভাইডারের প্রিমিয়াম স্লট গেমস।" },
      { property: "og:title", content: "স্লট গেমস — Asik Game" },
      { property: "og:description", content: "১০০০+ স্লট গেম এক জায়গায়।" },
    ],
  }),
  component: () => <GamesCategoryPage category="slots" title="🎰 স্লট গেমস" subtitle="প্রিমিয়াম স্লট প্রোভাইডার — PG, JILI, Pragmatic, JDB।" />,
});
