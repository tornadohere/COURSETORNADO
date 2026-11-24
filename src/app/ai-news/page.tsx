import { AiNewsPage } from "@/components/AiNewsPage";
import { fetchBenchmarkData } from "@/lib/benchmarks";
import { buildPageMetadata } from "@/lib/metadata";

export const revalidate = 3600;

export const metadata = buildPageMetadata({
  title: "أخبار الـ AI وترتيب أقوى 10 موديلات في العالم — Tornado Academy",
  description:
    "تصنيف حي لأقوى 10 موديلات ذكاء اصطناعي (Text-to-Text) عالميًا في الذكاء العام، البرمجة، والرياضيات.",
  path: "/ai-news",
  ogImage: "/og/og-ai-news.jpg",
  locale: "ar_EG",
});

export default async function ArabicAiNewsPage() {
  const initialData = await fetchBenchmarkData("aa-intelligence");
  return <AiNewsPage lang="ar" initialData={initialData} />;
}
