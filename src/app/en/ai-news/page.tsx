import { AiNewsPage } from "@/components/AiNewsPage";
import { fetchBenchmarkData } from "@/lib/benchmarks";
import { buildPageMetadata } from "@/lib/metadata";

export const revalidate = 3600;

export const metadata = buildPageMetadata({
  title: "AI News & Top 10 LLMs Leaderboard — Tornado Academy",
  description:
    "Live Top 10 text-to-text AI models benchmark leaderboard across Intelligence, Coding, Math, GPQA, and LiveCodeBench.",
  path: "/en/ai-news",
  ogImage: "/og/og-ai-news.jpg",
  locale: "en_US",
});

export default async function EnglishAiNewsPage() {
  const initialData = await fetchBenchmarkData("aa-intelligence");
  return <AiNewsPage lang="en" initialData={initialData} />;
}
