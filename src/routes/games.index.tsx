import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/games")({
  head: () => ({
    meta: [
      { title: "হট গেমস — Asik Game" },
      { name: "description", content: "এই মুহূর্তে সবচেয়ে জনপ্রিয় গেমস — Aviator, Olympus, Crash X এবং আরও অনেক।" },
      { property: "og:title", content: "হট গেমস — Asik Game" },
      { property: "og:description", content: "এই মুহূর্তে সবচেয়ে জনপ্রিয় গেমস।" },
    ],
  }),
  component: () => <GamesCategoryPage category="hot" title="🔥 হট গেমস" subtitle="এই মুহূর্তে সর্বাধিক খেলা হচ্ছে যে গেমগুলো।" />,
});
