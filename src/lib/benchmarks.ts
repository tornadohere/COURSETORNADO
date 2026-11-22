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
    descAr: "التصنيف الشامل لأقوى نماذج النصوص (Text-to-Text) عالميًا.",
    descEn: "Composite ranking of the strongest text-to-text LLMs globally.",
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
  models: BenchmarkModel[];
  isFallback?: boolean;
}

const VALID_METRICS = new Set<string>(BENCHMARK_METRICS.map((m) => m.id));

export function isValidMetric(value: string | null | undefined): value is BenchmarkMetricId {
  return typeof value === "string" && VALID_METRICS.has(value);
}

const FALLBACK_MODELS: BenchmarkModel[] = [
  { rank: 1, name: "Gemini 4 Carbon", slug: "gemini-4-carbon", creator: "Google", score: 60 },
  { rank: 2, name: "Claude Opus 5.5", slug: "claude-opus-5-5", creator: "Anthropic", score: 59.1 },
  { rank: 3, name: "GPT-6 Astra", slug: "gpt-6-astra", creator: "OpenAI", score: 56.9 },
  { rank: 4, name: "GPT-6.1 Sol", slug: "gpt-6-1-sol", creator: "OpenAI", score: 54.6 },
  { rank: 5, name: "Claude Sonnet 5.5", slug: "claude-sonnet-5-5", creator: "Anthropic", score: 54.5 },
  { rank: 6, name: "GPT-6.1 Terra", slug: "gpt-6-1-terra", creator: "OpenAI", score: 51.3 },
  { rank: 7, name: "Gemini 4 Argon", slug: "gemini-4-argon", creator: "Google", score: 50.8 },
  { rank: 8, name: "Muse Wonder Full", slug: "muse-wonder-full", creator: "Muse", score: 49.6 },
  { rank: 9, name: "Claude Fable 5.1", slug: "claude-fable-5-1", creator: "Anthropic", score: 49.1 },
  { rank: 10, name: "Kimi K3.1 Pro", slug: "kimi-k3-1-pro", creator: "Moonshot AI", score: 48.5 },
];

const REASONING_LEVEL_PATTERN =
  /\s*\((?:[^)]*\b(?:max|xhigh|high|medium|low|minimal|reasoning|non-reasoning|thinking|default fallback|adaptive)\b[^)]*)\)\s*$/i;

function cleanModelName(name: string): string {
  let cleaned = name.trim();
  // Strip trailing reasoning-effort / fallback level tags repeatedly
  while (REASONING_LEVEL_PATTERN.test(cleaned)) {
    cleaned = cleaned.replace(REASONING_LEVEL_PATTERN, "").trim();
  }
  return cleaned;
}

function deduplicateTopModels(
  items: Array<{ name: string; slug: string; creator: string; score: number }>
): BenchmarkModel[] {
  const seen = new Set<string>();
  const unique: BenchmarkModel[] = [];

  for (const item of items) {
    const cleanName = cleanModelName(item.name);
    const key = cleanName.toLowerCase();
    if (!cleanName || seen.has(key)) continue;
    seen.add(key);
    unique.push({
      rank: unique.length + 1,
      name: cleanName,
      slug: item.slug,
      creator: item.creator,
      score: item.score,
    });
    if (unique.length >= 10) break;
  }

  return unique;
}

const OFFICIAL_METRIC_MAP: Record<BenchmarkMetricId, string> = {
  "aa-intelligence": "artificial_analysis_intelligence_index",
  "aa-coding": "artificial_analysis_coding_index",
  "aa-math": "artificial_analysis_math_index",
  gpqa: "gpqa",
  livecodebench: "livecodebench",
  "mmlu-pro": "mmlu_pro",
};

async function fetchFromOfficialApi(
  metric: BenchmarkMetricId,
  apiKey: string
): Promise<BenchmarkPayload | null> {
  try {
    const res = await fetch("https://artificialanalysis.ai/api/v2/data/llms/models", {
      next: { revalidate: 3600 },
      headers: {
        "x-api-key": apiKey,
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      data?: Array<{
        name?: string;
        slug?: string;
        model_creator?: { name?: string };
        evaluations?: Record<string, number | null>;
      }>;
    };

    const metricKey = OFFICIAL_METRIC_MAP[metric];
    const scored = (Array.isArray(json.data) ? json.data : [])
      .map((m) => {
        const rawScore = m.evaluations?.[metricKey];
        if (!m.name || typeof rawScore !== "number") return null;
        return {
          name: m.name,
          slug: m.slug || m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          creator: m.model_creator?.name || "Unknown",
          score: metric === "gpqa" || metric === "livecodebench" || metric === "mmlu-pro"
            ? Number((rawScore <= 1 ? rawScore * 100 : rawScore).toFixed(1))
            : Number(rawScore.toFixed(1)),
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score);

    const models = deduplicateTopModels(scored);
    if (models.length === 0) return null;

    return {
      generatedAt: new Date().toISOString(),
      metric,
      sourceMetric: metricKey,
      models,
    };
  } catch {
    return null;
  }
}

export async function fetchBenchmarkData(
  metric: BenchmarkMetricId = "aa-intelligence"
): Promise<BenchmarkPayload> {
  const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY?.trim();
  if (apiKey) {
    const official = await fetchFromOfficialApi(metric, apiKey);
    if (official) return official;
  }

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
      models?: Array<{
        rank?: number;
        name?: string;
        slug?: string;
        creator?: string;
        score?: number;
      }>;
    };

    const rawItems = (Array.isArray(raw.models) ? raw.models : [])
      .filter((m) => m && typeof m.name === "string" && typeof m.score === "number")
      .map((m, idx) => ({
        name: m.name!,
        slug: typeof m.slug === "string" ? m.slug : `model-${idx + 1}`,
        creator: typeof m.creator === "string" ? m.creator : "Unknown",
        score: Number(m.score),
      }));

    const models = deduplicateTopModels(rawItems);

    if (models.length === 0) {
      throw new Error("Upstream benchmark payload contained no models");
    }

    return {
      generatedAt: raw.generated_at || new Date().toISOString(),
      metric,
      sourceMetric: raw.source_metric || metric,
      models,
    };
  } catch {
    return {
      generatedAt: new Date().toISOString(),
      metric,
      sourceMetric: "intelligence_index",
      models: FALLBACK_MODELS,
      isFallback: true,
    };
  }
}
