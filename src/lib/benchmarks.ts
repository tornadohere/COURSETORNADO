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
    labelAr: "البرمجة (FrontierCode)",
    labelEn: "Coding (FrontierCode)",
    descAr: "أداء الموديلات في كتابة الكود وحل المشكلات البرمجية المعقدة.",
    descEn: "Model performance across software engineering and complex code generation.",
    unit: "%",
  },
  {
    id: "aa-math",
    labelAr: "الاستدلال المتقدم (HLE)",
    labelEn: "Reasoning (HLE)",
    descAr: "اختبار Humanity's Last Exam للاستدلال العميق والمنطق متعدد الخطوات.",
    descEn: "Humanity's Last Exam benchmark for deep multi-step reasoning.",
    unit: "%",
  },
  {
    id: "gpqa",
    labelAr: "العلوم (GPQA Diamond)",
    labelEn: "Science (GPQA Diamond)",
    descAr: "اختبار علمي متقدم على مستوى الدكتوراه في الفيزياء والكيمياء والأحياء.",
    descEn: "PhD-level scientific reasoning benchmark across physics, chemistry, and biology.",
    unit: "%",
  },
  {
    id: "livecodebench",
    labelAr: "هندسة الكود (SciCode)",
    labelEn: "Engineering (SciCode)",
    descAr: "اختبار كتابة الأكواد العلمية والهندسية الدقيقة.",
    descEn: "Scientific and engineering code generation benchmark.",
    unit: "%",
  },
  {
    id: "mmlu-pro",
    labelAr: "المعرفة الشاملة (Omniscience)",
    labelEn: "Knowledge (Omniscience)",
    descAr: "مقياس الدقة المعرفية وتجنب الهلوسة عبر مختلف التخصصات.",
    descEn: "Knowledge accuracy and hallucination-resistance index across disciplines.",
    unit: "pts",
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
  { rank: 1, name: "Claude Fable 5.2", slug: "claude-fable-5-2", creator: "Anthropic", score: 65 },
  { rank: 2, name: "GPT-6.2 Astra", slug: "gpt-6-2-astra", creator: "OpenAI", score: 62 },
  { rank: 3, name: "Gemini 4 Neon", slug: "gemini-4-neon", creator: "Google", score: 61 },
  { rank: 4, name: "Gemini 4 Carbon", slug: "gemini-4-carbon", creator: "Google", score: 60 },
  { rank: 5, name: "Claude Opus 5.5", slug: "claude-opus-5-5", creator: "Anthropic", score: 59 },
  { rank: 6, name: "GPT-6.2 Sol", slug: "gpt-6-2-sol", creator: "OpenAI", score: 57 },
  { rank: 7, name: "Claude Sonnet 5.5", slug: "claude-sonnet-5-5", creator: "Anthropic", score: 55 },
  { rank: 8, name: "Gemini 4 Hydrogen", slug: "gemini-4-hydrogen", creator: "Google", score: 54 },
  { rank: 9, name: "GPT-6.1 Terra", slug: "gpt-6-1-terra", creator: "OpenAI", score: 51 },
  { rank: 10, name: "Muse Wonder Full", slug: "muse-wonder-full", creator: "Meta", score: 50 },
];

const REASONING_LEVEL_PATTERN =
  /\s*\((?:[^)]*\b(?:max|xhigh|high|medium|low|minimal|reasoning|non-reasoning|thinking|default fallback|adaptive)\b[^)]*)\)\s*$/i;

function cleanModelName(name: string): string {
  let cleaned = name.trim();
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

interface LiveRawModel {
  name?: string;
  shortName?: string;
  deprecated?: boolean;
  release?: { slug?: string; name?: string };
  modelCreatorName?: string;
  intelligenceIndex?: number | null;
  omniscience?: number | null;
  scores?: Record<string, number | null>;
}

function extractBalancedJsonArray(text: string, arrayStartIndex: number): string | null {
  if (arrayStartIndex < 0 || text[arrayStartIndex] !== "[") return null;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = arrayStartIndex; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      if (inString) escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        return text.slice(arrayStartIndex, i + 1);
      }
    }
  }
  return null;
}

function getLiveModelScore(model: LiveRawModel, metric: BenchmarkMetricId): number | null {
  const scores = model.scores || {};
  switch (metric) {
    case "aa-intelligence":
      return typeof model.intelligenceIndex === "number"
        ? Math.round(model.intelligenceIndex)
        : null;
    case "aa-coding": {
      const val = scores["frontiercode"] ?? scores["terminalbench-4-0"];
      return typeof val === "number" ? Number((val <= 1 ? val * 100 : val).toFixed(1)) : null;
    }
    case "aa-math": {
      const val = scores["hle-diamond"] ?? scores["humanitys-last-exam"];
      return typeof val === "number" ? Number((val <= 1 ? val * 100 : val).toFixed(1)) : null;
    }
    case "gpqa": {
      const val = scores["gpqa-diamond"];
      return typeof val === "number" ? Number((val <= 1 ? val * 100 : val).toFixed(1)) : null;
    }
    case "livecodebench": {
      const val = scores["scicode"] ?? scores["frontiercode-2-0"];
      return typeof val === "number" ? Number((val <= 1 ? val * 100 : val).toFixed(1)) : null;
    }
    case "mmlu-pro":
      return typeof model.omniscience === "number"
        ? Number(model.omniscience.toFixed(1))
        : null;
  }
}

async function fetchFromLiveLeaderboard(
  metric: BenchmarkMetricId
): Promise<BenchmarkPayload | null> {
  try {
    const res = await fetch("https://artificialanalysis.ai/leaderboards/models", {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TornadoAcademy/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const marker = '\\"initialModels\\":[';
    const markerIdx = html.indexOf(marker);
    if (markerIdx < 0) return null;

    // Find the enclosing self.__next_f.push([1,"..."]) string literal
    const pushPrefix = 'self.__next_f.push([1,"';
    const pushStart = html.lastIndexOf(pushPrefix, markerIdx);
    if (pushStart < 0) return null;

    const strStart = pushStart + pushPrefix.length - 1; // points to opening quote "
    let strEnd = -1;
    let escape = false;
    for (let i = strStart + 1; i < html.length; i++) {
      const ch = html[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (ch === "\\") {
        escape = true;
        continue;
      }
      if (ch === '"') {
        strEnd = i;
        break;
      }
    }
    if (strEnd < 0) return null;

    const decodedChunk = JSON.parse(html.slice(strStart, strEnd + 1)) as string;
    const arrMarker = '"initialModels":[';
    const arrMarkerIdx = decodedChunk.indexOf(arrMarker);
    if (arrMarkerIdx < 0) return null;

    const arrStart = arrMarkerIdx + arrMarker.length - 1;
    const arrJson = extractBalancedJsonArray(decodedChunk, arrStart);
    if (!arrJson) return null;

    const rawModels = JSON.parse(arrJson) as LiveRawModel[];
    if (!Array.isArray(rawModels) || rawModels.length === 0) return null;

    const scored = rawModels
      .filter((m) => !m.deprecated)
      .map((m, idx) => {
        const score = getLiveModelScore(m, metric);
        const baseName = m.release?.name || m.name || m.shortName;
        if (!baseName || score === null) return null;
        return {
          name: baseName,
          slug: m.release?.slug || `model-${idx + 1}`,
          creator: m.modelCreatorName || "Unknown",
          score,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score);

    const models = deduplicateTopModels(scored);
    if (models.length === 0) return null;

    return {
      generatedAt: new Date().toISOString(),
      metric,
      sourceMetric: metric,
      models,
    };
  } catch {
    return null;
  }
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
          score:
            metric === "gpqa" || metric === "livecodebench" || metric === "mmlu-pro"
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

  const live = await fetchFromLiveLeaderboard(metric);
  if (live) return live;

  return {
    generatedAt: new Date().toISOString(),
    metric,
    sourceMetric: metric,
    models: FALLBACK_MODELS,
    isFallback: true,
  };
}
