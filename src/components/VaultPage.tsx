"use client";

import React, { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Copy,
  Download,
  Film,
  Info,
  Layers,
  LayoutGrid,
  Lock,
  Palette,
  Search,
  Sparkles,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { LanguageProvider, type Locale } from "./LanguageContext";
import { SiteHeader } from "./SiteHeader";
import {
  TORNADO_SIGNATURE_BUNDLE,
  VAULT_ITEMS,
  VAULT_TRACKS,
  type VaultCategory,
  type VaultItem,
  type VaultItemType,
} from "@/data/vaultData";

const TRACK_ICONS: Record<VaultCategory, React.ElementType> = {
  coding: Code2,
  video: Film,
  design: Palette,
  marketing: TrendingUp,
};

function VaultWindowCard({
  item,
  isEn,
  copiedKey,
  onCopy,
  onDownload,
}: {
  item: VaultItem;
  isEn: boolean;
  copiedKey: string | null;
  onCopy: (key: string, text: string) => void;
  onDownload: (fileName: string, text: string) => void;
}) {
  const isSkill = item.type === "skill";
  const isContentCopied = copiedKey === item.id;
  const cmdKey = `${item.id}-cmd`;
  const isCmdCopied = copiedKey === cmdKey;

  return (
    <article className="ta-vault-window">
      <div className="ta-vault-window-bar" dir="ltr">
        <div className="ta-vault-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="ta-vault-window-file">
          {isSkill ? (
            <Layers size={12} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Terminal size={12} strokeWidth={2.2} aria-hidden="true" />
          )}
          <span>{item.fileName}</span>
        </span>
        <button
          type="button"
          className="ta-vault-copy-pill"
          data-copied={isContentCopied}
          onClick={() => onCopy(item.id, item.content)}
        >
          {isContentCopied ? (
            <>
              <Check size={13} strokeWidth={2.6} aria-hidden="true" />
              <span>{isEn ? "Copied" : "تم النسخ"}</span>
            </>
          ) : (
            <>
              <Copy size={13} strokeWidth={2.2} aria-hidden="true" />
              <span>{isEn ? "Copy" : "نسخ"}</span>
            </>
          )}
        </button>
      </div>

      <div className="ta-vault-window-intro">
        <div className="ta-vault-window-meta">
          <span
            className={`ta-vault-type-chip${
              isSkill ? " ta-vault-type-chip--skill" : ""
            }`}
          >
            {isSkill
              ? isEn
                ? "SKILL · FREE"
                : "مهارة · مجاني"
              : isEn
              ? "PROMPT · FREE"
              : "برومت · مجاني"}
          </span>
          <span className="ta-vault-window-tag">
            {isEn ? item.tagEn : item.tagAr}
          </span>
        </div>
        <h3>{isEn ? item.titleEn : item.titleAr}</h3>
        <p>{isEn ? item.descEn : item.descAr}</p>

        <div className="ta-vault-howto">
          <span className="ta-vault-howto-label">
            <Info size={13} strokeWidth={2.2} aria-hidden="true" />
            <span>{isEn ? "How to use:" : "طريقة الاستخدام:"}</span>
          </span>
          <p>{isEn ? item.howToEn : item.howToAr}</p>
        </div>

        {item.installCmd && (
          <div className="ta-vault-install-bar" dir="ltr">
            <code>{item.installCmd}</code>
            <button
              type="button"
              className="ta-vault-install-copy"
              data-copied={isCmdCopied}
              onClick={() => onCopy(cmdKey, item.installCmd!)}
            >
              {isCmdCopied ? (
                <>
                  <Check size={12} strokeWidth={2.5} aria-hidden="true" />
                  <span>{isEn ? "Copied" : "تم النسخ"}</span>
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2.2} aria-hidden="true" />
                  <span>{isEn ? "Copy CLI" : "نسخ الأمر"}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="ta-vault-code-shell">
        <pre className="ta-vault-code" dir="ltr">
          {item.content}
        </pre>
      </div>

      <div className="ta-vault-window-foot">
        <span className="ta-vault-compat">
          {isEn ? item.compatEn : item.compatAr}
        </span>
        <div className="ta-vault-foot-actions">
          {isSkill && (
            <button
              type="button"
              className="ta-vault-foot-download"
              onClick={() => onDownload(item.fileName, item.content)}
            >
              <Download size={14} strokeWidth={2.2} aria-hidden="true" />
              <span>{isEn ? "Download .md" : "تحميل SKILL.md"}</span>
            </button>
          )}
          <button
            type="button"
            className="ta-vault-foot-copy"
            data-copied={isContentCopied}
            onClick={() => onCopy(item.id, item.content)}
          >
            {isContentCopied ? (
              <>
                <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                <span>{isEn ? "Copied" : "تم النسخ"}</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>
                  {isSkill
                    ? isEn
                      ? "Copy Skill"
                      : "انسخ المهارة"
                    : isEn
                    ? "Copy Prompt"
                    : "انسخ البرومت"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

function parseTrackParam(value: string | null): VaultCategory | "all" {
  if (
    value === "coding" ||
    value === "video" ||
    value === "design" ||
    value === "marketing"
  ) {
    return value;
  }
  return "all";
}

function VaultPageInner({ lang }: { lang: Locale }) {
  const isEn = lang === "en";
  const searchParams = useSearchParams();
  const initialTrack = parseTrackParam(searchParams.get("track"));
  const [selectedTrack, setSelectedTrack] = useState<VaultCategory | "all">(initialTrack);
  const [selectedType, setSelectedType] = useState<VaultItemType | "all">("all");
  const [query, setQuery] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const homeHref = isEn ? "/en" : "/";
  const waitlistHref = isEn ? "/en#why-wait" : "/#why-wait";

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return VAULT_ITEMS.filter((item) => {
      if (selectedTrack !== "all" && item.category !== selectedTrack) return false;
      if (selectedType !== "all" && item.type !== selectedType) return false;
      if (!q) return true;
      const haystack = [
        item.titleAr,
        item.titleEn,
        item.descAr,
        item.descEn,
        item.howToAr,
        item.howToEn,
        item.tagAr,
        item.tagEn,
        item.fileName,
        item.compatAr,
        item.compatEn,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [selectedTrack, selectedType, query]);

  const prompts = filteredItems.filter((item) => item.type === "prompt");
  const skills = filteredItems.filter((item) => item.type === "skill");

  const totalPrompts = VAULT_ITEMS.filter((i) => i.type === "prompt").length;
  const totalSkills = VAULT_ITEMS.filter((i) => i.type === "skill").length;

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((cur) => (cur === key ? null : cur));
    }, 2200);
  };

  const handleDownload = (fileName: string, text: string) => {
    const safeName = fileName.replace(/\//g, "-");
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const bundleHighlights = isEn
    ? TORNADO_SIGNATURE_BUNDLE.highlightsEn
    : TORNADO_SIGNATURE_BUNDLE.highlightsAr;

  return (
    <LanguageProvider lang={lang}>
      <div className="ta-vault-page" dir={isEn ? "ltr" : "rtl"}>
        <a className="skip-link" href="#vault-main">
          {isEn ? "Skip to vault library" : "انتقل إلى مكتبة الخزنة"}
        </a>
        <SiteHeader editorial />

        <main id="vault-main" className="ta-vault-page-main">
          {/* Editorial Obsidian Hero */}
          <section className="ta-vault-page-hero">
            <div className="ta-shell">
              <div className="ta-vault-page-navrow">
                <Link href={homeHref} className="ta-vault-back-link">
                  {isEn ? (
                    <ArrowLeft size={16} strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
                  )}
                  <span>{isEn ? "Back to Tornado Academy" : "العودة إلى الرئيسية"}</span>
                </Link>
                <span className="ta-editorial-meta" dir="ltr">
                  SKILLS.SH + TORNADO PROMPTS · FREE LIBRARY
                </span>
              </div>

              <div className="ta-editorial-header ta-editorial-header--dark">
                <h1 className="ta-editorial-title ta-vault-page-title">
                  {isEn ? (
                    <>
                      Tornado Vault.
                      <br />
                      <span>Real Prompts &amp; skills.sh Skills.</span>
                    </>
                  ) : (
                    <>
                      خزنة تورنادو الكاملة.
                      <br />
                      <span>برومتات ومهارات حقيقية مجانًا.</span>
                    </>
                  )}
                </h1>
                <p className="ta-editorial-lead">
                  {isEn
                    ? "Every track includes battle-tested Prompts with simple how-to steps, plus real Agent Skills sourced from skills.sh — ready to copy, install, or download for free."
                    : "مكتبة مفتوحة بالكامل مجانًا: كل مجال فيها فيه برومتات حقيقية مجرّبة مع شرح بسيط لطريقة استخدامها، ومهارات حقيقية من موقع skills.sh جاهزة للنسخ أو التحميل الفوري."}
                </p>
              </div>

              <div className="ta-vault-stats-strip">
                <div className="ta-vault-stat">
                  <strong dir="ltr">04</strong>
                  <span>{isEn ? "Practical AI Tracks" : "مسارات عملية"}</span>
                </div>
                <div className="ta-vault-stat">
                  <strong dir="ltr">{String(totalPrompts).padStart(2, "0")}</strong>
                  <span>{isEn ? "Tested Prompts" : "برومتات مجرّبة للنسخ"}</span>
                </div>
                <div className="ta-vault-stat">
                  <strong dir="ltr">{String(totalSkills).padStart(2, "0")}</strong>
                  <span>{isEn ? "skills.sh & Agent Skills" : "مهارات حقيقية (Skills)"}</span>
                </div>
                <div className="ta-vault-stat">
                  <strong dir="ltr">100%</strong>
                  <span>{isEn ? "Free Access + How-To" : "مجانًا + شرح الاستخدام"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Filters & Library */}
          <section className="ta-vault-library-section">
            <div className="ta-shell">
              {/* FIRST AT THE TOP OF ANY PAGE: TORNADO SIGNATURE BUNDLE (COMMUNITY MEMBERS ONLY) */}
              <article className="ta-signature-bundle">
                <div className="ta-signature-bundle-top">
                  <span className="ta-signature-badge">
                    <Lock size={13} strokeWidth={2.4} aria-hidden="true" />
                    <span>
                      {isEn
                        ? TORNADO_SIGNATURE_BUNDLE.badgeEn
                        : TORNADO_SIGNATURE_BUNDLE.badgeAr}
                    </span>
                  </span>
                  <span className="ta-signature-tag">
                    <Sparkles size={13} strokeWidth={2.2} aria-hidden="true" />
                    <span>
                      {isEn ? "Creator's Daily Stack" : "الأدوات اللي بستخدمها في كل فيديوهاتي"}
                    </span>
                  </span>
                </div>

                <div className="ta-signature-grid">
                  <div className="ta-signature-copy">
                    <h2>
                      {isEn
                        ? TORNADO_SIGNATURE_BUNDLE.titleEn
                        : TORNADO_SIGNATURE_BUNDLE.titleAr}
                    </h2>
                    <p>
                      {isEn
                        ? TORNADO_SIGNATURE_BUNDLE.subtitleEn
                        : TORNADO_SIGNATURE_BUNDLE.subtitleAr}
                    </p>
                    <ul className="ta-signature-list">
                      {bundleHighlights.map((point) => (
                        <li key={point}>
                          <span className="ta-signature-check" aria-hidden="true">
                            <Check size={12} strokeWidth={2.8} />
                          </span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="ta-signature-cta-box">
                    <Link href={waitlistHref} className="ta-pill-btn ta-signature-btn">
                      <span>
                        {isEn
                          ? TORNADO_SIGNATURE_BUNDLE.ctaEn
                          : TORNADO_SIGNATURE_BUNDLE.ctaAr}
                      </span>
                      <span className="ta-pill-btn-circle" aria-hidden="true">
                        {isEn ? (
                          <ArrowRight size={16} strokeWidth={2.2} />
                        ) : (
                          <ArrowLeft size={16} strokeWidth={2.2} />
                        )}
                      </span>
                    </Link>
                    <span className="ta-signature-note">
                      {isEn
                        ? TORNADO_SIGNATURE_BUNDLE.noteEn
                        : TORNADO_SIGNATURE_BUNDLE.noteAr}
                    </span>
                  </div>
                </div>
              </article>

              <div className="ta-vault-controls">
                {/* Track Filter Dock */}
                <div
                  className="ta-vault-dock"
                  role="tablist"
                  aria-label={isEn ? "Filter by track" : "تصفية حسب المجال"}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedTrack === "all"}
                    data-active={selectedTrack === "all"}
                    className="ta-vault-dock-btn"
                    onClick={() => setSelectedTrack("all")}
                  >
                    <LayoutGrid size={15} strokeWidth={2.2} aria-hidden="true" />
                    <span>{isEn ? "All Tracks" : "كل المجالات"}</span>
                  </button>
                  {VAULT_TRACKS.map((track) => {
                    const Icon = TRACK_ICONS[track.id];
                    const isSelected = selectedTrack === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        data-active={isSelected}
                        className="ta-vault-dock-btn"
                        onClick={() => setSelectedTrack(track.id)}
                      >
                        <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                        <span>{isEn ? track.en : track.ar}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Type Filter + Search */}
                <div className="ta-vault-subcontrols">
                  <div
                    className="ta-vault-type-switch"
                    role="group"
                    aria-label={isEn ? "Filter by content type" : "تصفية حسب النوع"}
                  >
                    <button
                      type="button"
                      data-active={selectedType === "all"}
                      onClick={() => setSelectedType("all")}
                    >
                      {isEn ? "All" : "الكل"}
                    </button>
                    <button
                      type="button"
                      data-active={selectedType === "prompt"}
                      onClick={() => setSelectedType("prompt")}
                    >
                      <Terminal size={13} strokeWidth={2.2} aria-hidden="true" />
                      <span>{isEn ? "Prompts" : "برومتات"}</span>
                    </button>
                    <button
                      type="button"
                      data-active={selectedType === "skill"}
                      onClick={() => setSelectedType("skill")}
                    >
                      <Layers size={13} strokeWidth={2.2} aria-hidden="true" />
                      <span>{isEn ? "Skills" : "مهارات (Skills)"}</span>
                    </button>
                  </div>

                  <label className="ta-vault-search">
                    <Search size={15} strokeWidth={2.2} aria-hidden="true" />
                    <input
                      type="search"
                      value={query}
                      onChange={(ev) => setQuery(ev.target.value)}
                      placeholder={
                        isEn
                          ? "Search prompts, skills, or tools..."
                          : "ابحث في البرومتات أو المهارات أو الأدوات..."
                      }
                    />
                  </label>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="ta-vault-empty">
                  <p>
                    {isEn
                      ? "No prompts or skills matched your search."
                      : "مفيش نتائج مطابقة للبحث الحالي."}
                  </p>
                  <button
                    type="button"
                    className="ta-vault-foot-copy"
                    onClick={() => {
                      setSelectedTrack("all");
                      setSelectedType("all");
                      setQuery("");
                    }}
                  >
                    {isEn ? "Reset filters" : "إعادة ضبط الفلاتر"}
                  </button>
                </div>
              ) : (
                <div className="ta-vault-groups">
                  {/* PROMPTS SECTION */}
                  {prompts.length > 0 && (
                    <div className="ta-vault-group">
                      <div className="ta-vault-group-head">
                        <div className="ta-vault-group-title">
                          <span className="ta-vault-group-icon" aria-hidden="true">
                            <Terminal size={18} strokeWidth={2.2} />
                          </span>
                          <div>
                            <h2>
                              {isEn ? "Prompts Library" : "قسم البرومتات (Prompts)"}
                            </h2>
                            <p>
                              {isEn
                                ? "Tested prompts with clear step-by-step usage notes for free & paid AI tools."
                                : "برومتات عملية مجرّبة مع شرح بسيط لطريقة استخدامها على الأدوات المجانية والمدفوعة."}
                            </p>
                          </div>
                        </div>
                        <span className="ta-vault-group-count" dir="ltr">
                          {String(prompts.length).padStart(2, "0")} PROMPTS
                        </span>
                      </div>

                      <div className="ta-vault-windows">
                        {prompts.map((item) => (
                          <VaultWindowCard
                            key={item.id}
                            item={item}
                            isEn={isEn}
                            copiedKey={copiedKey}
                            onCopy={handleCopy}
                            onDownload={handleDownload}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SKILLS SECTION */}
                  {skills.length > 0 && (
                    <div className="ta-vault-group">
                      <div className="ta-vault-group-head">
                        <div className="ta-vault-group-title">
                          <span
                            className="ta-vault-group-icon ta-vault-group-icon--skill"
                            aria-hidden="true"
                          >
                            <Layers size={18} strokeWidth={2.2} />
                          </span>
                          <div>
                            <h2>
                              {isEn
                                ? "Real Agent Skills (skills.sh & Workflows)"
                                : "قسم المهارات الحقيقية (skills.sh & Skills)"}
                            </h2>
                            <p>
                              {isEn
                                ? "Real skills from skills.sh and production SKILL.md packs for Claude Code, Codex, Cursor, and creative AI pipelines."
                                : "مهارات حقيقية من موقع skills.sh وملفات SKILL.md جاهزة للنسخ أو التثبيت بأمر واحد لـ Claude Code وCodex."}
                            </p>
                          </div>
                        </div>
                        <span className="ta-vault-group-count" dir="ltr">
                          {String(skills.length).padStart(2, "0")} SKILLS
                        </span>
                      </div>

                      <div className="ta-vault-windows">
                        {skills.map((item) => (
                          <VaultWindowCard
                            key={item.id}
                            item={item}
                            isEn={isEn}
                            copiedKey={copiedKey}
                            onCopy={handleCopy}
                            onDownload={handleDownload}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom Waitlist CTA */}
              <div className="ta-vault-footer-bar ta-vault-page-cta">
                <div className="ta-vault-footer-copy">
                  <strong>
                    {isEn
                      ? "Want the full Tornado Signature Bundle + step-by-step courses?"
                      : "عاوز تفتح حزمة تورنادو المميزة + الكورسات العملية والتطبيق المباشر؟"}
                  </strong>
                  <p>
                    {isEn
                      ? "Join Tornado Academy on December 1st — 1,500 EGP one-time all-access with a 3-day 100% money-back guarantee."
                      : "احجز مقعدك في افتتاح Tornado Academy يوم 1 ديسمبر — الدخول الشامل بـ 1500 ج.م مرة واحدة وضمان استرداد كامل في أول 3 أيام."}
                  </p>
                </div>
                <Link href={waitlistHref} className="ta-pill-btn">
                  <span>
                    {isEn ? "Join Waitlist · Dec 1" : "احجز مقعدك · افتتاح 1 ديسمبر"}
                  </span>
                  <span className="ta-pill-btn-circle" aria-hidden="true">
                    {isEn ? (
                      <ArrowRight size={16} strokeWidth={2.2} />
                    ) : (
                      <ArrowLeft size={16} strokeWidth={2.2} />
                    )}
                  </span>
                </Link>
              </div>
            </div>
          </section>
        </main>

        <footer className="site-copyright">
          <p className="site-copyright-owner">
            <bdi>© 2026 Tornado Academy</bdi>{" "}
            <span>{isEn ? "All rights reserved." : "جميع الحقوق محفوظة."}</span>
          </p>
          <p>
            {isEn
              ? "Tornado Vault — 100% Free Prompts & skills.sh Agent Skills Library."
              : "خزنة تورنادو — مكتبة برومتات ومهارات (Skills) مجانية بالكامل في البرمجة، المونتاج، الجرافيك، والـ Media Buying."}
          </p>
        </footer>
      </div>
    </LanguageProvider>
  );
}

export function VaultPage({ lang }: { lang: Locale }) {
  return (
    <Suspense fallback={null}>
      <VaultPageInner lang={lang} />
    </Suspense>
  );
}
