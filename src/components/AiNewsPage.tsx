"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Code2,
  FlaskConical,
  RefreshCw,
  Sigma,
  Sparkles,
  Terminal,
  Trophy,
} from "lucide-react";
import { LanguageProvider, type Locale } from "./LanguageContext";
import { SiteHeader } from "./SiteHeader";
import {
  BENCHMARK_METRICS,
  type BenchmarkMetricId,
  type BenchmarkPayload,
} from "@/lib/benchmarks";

const METRIC_ICONS: Record<BenchmarkMetricId, React.ElementType> = {
  "aa-intelligence": Brain,
  "aa-coding": Code2,
  "aa-math": Sigma,
  gpqa: FlaskConical,
  livecodebench: Terminal,
  "mmlu-pro": BookOpen,
};

function formatDate(iso: string, isEn: boolean): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(isEn ? "en-US" : "ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

function getCreatorTone(creator: string): string {
  const c = creator.toLowerCase();
  if (c.includes("google")) return "google";
  if (c.includes("anthropic")) return "anthropic";
  if (c.includes("openai")) return "openai";
  if (c.includes("xai") || c.includes("x.ai")) return "xai";
  if (c.includes("deepseek")) return "deepseek";
  if (c.includes("meta")) return "meta";
  return "other";
}

function AiNewsContent({
  lang,
  initialData,
}: {
  lang: Locale;
  initialData: BenchmarkPayload;
}) {
  const isEn = lang === "en";
  const [activeMetric, setActiveMetric] = useState<BenchmarkMetricId>(initialData.metric);
  const [cache, setCache] = useState<Partial<Record<BenchmarkMetricId, BenchmarkPayload>>>({
    [initialData.metric]: initialData,
  });
  const [loading, setLoading] = useState(false);

  const currentData = cache[activeMetric] ?? initialData;
  const currentMeta = useMemo(
    () => BENCHMARK_METRICS.find((m) => m.id === activeMetric) ?? BENCHMARK_METRICS[0],
    [activeMetric]
  );

  const loadMetric = useCallback(
    async (metric: BenchmarkMetricId, force = false) => {
      setActiveMetric(metric);
      if (!force && cache[metric]) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/benchmarks?metric=${encodeURIComponent(metric)}`);
        if (res.ok) {
          const json = (await res.json()) as BenchmarkPayload;
          setCache((prev) => ({ ...prev, [metric]: json }));
        }
      } catch {
        // Keep last valid payload on transient network error
      } finally {
        setLoading(false);
      }
    },
    [cache]
  );

  const topScore = currentData.models[0]?.score || 100;
  const uniqueCreators = useMemo(() => {
    const set = new Set(currentData.models.map((m) => m.creator));
    return set.size;
  }, [currentData.models]);

  const topThree = currentData.models.slice(0, 3);
  const BackArrow = isEn ? ArrowLeft : ArrowRight;
  const ForwardArrow = isEn ? ArrowRight : ArrowLeft;
  const homeHref = isEn ? "/en" : "/";
  const vaultHref = isEn ? "/en/vault" : "/vault";

  return (
    <div className="ta-vault-page ta-bench-page">
      <SiteHeader />

      <main className="ta-vault-page-main">
        <section className="ta-vault-page-hero">
          <div className="ta-vault-shell">
            <div className="ta-vault-page-navrow">
              <Link href={homeHref} className="ta-vault-back-link">
                <BackArrow size={15} strokeWidth={2.2} aria-hidden="true" />
                <span>{isEn ? "Back to Tornado Academy" : "العودة إلى Tornado Academy"}</span>
              </Link>

              <span className="ta-vault-eyebrow">
                <Activity size={13} strokeWidth={2.2} aria-hidden="true" />
                <span>
                  {isEn
                    ? "LIVE TEXT-TO-TEXT BENCHMARKS · TORNADO INDEX"
                    : "تحديث حي لأقوى موديلات النص · مؤشر تورنادو"}
                </span>
              </span>
            </div>

            <div className="ta-vault-head">
              <h1 className="ta-vault-page-title">
                {isEn
                  ? "AI News & Top 10 LLMs in the World"
                  : "أخبار الـ AI وترتيب أقوى 10 موديلات في العالم"}
              </h1>
              <p>
                {isEn
                  ? "Live global leaderboard of the top 10 text-to-text AI models ranked by independent benchmarks — updated automatically so you always know which model leads in intelligence, coding, and reasoning."
                  : "تصنيف عالمي حي ومحدّث تلقائيًا لأقوى 10 موديلات ذكاء اصطناعي (Text-to-Text) استنادًا إلى اختبارات الأداء المستقلة — عشان تكون دايمًا عارف أي موديل متصدر في الذكاء والبرمجة والمنطق."}
              </p>
            </div>

            <div className="ta-vault-stats-strip">
              <div className="ta-vault-stat">
                <strong>#1</strong>
                <span>{currentData.models[0]?.name || "—"}</span>
              </div>
              <div className="ta-vault-stat">
                <strong>
                  {currentData.models[0]?.score ?? "—"}
                  {currentMeta.unit === "%" ? "%" : ""}
                </strong>
                <span>{isEn ? "Top Benchmark Score" : "أعلى نتيجة في المؤشر"}</span>
              </div>
              <div className="ta-vault-stat">
                <strong>{uniqueCreators}</strong>
                <span>{isEn ? "AI Labs in Top 10" : "شركات AI في التوب 10"}</span>
              </div>
              <div className="ta-vault-stat">
                <strong>{formatDate(currentData.generatedAt, isEn)}</strong>
                <span>{isEn ? "Last Benchmark Sync" : "آخر تحديث للبيانات"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="ta-vault-library-section">
          <div className="ta-vault-shell">
            {/* Metric Tabs + Refresh */}
            <div className="ta-bench-toolbar">
              <div
                className="ta-bench-tabs"
                role="tablist"
                aria-label={isEn ? "Benchmark categories" : "تصنيفات الاختبارات"}
              >
                {BENCHMARK_METRICS.map((metric) => {
                  const Icon = METRIC_ICONS[metric.id];
                  const isActive = activeMetric === metric.id;
                  return (
                    <button
                      key={metric.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className="ta-bench-tab"
                      data-active={isActive}
                      onClick={() => loadMetric(metric.id)}
                    >
                      <Icon size={15} strokeWidth={2} aria-hidden="true" />
                      <span>{isEn ? metric.labelEn : metric.labelAr}</span>
                    </button>
                  );
                })}
              </div>

              <div className="ta-bench-toolbar-actions">
                <button
                  type="button"
                  className="ta-bench-refresh-btn"
                  onClick={() => loadMetric(activeMetric, true)}
                  disabled={loading}
                >
                  <RefreshCw
                    size={14}
                    strokeWidth={2.2}
                    className={loading ? "ta-bench-spin" : undefined}
                    aria-hidden="true"
                  />
                  <span>{isEn ? "Refresh" : "تحديث"}</span>
                </button>
              </div>
            </div>

            <p className="ta-bench-metric-desc">
              {isEn ? currentMeta.descEn : currentMeta.descAr}
            </p>

            {/* Top 3 Podium Cards */}
            <div className="ta-bench-podium" data-loading={loading || undefined}>
              {topThree.map((model, idx) => {
                const pct = topScore > 0 ? Math.max(8, Math.round((model.score / topScore) * 100)) : 100;
                const tone = getCreatorTone(model.creator);
                return (
                  <article
                    key={`${activeMetric}-podium-${model.slug}-${model.rank}`}
                    className="ta-bench-podium-card"
                    data-rank={idx + 1}
                  >
                    <div className="ta-bench-podium-top">
                      <span className="ta-bench-rank-pill" data-rank={idx + 1}>
                        {idx === 0 ? (
                          <Trophy size={13} strokeWidth={2.2} aria-hidden="true" />
                        ) : (
                          <Award size={13} strokeWidth={2.2} aria-hidden="true" />
                        )}
                        <span>#{model.rank}</span>
                      </span>
                      <span className={`ta-bench-creator-chip ta-bench-creator--${tone}`}>
                        {model.creator}
                      </span>
                    </div>

                    <h2 className="ta-bench-podium-name" dir="ltr">
                      {model.name}
                    </h2>

                    <div className="ta-bench-podium-score-row" dir="ltr">
                      <strong>
                        {model.score}
                        {currentMeta.unit === "%" ? "%" : ""}
                      </strong>
                      <span>
                        {currentMeta.unit === "%"
                          ? isEn
                            ? "accuracy"
                            : "دقة"
                          : isEn
                          ? "index score"
                          : "نقطة"}
                      </span>
                    </div>

                    <div className="ta-bench-bar-track" aria-hidden="true">
                      <span className="ta-bench-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Full Top 10 Leaderboard Table */}
            <div className="ta-bench-board" data-loading={loading || undefined}>
              <div className="ta-bench-board-head">
                <span className="ta-bench-col-rank">#</span>
                <span className="ta-bench-col-model">
                  {isEn ? "Text-to-Text Model" : "الموديل (Text-to-Text)"}
                </span>
                <span className="ta-bench-col-creator">
                  {isEn ? "Provider" : "الشركة المطوّرة"}
                </span>
                <span className="ta-bench-col-bar">
                  {isEn ? "Relative Strength" : "الأداء النسبي"}
                </span>
                <span className="ta-bench-col-score">
                  {isEn ? "Score" : "النتيجة"}
                </span>
              </div>

              <ol className="ta-bench-rows">
                {currentData.models.map((model) => {
                  const pct =
                    topScore > 0
                      ? Math.max(8, Math.round((model.score / topScore) * 100))
                      : 100;
                  const tone = getCreatorTone(model.creator);
                  return (
                    <li
                      key={`${activeMetric}-${model.slug}-${model.rank}`}
                      className="ta-bench-row"
                      data-top={model.rank <= 3 || undefined}
                    >
                      <span className="ta-bench-col-rank">
                        <span className="ta-bench-row-rank" data-rank={model.rank}>
                          {model.rank}
                        </span>
                      </span>

                      <span className="ta-bench-col-model" dir="ltr">
                        <strong>{model.name}</strong>
                      </span>

                      <span className="ta-bench-col-creator">
                        <span className={`ta-bench-creator-chip ta-bench-creator--${tone}`}>
                          {model.creator}
                        </span>
                      </span>

                      <span className="ta-bench-col-bar" aria-hidden="true">
                        <span className="ta-bench-bar-track">
                          <span className="ta-bench-bar-fill" style={{ width: `${pct}%` }} />
                        </span>
                      </span>

                      <span className="ta-bench-col-score" dir="ltr">
                        <strong>
                          {model.score}
                          {currentMeta.unit === "%" ? "%" : ""}
                        </strong>
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="ta-bench-board-foot">
                <span>
                  <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" />
                  {isEn
                    ? "Tornado AI Index · Top 10 Text-to-Text LLMs"
                    : "مؤشر تورنادو للذكاء الاصطناعي · أقوى 10 موديلات Text-to-Text"}
                </span>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="ta-vault-page-cta">
              <div className="ta-vault-page-cta-copy">
                <span className="ta-vault-eyebrow">
                  <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>{isEn ? "LEARN THE TOP MODELS" : "طبّق عملي بأقوى الموديلات"}</span>
                </span>
                <h2>
                  {isEn
                    ? "Every time a new #1 model drops, we break it down inside Tornado Academy"
                    : "كل ما ينزل موديل جديد يتصدر الترتيب، بنشرحه ونطبّق بيه فورًا داخل المنصة"}
                </h2>
                <p>
                  {isEn
                    ? "Explore our free Tornado Vault prompts & agent skills, or reserve your Dec 1 seat for 1,500 EGP."
                    : "جرّب خزنة تورنادو المجانية للبرومتات والمهارات، أو احجز مقعدك في دفعة 1 ديسمبر."}
                </p>
              </div>
              <div className="ta-bench-cta-actions">
                <Link href={vaultHref} className="ta-vault-cta-btn">
                  <span>{isEn ? "Open Free Vault" : "افتح خزنة تورنادو المجانية"}</span>
                  <ForwardArrow size={16} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export function AiNewsPage({
  lang,
  initialData,
}: {
  lang: Locale;
  initialData: BenchmarkPayload;
}) {
  return (
    <LanguageProvider lang={lang}>
      <AiNewsContent lang={lang} initialData={initialData} />
    </LanguageProvider>
  );
}
