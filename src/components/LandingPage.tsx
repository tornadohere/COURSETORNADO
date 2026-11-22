"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Play, Volume2, X } from "lucide-react";
import { LanguageProvider, Locale } from "./LanguageContext";
import { AmbientVideo } from "./AmbientVideo";
import { ControlledScroll } from "./ControlledScroll";
import { SiteHeader } from "./SiteHeader";
import { CheckpointMotion } from "./CheckpointMotion";
import { HeroFolders } from "./HeroFolders";
import { ProofSection } from "./ProofSection";
import { BrandStory } from "./BrandStory";
import { ToolsReassuranceSection } from "./ToolsReassuranceSection";
import { TornadoVaultSection } from "./TornadoVaultSection";
import { PricingAndFaqSection } from "./PricingAndFaqSection";
import { WhyWait } from "./WhyWait";

export function LandingPage({ lang }: { lang: Locale }) {
  const isEn = lang === "en";
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (!videoOpen) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setVideoOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [videoOpen]);

  return (
    <LanguageProvider lang={lang}>
      <ControlledScroll />
      <div>
        <a className="skip-link" href="#main">
          {isEn ? "Skip to content" : "انتقل إلى المحتوى"}
        </a>
        <SiteHeader editorial />
        <main id="main">
          <CheckpointMotion>
            <div className="opening-flow">
              <section
                aria-labelledby="hero-title"
                className="forge-hero"
                dir={isEn ? "ltr" : "rtl"}
              >
                <div className="forge-stage ta-custom-hero-stage">
                  {/* Warm Obsidian-Espresso & Sage Studio Atmosphere */}
                  <div aria-hidden="true" className="ta-hero-atmosphere" />
                  <div aria-hidden="true" className="hero-pebble-texture" />
                  <div aria-hidden="true" className="hero-studio-light" />

                  <div className="ta-hero-grid">
                    {/* Main Editorial Column */}
                    <div className="ta-hero-copy">
                      <div className="ta-hero-status-pill forge-title-word">
                        <span className="hero-launch-dot" aria-hidden="true" />
                        <span>
                          {isEn
                            ? "Opens December 1st · 1,500 EGP All-Access"
                            : "الافتتاح 1 ديسمبر · الدخول الشامل 1500 ج.م"}
                        </span>
                      </div>

                      <h1 id="hero-title" className="ta-hero-headline">
                        <span className="forge-title-scroll">
                          <span className="forge-title-word">
                            {isEn ? "The Living AI Academy." : "منصّة ومجتمع الـ AI"}
                          </span>
                        </span>
                        <span className="forge-title-scroll">
                          <span className="forge-title-word ta-hero-headline-accent">
                            {isEn
                              ? "Updated every day."
                              : "اللي بيتحدّث كل يوم."}
                          </span>
                        </span>
                      </h1>

                      <p className="ta-hero-lead forge-title-word">
                        {isEn
                          ? "Master practical AI across Coding (Claude Code & Codex), Video Editing, Graphic Design, and Media Buying — with both paid pro tools and 100% free alternatives."
                          : "تعلّم البرمجة بـ Claude Code & Codex، المونتاج، الجرافيك ديزاين، والـ Media Buying — بشرح عملي للأدوات المدفوعة والبدائل المجانية."}
                      </p>

                      <div className="ta-hero-tracks-line forge-title-word" aria-label={isEn ? "Core tracks" : "المسارات الأساسية"}>
                        <span>{isEn ? "Claude Code & Codex" : "البرمجة بـ AI"}</span>
                        <i aria-hidden="true" />
                        <span>{isEn ? "AI Video" : "المونتاج"}</span>
                        <i aria-hidden="true" />
                        <span>{isEn ? "Graphic Design" : "الجرافيك"}</span>
                        <i aria-hidden="true" />
                        <span>{isEn ? "Media Buying" : "Media Buying"}</span>
                      </div>

                      <div className="ta-hero-actions hero-bottom-cta">
                        <a
                          aria-label={
                            isEn
                              ? "Join Waitlist — Launching Dec 1"
                              : "احجز مقعدك في الـ Waitlist — افتتاح 1 ديسمبر"
                          }
                          className="ta-hero-primary-btn"
                          href="#why-wait"
                        >
                          <span>
                            {isEn
                              ? "Join Waitlist · Dec 1"
                              : "احجز مقعدك · افتتاح 1 ديسمبر"}
                          </span>
                          <span aria-hidden="true" className="ta-hero-btn-arrow">
                            {isEn ? (
                              <ArrowRight size={17} strokeWidth={2.2} />
                            ) : (
                              <ArrowLeft size={17} strokeWidth={2.2} />
                            )}
                          </span>
                        </a>

                        <button
                          type="button"
                          className="ta-hero-secondary-btn"
                          onClick={() => setVideoOpen(true)}
                        >
                          <Play size={15} strokeWidth={2.4} aria-hidden="true" />
                          <span>
                            {isEn ? "Watch Intro with Sound" : "شاهد الفيديو بالصوت"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Column: Smoked-Glass Cinema Frame with Click-to-Play Theater */}
                    <div className="forge-art ta-hero-art-wrap">
                      <div className="forge-art-scroll">
                        <div className="forge-art-inner">
                          <div className="ta-hero-cinema-wrap">
                            <div aria-hidden="true" className="ta-hero-cinema-glow" />
                            <button
                              id="video"
                              type="button"
                              className="ta-hero-video-card ta-hero-cinema-btn"
                              onClick={() => setVideoOpen(true)}
                              aria-label={
                                isEn
                                  ? "Play academy intro video with sound"
                                  : "تشغيل الفيديو التعريفي بالصوت"
                              }
                            >
                              <div className="ta-hero-video-frame">
                                <AmbientVideo
                                  className="ta-hero-video"
                                  src="/media/academy-intro.mp4"
                                  poster="/media/academy-intro-poster.webp"
                                />
                                <span className="ta-hero-cinema-play" aria-hidden="true">
                                  <Play size={22} strokeWidth={2.2} fill="currentColor" />
                                </span>
                                <span className="ta-hero-cinema-sound" aria-hidden="true">
                                  <Volume2 size={14} strokeWidth={2.2} />
                                </span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <HeroFolders />
            </div>
          </CheckpointMotion>

          <ProofSection />

          <div className="continuation wb-studio">
            <BrandStory />
            <ToolsReassuranceSection />
            <TornadoVaultSection />
            <PricingAndFaqSection />
            <WhyWait />
          </div>
        </main>
      </div>

      <footer className="site-copyright">
        <p className="site-copyright-owner">
          <bdi>© 2026 Tornado Academy</bdi>{" "}
          <span>{isEn ? "All rights reserved." : "جميع الحقوق محفوظة."}</span>
        </p>
        <p>
          {isEn
            ? "Official Launch: December 1st · All-Access AI Platform & In-Platform Community · 3-Day Money-Back Guarantee."
            : "الافتتاح الرسمي: 1 ديسمبر · منصة متكاملة ومجتمع داخلي لتعليم الذكاء الاصطناعي · ضمان استرداد كامل خلال أول 3 أيام."}
        </p>
        <p className="site-copyright-trademarks">
          {isEn
            ? "Third-party trademarks belong to their respective owners."
            : "العلامات التجارية للجهات الأخرى مملوكة لأصحابها."}
        </p>
      </footer>

      {videoOpen && (
        <div
          className="ta-video-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={isEn ? "Tornado Academy intro video" : "الفيديو التعريفي للأكاديمية"}
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="ta-video-modal-shell"
            onClick={(ev) => ev.stopPropagation()}
          >
            <button
              type="button"
              className="ta-video-modal-close"
              onClick={() => setVideoOpen(false)}
              aria-label={isEn ? "Close video" : "إغلاق الفيديو"}
            >
              <X size={20} strokeWidth={2.3} />
            </button>
            <video
              className="ta-video-modal-player"
              src="/media/academy-intro.mp4"
              poster="/media/academy-intro-poster.webp"
              controls
              autoPlay
              playsInline
            />
          </div>
        </div>
      )}
    </LanguageProvider>
  );
}
