import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/fishing")({
  head: () => ({
    meta: [
      { title: "ফিশিং গেমস — Asik Game" },
      { name: "description", content: "JILI, JDB, CQ9 প্রোভাইডারের সেরা ফিশিং গেমস।" },
      { property: "og:title", content: "ফিশিং গেমস — Asik Game" },
      { property: "og:description", content: "সেরা ফিশিং গেমস।" },
    ],
  }),
  component: () => <GamesCategoryPage category="fishing" title="🐟 ফিশিং গেমস" subtitle="মাছ শিকার করুন আর জিতুন বড় পুরস্কার।" />,
});
