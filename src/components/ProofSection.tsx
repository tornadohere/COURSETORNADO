"use client";

import React from "react";
import { Users, Star, Clock, Calendar } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function ProofSection() {
  const isEn = useLanguage() === "en";

  return (
    <section
      className="ta-proof-section"
      dir={isEn ? "ltr" : "rtl"}
      aria-label={
        isEn ? "Tornado Academy key metrics" : "أرقام ومؤشرات الثقة في Tornado Academy"
      }
    >
      <div className="ta-shell">
        <div className="ta-trust-strip">
          <div className="ta-trust-metric">
            <span className="ta-trust-number">
              <Users size={24} strokeWidth={2.2} aria-hidden="true" />
              <span>+350</span>
            </span>
            <span className="ta-trust-label">
              {isEn ? "Registered members" : "عضو مسجّل في المجتمع"}
            </span>
            <span className="ta-trust-sub">
              {isEn
                ? "Developers, editors, designers & media buyers inside the platform."
                : "مبرمجين، مونتيرين، مصممين، وميديا بايرز داخل المنصة."}
            </span>
          </div>

          <div className="ta-trust-metric">
            <span className="ta-trust-number">
              <Star size={24} strokeWidth={2.2} aria-hidden="true" />
              <span>+4.9</span>
            </span>
            <span className="ta-trust-label">
              {isEn ? "Practical content rating" : "تقييم المحتوى التطبيقي"}
            </span>
            <span className="ta-trust-sub">
              {isEn
                ? "Rated for hands-on project execution and clarity."
                : "تطبيق عملي مباشر من أول درس بدون حشو نظري."}
            </span>
          </div>

          <div className="ta-trust-metric">
            <span className="ta-trust-number">
              <Clock size={24} strokeWidth={2.2} aria-hidden="true" />
              <span>+15h</span>
            </span>
            <span className="ta-trust-label">
              {isEn ? "Hours of focused content" : "ساعة محتوى تطبيقي مركّز"}
            </span>
            <span className="ta-trust-sub">
              {isEn
                ? "Continuously expanding every week as new AI models drop."
                : "مكتبة مركّزة بتزيد وتتحدّث أسبوعيًا مع كل موديل جديد."}
            </span>
          </div>

          <div className="ta-trust-metric">
            <span className="ta-trust-number">
              <Calendar size={24} strokeWidth={2.2} aria-hidden="true" />
              <span>1 DEC</span>
            </span>
            <span className="ta-trust-label">
              {isEn ? "Official opening: December 1st" : "الافتتاح الرسمي: 1 ديسمبر"}
            </span>
            <span className="ta-trust-sub">
              {isEn
                ? "One-time 1,500 EGP all-access with 3-day money-back guarantee."
                : "دخول شامل لكل المسارات والمجتمع بـ 1500 ج.م وضمان استرداد 3 أيام."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
