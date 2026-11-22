export type BenchmarkMetricId =
  | "aa-intelligence"
  | "aa-coding"
  | "aa-math"
  | "gpqa"
  | "livecodebench"
  | "mmlu-pro";

export interface BenchmarkMetricMeta {
  id: BenchmarkMetricId;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  unit: string;
}

export const BENCHMARK_METRICS: BenchmarkMetricMeta[] = [
  {
    id: "aa-intelligence",
    labelAr: "مؤشر الذكاء العام",
    labelEn: "Intelligence Index",
    descAr: "التصنيف الشامل لأقوى نماذج النصوص (Text-to-Text) عالميًا عبر Artificial Analysis.",
    descEn: "Composite ranking of the strongest text-to-text LLMs globally via Artificial Analysis.",
    unit: "pts",
  },
  {
    id: "aa-coding",
    labelAr: "البرمجة والكود",
    labelEn: "Coding Index",
    descAr: "أداء الموديلات في كتابة الكود وحل المشكلات البرمجية المعقدة.",
    descEn: "Model performance across software engineering and complex code generation.",
    unit: "pts",
  },
  {
    id: "aa-math",
    labelAr: "الرياضيات والمنطق",
    labelEn: "Math Index",
    descAr: "قدرة الموديلات على الاستدلال الرياضي والمنطقي متعدد الخطوات.",
    descEn: "Multi-step mathematical and logical reasoning performance.",
    unit: "pts",
  },
  {
    id: "gpqa",
    labelAr: "GPQA Diamond",
    labelEn: "GPQA Diamond",
    descAr: "اختبار علمي متقدم على مستوى الدكتوراه في الفيزياء والكيمياء والأحياء.",
    descEn: "PhD-level scientific reasoning benchmark across physics, chemistry, and biology.",
    unit: "%",
  },
  {
    id: "livecodebench",
    labelAr: "LiveCodeBench",
    labelEn: "LiveCodeBench",
    descAr: "اختبار برمجي متجدد باستمرار لقياس الأداء الحقيقي بدون تسريب بيانات.",
    descEn: "Contamination-free competitive programming benchmark updated continuously.",
    unit: "%",
  },
  {
    id: "mmlu-pro",
    labelAr: "MMLU-Pro",
    labelEn: "MMLU-Pro",
    descAr: "اختبار المعرفة العامة والاستيعاب متعدد التخصصات بدرجة صعوبة عالية.",
    descEn: "Challenging multi-discipline knowledge and comprehension evaluation.",
    unit: "%",
  },
];

export interface BenchmarkModel {
  rank: number;
  name: string;
  slug: string;
  creator: string;
  score: number;
}

export interface BenchmarkPayload {
  generatedAt: string;
  metric: BenchmarkMetricId;
  sourceMetric: string;
  source: {
    name: string;
    url: string;
  };
  models: BenchmarkModel[];
  isFallback?: boolean;
}

const VALID_METRICS = new Set<string>(BENCHMARK_METRICS.map((m) => m.id));

export function isValidMetric(value: string | null | undefined): value is BenchmarkMetricId {
  return typeof value === "string" && VALID_METRICS.has(value);
}

const FALLBACK_MODELS: BenchmarkModel[] = [
  { rank: 1, name: "Gemini 4 Carbon (High)", slug: "gemini-4-carbon", creator: "Google", score: 60 },
  { rank: 2, name: "Claude Opus 5.5 (Max)", slug: "claude-opus-5-5", creator: "Anthropic", score: 59.1 },
  { rank: 3, name: "Gemini 4 Carbon (Medium)", slug: "gemini-4-carbon-medium", creator: "Google", score: 58.3 },
  { rank: 4, name: "Claude Opus 5.5 (Xhigh)", slug: "claude-opus-5-5-xhigh", creator: "Anthropic", score: 57.4 },
  { rank: 5, name: "GPT-6 Astra (Max)", slug: "gpt-6-astra", creator: "OpenAI", score: 56.9 },
  { rank: 6, name: "GPT-6 Astra (Xhigh)", slug: "gpt-6-astra-xhigh", creator: "OpenAI", score: 55.3 },
  { rank: 7, name: "GPT-6 Astra (High)", slug: "gpt-6-astra-high", creator: "OpenAI", score: 54.8 },
  { rank: 8, name: "GPT-6.1 Sol (Max)", slug: "gpt-6-1-sol", creator: "OpenAI", score: 54.6 },
  { rank: 9, name: "Claude Sonnet 5.5 (Max)", slug: "claude-sonnet-5-5", creator: "Anthropic", score: 54.5 },
  { rank: 10, name: "Gemini 4 Carbon (Low)", slug: "gemini-4-carbon-low", creator: "Google", score: 54.2 },
];

function cleanModelName(name: string): string {
  return name.replace(/,\s*Default Fallback\)/gi, ")").trim();
}

export async function fetchBenchmarkData(
  metric: BenchmarkMetricId = "aa-intelligence"
): Promise<BenchmarkPayload> {
  const url = `https://raw.githubusercontent.com/EvanZhouDev/ai-model-index/main/data/llm/${metric}.json`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream benchmark API returned ${res.status}`);
    }

    const raw = (await res.json()) as {
      generated_at?: string;
      metric?: string;
      source_metric?: string;
      source?: { name?: string; url?: string };
      models?: Array<{
        rank?: number;
        name?: string;
        slug?: string;
        creator?: string;
        score?: number;
      }>;
    };

    const models: BenchmarkModel[] = (Array.isArray(raw.models) ? raw.models : [])
      .filter((m) => m && typeof m.name === "string" && typeof m.score === "number")
      .slice(0, 10)
      .map((m, idx) => ({
        rank: typeof m.rank === "number" ? m.rank : idx + 1,
        name: cleanModelName(m.name!),
        slug: typeof m.slug === "string" ? m.slug : `model-${idx + 1}`,
        creator: typeof m.creator === "string" ? m.creator : "Unknown",
        score: Number(m.score),
      }));

    if (models.length === 0) {
      throw new Error("Upstream benchmark payload contained no models");
    }

    return {
      generatedAt: raw.generated_at || new Date().toISOString(),
      metric,
      sourceMetric: raw.source_metric || metric,
      source: {
        name: raw.source?.name || "Artificial Analysis",
        url: raw.source?.url || "https://artificialanalysis.ai/",
      },
      models,
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      metric,
      sourceMetric: "artificial_analysis_intelligence_index",
      source: {
        name: "Artificial Analysis",
        url: "https://artificialanalysis.ai/",
      },
      models: FALLBACK_MODELS,
      isFallback: true,
    };
  }
}
