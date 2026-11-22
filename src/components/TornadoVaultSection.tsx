"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Code2,
  Copy,
  Film,
  Info,
  Palette,
  Terminal,
  TrendingUp,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";
import { VAULT_ITEMS, VAULT_TRACKS, type VaultCategory } from "@/data/vaultData";

const TRACK_ICONS: Record<VaultCategory, React.ElementType> = {
  coding: Code2,
  video: Film,
  design: Palette,
  marketing: TrendingUp,
};

const SAMPLE_TRACK: VaultCategory = "video";

export function TornadoVaultSection() {
  const isEn = useLanguage() === "en";
  const [copied, setCopied] = useState(false);

  const sampleItem =
    VAULT_ITEMS.find((item) => item.category === SAMPLE_TRACK && item.type === "prompt") ??
    VAULT_ITEMS[0];

  const totalCount = VAULT_ITEMS.length;
  const baseVaultHref = isEn ? "/en/vault" : "/vault";

  const handleCopy = () => {
    navigator.clipboard?.writeText(sampleItem.content).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <section
      id="vault"
      className="ta-section ta-section-dark ta-vault-section"
      dir={isEn ? "ltr" : "rtl"}
      aria-labelledby="vault-title"
    >
      <div className="ta-shell">
        <div className="ta-editorial-topline ta-editorial-topline--dark">
          <span className="ta-editorial-index">
            <span className="ta-editorial-dot" aria-hidden="true" />
            <span>
              {isEn
                ? "02 — TORNADO VAULT SAMPLE · 100% FREE"
                : "02 — عيّنة من خزنة تورنادو · مجانية 100%"}
            </span>
          </span>
          <span className="ta-editorial-meta" dir="ltr">
            PROMPTS &amp; SKILLS · 04 TRACKS
          </span>
        </div>

        <div className="ta-editorial-header ta-editorial-header--dark">
          <h2 id="vault-title" className="ta-editorial-title">
            {isEn ? (
              <>
                Free Prompts &amp; Skills.
                <br />
                <span>Try a quick sample.</span>
              </>
            ) : (
              <>
                برومتات ومهارات جاهزة..
                <br />
                <span>جرّب عيّنة سريعة مجانًا.</span>
              </>
            )}
          </h2>
          <p className="ta-editorial-lead">
            {isEn
              ? "Here is one live sample from the Video Creation track. Pick any other track below to open its full Prompts & skills.sh Agent Skills page for free."
              : "دي عيّنة واحدة بسيطة من مسار المونتاج والفيديو. لو ضغطت على أي مجال تاني تحت هتفتحلك صفحته الكاملة بالبرومتات والمهارات الحقيقية (Skills) مجانًا."}
          </p>
        </div>

        <div className="ta-vault-dock-wrap">
          <nav
            className="ta-vault-dock"
            aria-label={isEn ? "Open vault by track" : "افتح الخزنة حسب المجال"}
          >
            {VAULT_TRACKS.map((tab) => {
              const Icon = TRACK_ICONS[tab.id];
              const isSample = tab.id === SAMPLE_TRACK;
              if (isSample) {
                return (
                  <span
                    key={tab.id}
                    data-active="true"
                    className="ta-vault-dock-btn"
                  >
                    <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                    <span>{isEn ? tab.en : tab.ar}</span>
                  </span>
                );
              }
              return (
                <Link
                  key={tab.id}
                  href={`${baseVaultHref}?track=${tab.id}`}
                  className="ta-vault-dock-btn ta-vault-dock-link"
                >
                  <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
                  <span>{isEn ? tab.en : tab.ar}</span>
                  <ArrowUpRight size={13} strokeWidth={2.2} aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="ta-vault-single-wrap">
          <article className="ta-vault-window">
            <div className="ta-vault-window-bar" dir="ltr">
              <div className="ta-vault-window-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
              <span className="ta-vault-window-file">
                <Terminal size={12} strokeWidth={2.2} aria-hidden="true" />
                <span>{sampleItem.fileName}</span>
              </span>
              <button
                type="button"
                className="ta-vault-copy-pill"
                data-copied={copied}
                onClick={handleCopy}
              >
                {copied ? (
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
                <span className="ta-vault-type-chip">
                  {isEn ? "LIVE SAMPLE · PROMPT" : "عيّنة مجانية · برومت"}
                </span>
                <span className="ta-vault-window-tag">
                  {isEn ? sampleItem.tagEn : sampleItem.tagAr}
                </span>
              </div>
              <h3>{isEn ? sampleItem.titleEn : sampleItem.titleAr}</h3>
              <p>{isEn ? sampleItem.descEn : sampleItem.descAr}</p>
              <div className="ta-vault-howto">
                <span className="ta-vault-howto-label">
                  <Info size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>{isEn ? "How to use:" : "طريقة الاستخدام:"}</span>
                </span>
                <p>{isEn ? sampleItem.howToEn : sampleItem.howToAr}</p>
              </div>
            </div>

            <div className="ta-vault-code-shell">
              <pre className="ta-vault-code" dir="ltr">
                {sampleItem.content}
              </pre>
            </div>

            <div className="ta-vault-window-foot">
              <span className="ta-vault-compat">
                {isEn ? sampleItem.compatEn : sampleItem.compatAr}
              </span>
              <button
                type="button"
                className="ta-vault-foot-copy"
                data-copied={copied}
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                    <span>{isEn ? "Copied to clipboard" : "تم النسخ! جرّبه الآن"}</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} strokeWidth={2.2} aria-hidden="true" />
                    <span>{isEn ? "Copy Prompt" : "انسخ البرومت"}</span>
                  </>
                )}
              </button>
            </div>
          </article>
        </div>

        <div className="ta-vault-footer-bar">
          <div className="ta-vault-footer-copy">
            <strong>
              {isEn
                ? `Explore all ${totalCount} free Prompts & Agent Skills across all 4 tracks.`
                : `افتح خزنة تورنادو الكاملة (${totalCount} برومت ومهارة) في كل المجالات مجانًا.`}
            </strong>
            <p>
              {isEn
                ? "Includes dedicated Prompts & downloadable skills.sh Skills for Coding, Video Creation, Graphic Design, and Media Buying."
                : "تحتوي على أقسام مخصّصة للبرومتات والمهارات الحقيقية (Skills) للبرمجة، المونتاج، الجرافيك، والـ Media Buying بدون تسجيل."}
            </p>
          </div>
          <Link href={baseVaultHref} className="ta-pill-btn">
            <span>
              {isEn ? "Open Full Tornado Vault" : "ادخل خزنة تورنادو الكاملة"}
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
  );
}
