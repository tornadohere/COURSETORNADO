import type { Metadata } from "next";
import { AiNewsPage } from "@/components/AiNewsPage";
import { fetchBenchmarkData } from "@/lib/benchmarks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "AI News & Top 10 LLMs Leaderboard — Tornado Academy",
  description:
    "Live Top 10 text-to-text AI models benchmark leaderboard across Intelligence, Coding, Math, GPQA, and LiveCodeBench.",
};

export default async function EnglishAiNewsPage() {
  const initialData = await fetchBenchmarkData("aa-intelligence");
  return <AiNewsPage lang="en" initialData={initialData} />;
}
