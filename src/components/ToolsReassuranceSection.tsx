"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, TrendingUp } from "lucide-react";
import { useLanguage } from "./LanguageContext";

interface TrackToolItem {
  num: string;
  tileSrc?: string;
  title: string;
  meta: string;
  paidName: string;
  paidDesc: string;
  freeName: string;
  freeDesc: string;
}

const TRACK_TOOLS_AR: TrackToolItem[] = [
  {
    num: "01",
    tileSrc: "/brand/tiles/code.webp",
    title: "البرمجة وبناء المواقع بالـ AI",
    meta: "بدائل مجانية 100%",
    paidName: "Claude Code · Cursor Pro · Codex Paid",
    paidDesc: "نشرح إعدادات المحترفين وأتمتة المشاريع الكبيرة بالكامل.",
    freeName: "Codex Free Tier · Gemini CLI · Windsurf Free",
    freeDesc: "نشرح إزاي تبرمج وتطلع مواقع كاملة بدون ما تدفع دولار واحد في أدوات البرمجة.",
  },
  {
    num: "02",
    tileSrc: "/brand/tiles/video.webp",
    title: "المونتاج وصناعة الفيديو بالـ AI",
    meta: "تشتغل من جهازك مجانًا",
    paidName: "Runway Gen-3 · Kling Pro · ElevenLabs",
    paidDesc: "توليد المشاهد السينمائية، التحريك، والدوبلاج الاحترافي.",
    freeName: "CapCut AI Free · Local Open-Source Video & Audio",
    freeDesc: "بدائل مجانية ومفتوحة المصدر لتسريع المونتاج وتوليد المشاهد والصوتيات مجانًا.",
  },
  {
    num: "03",
    tileSrc: "/brand/tiles/design.webp",
    title: "الجرافيك ديزاين والهويات البصرية",
    meta: "صفر اشتراكات إجبارية",
    paidName: "Midjourney · Adobe Firefly Pro",
    paidDesc: "تصميم الإعلانات، ثبات الشخصيات، ودمج المنتجات بأعلى دقة.",
    freeName: "Flux Free · Ideogram & Leonardo Free Tiers",
    freeDesc: "نفس جودة الصور والإعلانات وتصميمات السوشيال ميديا باستخدام الموديلات المجانية.",
  },
  {
    num: "04",
    title: "الـ Media Buying والتسويق بالـ AI",
    meta: "أدوات مجانية بالكامل",
    paidName: "AdCreative AI · Foreplay · Paid Spy Tools",
    paidDesc: "تحليل إعلانات المنافسين وأتمتة كتابة واختبار الحملات الإعلانية.",
    freeName: "Meta Ad Library + Custom Free AI Frameworks",
    freeDesc: "منظومة مجانية بالكامل لتحليل السوق وكتابة Hooks وزوايا إعلانية بيّاعة.",
  },
];

const TRACK_TOOLS_EN: TrackToolItem[] = [
  {
    num: "01",
    tileSrc: "/brand/tiles/code.webp",
    title: "AI Coding & Full-Stack Engineering",
    meta: "100% Free Stack Covered",
    paidName: "Claude Code · Cursor Pro · Codex Paid",
    paidDesc: "Full production workflows for rapid software architecture and deployment.",
    freeName: "Codex Free Tier · Gemini CLI · Windsurf Free",
    freeDesc: "Build and ship complete web apps using free tiers and open-source coding agents.",
  },
  {
    num: "02",
    tileSrc: "/brand/tiles/video.webp",
    title: "AI Video Editing & Motion Production",
    meta: "Zero-Budget Workflows",
    paidName: "Runway Gen-3 · Kling Pro · ElevenLabs",
    paidDesc: "Cinematic B-roll generation, motion choreography and studio voice synthesis.",
    freeName: "CapCut AI Free · Local Open-Source Video & Audio",
    freeDesc: "Free and local alternatives for fast editing, captions, sound and visual effects.",
  },
  {
    num: "03",
    tileSrc: "/brand/tiles/design.webp",
    title: "AI Graphic Design & Brand Visuals",
    meta: "No Mandatory Subscriptions",
    paidName: "Midjourney · Adobe Firefly Pro",
    paidDesc: "Consistent brand characters, product staging and commercial key visuals.",
    freeName: "Flux Free · Ideogram & Leonardo Free Tiers",
    freeDesc: "Produce studio-quality social ads, thumbnails and brand assets at zero cost.",
  },
  {
    num: "04",
    title: "AI Media Buying & Performance Marketing",
    meta: "Free Ad Intelligence Stack",
    paidName: "AdCreative AI · Foreplay · Paid Spy Tools",
    paidDesc: "Automated competitor tracking, creative testing and funnel optimization.",
    freeName: "Meta Ad Library + Custom Free AI Frameworks",
    freeDesc: "Our complete zero-cost prompt system for winning hooks, ad scripts and ROAS analysis.",
  },
];

export function ToolsReassuranceSection() {
  const isEn = useLanguage() === "en";
  const items = isEn ? TRACK_TOOLS_EN : TRACK_TOOLS_AR;

  return (
    <section
      id="free-vs-paid"
      className="ta-section ta-tools-section"
      dir={isEn ? "ltr" : "rtl"}
      aria-labelledby="reassurance-title"
    >
      <div className="ta-shell">
        <div className="ta-editorial-topline">
          <span className="ta-editorial-index">
            <span className="ta-editorial-dot" aria-hidden="true" />
            <span>
              {isEn
                ? "01 — ZERO EXTRA BUDGET REQUIRED"
                : "01 — مش لازم تدفع اشتراكات أدوات عشان تبدأ"}
            </span>
          </span>
          <span className="ta-editorial-meta" dir="ltr">
            {isEn ? "PAID PRO ↔ FREE STACK" : "PAID PRO ↔ ZERO-COST"}
          </span>
        </div>

        <div className="ta-editorial-header">
          <h2 id="reassurance-title" className="ta-editorial-title">
            {isEn ? (
              <>
                Paid pro workflows.
                <br />
                <span>100% free alternatives.</span>
              </>
            ) : (
              <>
                شارحين الأدوات اللي بفلوس..
                <br />
                <span>والبدائل المجانية بالكامل.</span>
              </>
            )}
          </h2>
          <p className="ta-editorial-lead">
            {isEn
              ? "Most AI courses surprise you with $100+/month in mandatory tool subscriptions. At Tornado Academy, every single lesson teaches the paid pro workflow alongside the free alternative so you can start earning first."
              : "أكبر مشكلة في كورسات الـ AI إنك بعد ما تشترك بتتفاجئ إنك محتاج تدفع آلاف كل شهر في اشتراكات أدوات. في Tornado Academy بنشرح لك في كل مسار الأداة المدفوعة والبديل المجاني ليها خطوة بخطوة عشان تطبّق وتشتغل من أول يوم بدون أي تكلفة إضافية."}
          </p>
        </div>

        <div className="ta-tools-stage">
          <div className="ta-tools-ledger-head" aria-hidden="true">
            <span>{isEn ? "TRACK" : "المسار العملي"}</span>
            <span>{isEn ? "PAID PRO STACK (COVERED)" : "الأدوات المدفوعة (مشروحة)"}</span>
            <span>{isEn ? "FREE ALTERNATIVE (COVERED)" : "البديل المجاني (مشروح)"}</span>
          </div>

          <div className="ta-tools-ledger">
            {items.map((item) => (
              <article key={item.num} className="ta-tools-row">
                <div className="ta-tools-track-col">
                  <div className="ta-tools-medallion" aria-hidden="true">
                    {item.tileSrc ? (
                      <Image
                        src={item.tileSrc}
                        width={96}
                        height={96}
                        alt=""
                        sizes="52px"
                      />
                    ) : (
                      <span className="ta-tools-medallion-icon">
                        <TrendingUp size={22} strokeWidth={2} />
                      </span>
                    )}
                  </div>
                  <div className="ta-tools-track-copy">
                    <div className="ta-tools-track-meta-row">
                      <span className="ta-tools-num" dir="ltr">
                        {item.num}
                      </span>
                      <span className="ta-tools-status">{item.meta}</span>
                    </div>
                    <h3>{item.title}</h3>
                  </div>
                </div>

                <div className="ta-tools-stack-col ta-tools-stack-col--paid">
                  <span className="ta-tools-col-label">
                    <span className="ta-tools-label-dot" aria-hidden="true" />
                    {isEn ? "Paid Pro Stack" : "الأدوات المدفوعة"}
                  </span>
                  <strong dir="ltr">{item.paidName}</strong>
                  <p>{item.paidDesc}</p>
                </div>

                <div className="ta-tools-stack-col ta-tools-stack-col--free">
                  <span className="ta-tools-col-label ta-tools-col-label--free">
                    <span className="ta-tools-check-dot" aria-hidden="true">
                      <Check size={11} strokeWidth={3} />
                    </span>
                    {isEn ? "Free Alternative" : "البديل المجاني"}
                  </span>
                  <strong dir="ltr">{item.freeName}</strong>
                  <p>{item.freeDesc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="ta-tools-footer-bar">
          <div className="ta-tools-footer-copy">
            <strong>
              {isEn
                ? "Start with $0 in tool subscriptions, upgrade only after your first client pays you."
                : "ابدأ بصفر تكلفة أدوات، ورقّي اشتراكاتك بس لما تستلم فلوس أول عميل."}
            </strong>
            <p>
              {isEn
                ? "We keep our free-alternatives stack updated every week whenever a new free tier or open-source model drops."
                : "بنحدّث قائمة البدائل المجانية أسبوعيًا أول ما أي موديل جديد ينزل منه نسخة مجانية أو مفتوحة المصدر."}
            </p>
          </div>
          <a href="#vault" className="ta-pill-btn">
            <span>
              {isEn ? "Try Free Tornado Vault" : "جرّب خزنة تورنادو المجانية"}
            </span>
            <span className="ta-pill-btn-circle" aria-hidden="true">
              {isEn ? (
                <ArrowRight size={16} strokeWidth={2.2} />
              ) : (
                <ArrowLeft size={16} strokeWidth={2.2} />
              )}
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
