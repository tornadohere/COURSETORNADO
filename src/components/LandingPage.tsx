"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Clapperboard,
  PenTool,
  Play,
  ShieldCheck,
  Terminal,
  TrendingUp,
  Volume2,
  X,
} from "lucide-react";
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
                    {/* Main Editorial Typography Column */}
                    <div className="ta-hero-copy">
                      <h1 id="hero-title" className="ta-hero-headline">
                        <span className="forge-title-scroll ta-hero-line-mask">
                          <span className="forge-title-word ta-hero-line-primary">
                            {isEn ? (
                              "The Living AI Academy."
                            ) : (
                              <>
                                منصّة ومجتمع الـ{" "}
                                <bdi dir="ltr" className="ta-hero-latin-display">
                                  AI
                                </bdi>
                              </>
                            )}
                          </span>
                        </span>
                        <span className="forge-title-scroll ta-hero-line-mask">
                          <span className="forge-title-word ta-hero-headline-accent">
                            {isEn ? "Updated every day." : "اللي بيتحدّث كل يوم."}
                          </span>
                        </span>
                      </h1>

                      <p className="ta-hero-lead forge-title-word">
                        {isEn ? (
                          <>
                            Master practical AI across Coding (
                            <bdi dir="ltr" className="ta-hero-bdi">
                              Claude Code &amp; Codex
                            </bdi>
                            ), Video Editing, Graphic Design, and{" "}
                            <bdi dir="ltr" className="ta-hero-bdi">
                              Media Buying
                            </bdi>{" "}
                            — with both paid pro tools and 100% free alternatives.
                          </>
                        ) : (
                          <>
                            تعلّم البرمجة بـ{" "}
                            <bdi dir="ltr" className="ta-hero-bdi">
                              Claude Code &amp; Codex
                            </bdi>
                            ، المونتاج، الجرافيك ديزاين، والـ{" "}
                            <bdi dir="ltr" className="ta-hero-bdi">
                              Media Buying
                            </bdi>{" "}
                            — بشرح عملي للأدوات المدفوعة والبدائل المجانية.
                          </>
                        )}
                      </p>

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
                          <span aria-hidden="true" className="ta-hero-secondary-play">
                            <Play size={13} strokeWidth={2.4} fill="currentColor" />
                          </span>
                          <span>
                            {isEn ? "Watch Intro with Sound" : "شاهد الفيديو بالصوت"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Visual Column: Sculpted Fanned Cinema Monolith */}
                    <div className="forge-art ta-hero-art-wrap">
                      <div className="forge-art-scroll">
                        <div className="forge-art-inner">
                          <div className="ta-cinema-stage">
                            {/* Fanned Smoked-Glass Studio Depth Plates (echoes HeroFolders craft) */}
                            <div
                              aria-hidden="true"
                              className="ta-cinema-plate ta-cinema-plate--start"
                            >
                              <div className="ta-cinema-plate-icon">
                                <Image
                                  src="/brand/tiles/code.webp"
                                  alt=""
                                  width={48}
                                  height={48}
                                  sizes="48px"
                                  unoptimized
                                />
                              </div>
                              <div className="ta-cinema-plate-meta">
                                <bdi dir="ltr">Claude Code</bdi>
                                <span>{isEn ? "AI Engineering" : "برمجة بالـ AI"}</span>
                              </div>
                            </div>

                            <div
                              aria-hidden="true"
                              className="ta-cinema-plate ta-cinema-plate--end"
                            >
                              <div className="ta-cinema-plate-pair">
                                <Image
                                  src="/brand/tiles/video.webp"
                                  alt=""
                                  width={42}
                                  height={42}
                                  sizes="42px"
                                  unoptimized
                                />
                                <Image
                                  src="/brand/tiles/design.webp"
                                  alt=""
                                  width={42}
                                  height={42}
                                  sizes="42px"
                                  unoptimized
                                />
                              </div>
                              <div className="ta-cinema-plate-meta">
                                <span>{isEn ? "Video · Design" : "مونتاج · جرافيك"}</span>
                                <bdi dir="ltr">Media Buying</bdi>
                              </div>
                            </div>

                            {/* Centerpiece Machined Cinema Monolith */}
                            <button
                              id="video"
                              type="button"
                              className="ta-cinema-monolith"
                              onClick={() => setVideoOpen(true)}
                              aria-label={
                                isEn
                                  ? "Play academy intro video with sound"
                                  : "تشغيل الفيديو التعريفي بالصوت"
                              }
                            >
                              <span className="ta-cinema-screen">
                                <AmbientVideo
                                  className="ta-hero-video"
                                  src="/media/academy-intro-preview.mp4"
                                  poster="/media/academy-intro-poster.webp"
                                />
                                <span aria-hidden="true" className="ta-cinema-grade" />
                                <span aria-hidden="true" className="ta-cinema-sheen" />

                                <span aria-hidden="true" className="ta-cinema-topbar">
                                  <span className="ta-cinema-brand-chip">
                                    <Image
                                      src="/brand/tornado-icon.webp"
                                      alt=""
                                      width={18}
                                      height={18}
                                      sizes="18px"
                                      unoptimized
                                    />
                                    <span>
                                      {isEn ? "Academy Reel" : "جولة الأكاديمية"}
                                    </span>
                                  </span>
                                  <span className="ta-cinema-sound-pill">
                                    <Volume2 size={13} strokeWidth={2.2} />
                                  </span>
                                </span>

                                <span className="ta-hero-cinema-play" aria-hidden="true">
                                  <Play size={22} strokeWidth={2.2} fill="currentColor" />
                                </span>

                                <span aria-hidden="true" className="ta-cinema-caption">
                                  <strong>
                                    {isEn
                                      ? "Inside Tornado Academy"
                                      : "من داخل المنصّة والمجتمع"}
                                  </strong>
                                  <span>
                                    {isEn
                                      ? "Tap to watch with full audio"
                                      : "اضغط للمشاهدة بالصوت الكامل"}
                                  </span>
                                </span>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grounded Architectural Specification Rail */}
                  <div
                    className="ta-hero-rail"
                    aria-label={
                      isEn ? "Launch details and core tracks" : "تفاصيل الافتتاح والمسارات"
                    }
                  >
                    <div className="ta-hero-rail-launch">
                      <span className="hero-launch-dot" aria-hidden="true" />
                      <span className="ta-hero-rail-strong">
                        {isEn ? "Opens Dec 1" : "الافتتاح 1 ديسمبر"}
                      </span>
                      <span className="ta-hero-rail-sep" aria-hidden="true" />
                      <span className="ta-hero-rail-price">
                        {isEn ? "1,500 EGP All-Access" : "الدخول الشامل 1,500 ج.م"}
                      </span>
                    </div>

                    <div className="ta-hero-rail-tracks">
                      <span>
                        <Terminal size={13} strokeWidth={2.1} aria-hidden="true" />
                        <bdi dir="ltr">Claude Code &amp; Codex</bdi>
                      </span>
                      <span>
                        <Clapperboard size={13} strokeWidth={2.1} aria-hidden="true" />
                        {isEn ? "AI Video" : "المونتاج"}
                      </span>
                      <span>
                        <PenTool size={13} strokeWidth={2.1} aria-hidden="true" />
                        {isEn ? "Graphic Design" : "الجرافيك"}
                      </span>
                      <span>
                        <TrendingUp size={13} strokeWidth={2.1} aria-hidden="true" />
                        <bdi dir="ltr">Media Buying</bdi>
                      </span>
                    </div>

                    <div className="ta-hero-rail-guarantee">
                      <ShieldCheck size={14} strokeWidth={2.1} aria-hidden="true" />
                      <span>
                        {isEn ? "3-Day Money-Back" : "ضمان استرداد 3 أيام"}
                      </span>
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
