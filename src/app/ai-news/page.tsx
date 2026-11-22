import type { Metadata } from "next";
import { AiNewsPage } from "@/components/AiNewsPage";
import { fetchBenchmarkData } from "@/lib/benchmarks";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "أخبار الـ AI وترتيب أقوى 10 موديلات في العالم — Tornado Academy",
  description:
    "تصنيف حي لأقوى 10 موديلات ذكاء اصطناعي (Text-to-Text) عالميًا في الذكاء العام، البرمجة، والرياضيات.",
};

export default async function ArabicAiNewsPage() {
  const initialData = await fetchBenchmarkData("aa-intelligence");
  return <AiNewsPage lang="ar" initialData={initialData} />;
}
