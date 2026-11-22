"use client";

import React, { useState } from "react";
import { Check, ChevronDown, ShieldCheck, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { AmbientVideo } from "./AmbientVideo";

const FEATURES_AR = [
  "دخول شامل لكل المسارات (البرمجة، المونتاج، الجرافيك، والـ Media Buying).",
  "تحديثات مستمرة مع كل موديل AI جديد + مجتمع Tornado الداخلي.",
  "شرح الأدوات المدفوعة + البدائل المجانية بالكامل في كل درس.",
  "حزمة تورنادو المميزة + خزنة البرومتات والمهارات (Skills).",
];

const FEATURES_EN = [
  "Full access to all 4 tracks (Coding, Video, Graphic Design & Media Buying).",
  "Continuous updates with every new AI model + in-platform community.",
  "Step-by-step paid pro tools AND 100% free alternatives in every lesson.",
  "Tornado Signature Bundle + full Prompts & Skills vault.",
];

const FAQS_AR = [
  {
    q: "هل الـ 1500 ج.م بتتدفع مرة واحدة فعلًا ولا اشتراك شهري بيتقفل؟",
    a: "بتشتري الدخول بـ 1500 ج.م مرة واحدة وخلاص، بتاخد كل حاجة: كل المسارات والكورسات الحالية، والتحديثات المستمرة للمكتبة، والمجتمع الداخلي بدون عدّاد شهري يقفل حسابك.",
  },
  {
    q: "ماذا لو اشتركت وحسيت إن المحتوى مش مناسب ليا؟ (ضمان الـ 3 أيام)",
    a: "فلوسك قابلة للاسترداد بالكامل خلال أول 3 أيام من تفعيل اشتراكك. تدخل، تشوف الكورسات والمجتمع بنفسك، ولو حسيت لأي سبب إنها مش مناسبة ليك بتسترد المبلغ كاملًا بدون أي تعقيد.",
  },
  {
    q: "هل لازم أكون مشترك في أدوات AI مدفوعة وغالية عشان أطبّق؟",
    a: "إطلاقًا. عاملين حساب إنك مش لازم تدفع اشتراكات أدوات غالية؛ في كل مسار بنشرح الأداة المدفوعة وبنشرح قصادها البديل المجاني بالتفصيل عشان تشتغل وتطبّق بصفر تكلفة إضافية.",
  },
  {
    q: "إزاي أقدر أسترد قيمة الـ 1500 ج.م؟",
    a: "المسارات مصممة عشان تطلّع بيها شغل حقيقي للعملاء؛ أي مشروع واحد تنفذه بالمهارات دي (موقع واحد بـ Claude Code، أو باكج مونتاج ريلز، أو تصميم هوية وإعلانات، أو حملة Media Buying) بيغطي قيمة اشتراكك أضعاف من أول عميل.",
  },
  {
    q: "متى الافتتاح الرسمي؟ وإيه اللي بيحصل لما أسجّل في الـ Waitlist؟",
    a: "الافتتاح الرسمي يوم 1 ديسمبر. لما تسجّل اسمك ورقم تليفونك في الـ Waitlist تحت، بنحجز مقعدك في دفعة الافتتاح وبنبعتلك رسالة تأكيد الدخول قبل الانطلاق مباشرة.",
  },
];

const FAQS_EN = [
  {
    q: "Is the 1,500 EGP really a one-time payment or a recurring monthly subscription?",
    a: "You pay 1,500 EGP once and get full access to everything: all tracks, daily library updates, the in-platform community, and the Tornado Vault—with no monthly lock-outs.",
  },
  {
    q: "How does the 3-day money-back guarantee work?",
    a: "Your payment is 100% refundable during the first 3 days. Explore the tracks, community, and workflows inside the platform—if you're not completely satisfied within 3 days, you get a full refund.",
  },
  {
    q: "Do I need expensive paid AI tool subscriptions to follow along?",
    a: "No. Every track covers both the paid pro stack and the 100% free alternatives step by step, so you can learn, build, and deliver client work with zero extra tool costs.",
  },
  {
    q: "How quickly can I recover the 1,500 EGP investment?",
    a: "A single client project—whether one web app built with Claude Code, one AI video package, one brand visual kit, or one media buying campaign—recovers the 1,500 EGP multiple times over from your very first client.",
  },
  {
    q: "When is the official launch and how does the Waitlist work?",
    a: "Tornado Academy officially opens on December 1st. Registering your name and phone number on the Waitlist reserves your spot for the December 1st opening.",
  },
];

export function PricingAndFaqSection() {
  const isEn = useLanguage() === "en";
  const features = isEn ? FEATURES_EN : FEATURES_AR;
  const faqs = isEn ? FAQS_EN : FAQS_AR;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section
      id="pricing"
      className="ta-section"
      dir={isEn ? "ltr" : "rtl"}
      aria-labelledby="pricing-title"
    >
      <div className="ta-shell">
        <div className="ta-header">
          <span className="ta-eyebrow">
            <Sparkles size={15} strokeWidth={2.3} aria-hidden="true" />
            {isEn
              ? "ONE MEMBERSHIP · EVERYTHING INCLUDED"
              : "دخول واحد شامل · بدون اشتراكات شهرية معقدة"}
          </span>
          <h2 id="pricing-title" className="ta-title">
            {isEn
              ? "Pay once. Get every AI track, daily update, and the community."
              : "بتشتري الدخول مرة واحدة.. وبتاخد كل حاجة."}
          </h2>
          <p className="ta-subtitle">
            {isEn
              ? "No monthly countdowns that lock your account. Join once for 1,500 EGP, backed by a full 3-day money-back guarantee."
              : "بدل الاشتراكات الشهرية اللي بتقفل حسابك أول ما الشهر يخلص، في Tornado Academy بتدفع 1500 ج.م بس وبتفتح كل المسارات، التحديثات اليومية، والمجتمع الداخلي."}
          </p>
        </div>

        <div className="ta-pricing-layout">
          {/* Pricing Card */}
          <div className="ta-pricing-card ta-motion-surface">
            <AmbientVideo
              className="ta-ambient-bg-video"
              src="/brand/intro-v2/blue-caustics.mp4"
              poster="/brand/intro-v2/blue-caustics.webp"
            />
            <div className="ta-pricing-top" style={{ position: "relative", zIndex: 1 }}>
              <span className="ta-pricing-pill">
                {isEn ? "ALL-ACCESS MEMBERSHIP" : "العضوية الشاملة — All-Access"}
              </span>
              <span className="ta-launch-pill">
                <Calendar size={14} strokeWidth={2.4} aria-hidden="true" />
                <span>
                  {isEn ? "Official Opening: Dec 1" : "الافتتاح الرسمي: 1 ديسمبر"}
                </span>
              </span>
            </div>

            <div className="ta-price-row">
              <span className="ta-price-amount">1500</span>
              <span className="ta-price-currency">{isEn ? "EGP" : "ج.م"}</span>
              <p className="ta-price-note">
                {isEn
                  ? "One-time entry payment · Unlocks all tracks, updates & in-platform community"
                  : "تُدفع مرة واحدة للدخول الشامل · تفتح لك كل الكورسات، التحديثات اليومية، والمجتمع"}
              </p>
            </div>

            {/* Compact Guarantee + ROI Strip */}
            <div className="ta-guarantee-box">
              <span className="ta-guarantee-icon" aria-hidden="true">
                <ShieldCheck size={19} strokeWidth={2.3} />
              </span>
              <div className="ta-guarantee-copy">
                <strong>
                  {isEn
                    ? "3-Day 100% Money-Back Guarantee · Recover 1,500 EGP from your 1st client"
                    : "ضمان استرداد كامل في أول 3 أيام · وتسترد قيمته من أول عميل"}
                </strong>
                <p>
                  {isEn
                    ? "Try everything risk-free—one client project covers your membership."
                    : "جرّب المنصة بدون مخاطرة؛ مشروع واحد يغطي اشتراكك بالكامل."}
                </p>
              </div>
            </div>

            <ul className="ta-features-list">
              {features.map((feat) => (
                <li key={feat} className="ta-feature-item">
                  <span className="ta-feature-check" aria-hidden="true">
                    <Check size={13} strokeWidth={2.8} />
                  </span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <a
              href="#why-wait"
              className="ta-pricing-cta"
              style={{ textDecoration: "none" }}
            >
              <span>
                {isEn
                  ? "Join the Waitlist for Dec 1 Launch"
                  : "سجّل في الـ Waitlist الآن — الافتتاح 1 ديسمبر"}
              </span>
              <ArrowUpRight size={19} strokeWidth={2.4} aria-hidden="true" />
            </a>
          </div>

          {/* FAQ Column */}
          <div className="ta-faq-column">
            <h3 className="ta-faq-heading">
              {isEn
                ? "Frequently Asked Questions"
                : "أسئلة شائعة تهمّك قبل التسجيل"}
            </h3>
            {faqs.map((item, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={item.q}
                  className="ta-faq-item"
                  data-open={isOpen ? "true" : "false"}
                >
                  <button
                    type="button"
                    className="ta-faq-question"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIdx((cur) => (cur === idx ? null : idx))}
                  >
                    <span>{item.q}</span>
                    <span className="ta-faq-icon" aria-hidden="true">
                      <ChevronDown size={17} strokeWidth={2.4} />
                    </span>
                  </button>
                  {isOpen && <div className="ta-faq-answer">{item.a}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
