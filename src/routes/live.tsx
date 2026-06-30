import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "লাইভ ক্যাসিনো — Asik Game" },
      { name: "description", content: "Evolution, Pragmatic এর রিয়েল ডিলার সহ লাইভ ক্যাসিনো — Baccarat, Roulette, Dragon Tiger।" },
      { property: "og:title", content: "লাইভ ক্যাসিনো — Asik Game" },
      { property: "og:description", content: "রিয়েল ডিলার, রিয়েল টাইম লাইভ ক্যাসিনো।" },
    ],
  }),
  component: () => <GamesCategoryPage category="live" title="🎲 লাইভ ক্যাসিনো" subtitle="রিয়েল ডিলার সহ লাইভ টেবিল গেমস।" />,
});
