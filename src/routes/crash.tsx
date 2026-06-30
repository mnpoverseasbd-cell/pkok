import { createFileRoute } from "@tanstack/react-router";
import { GamesCategoryPage } from "@/components/landing/GamesCategoryPage";

export const Route = createFileRoute("/crash")({
  head: () => ({
    meta: [
      { title: "ক্র্যাশ গেমস — Asik Game" },
      { name: "description", content: "Aviator, Crash X, Mines — দ্রুত রাউন্ড ক্র্যাশ গেমস।" },
      { property: "og:title", content: "ক্র্যাশ গেমস — Asik Game" },
      { property: "og:description", content: "দ্রুত রাউন্ড, বড় মাল্টিপ্লায়ার।" },
    ],
  }),
  component: () => <GamesCategoryPage category="crash" title="🚀 ক্র্যাশ গেমস" subtitle="দ্রুত রাউন্ড, বড় মাল্টিপ্লায়ার ক্র্যাশ গেমস।" />,
});
