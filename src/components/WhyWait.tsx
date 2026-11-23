"use client";

import React, { useState } from "react";
import { ArrowUpRight, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useLanguage } from "./LanguageContext";

export function WhyWait() {
  const isEn = useLanguage() === "en";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          website,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(
          typeof data?.error === "string"
            ? data.error
            : isEn
            ? "Please check your details and try again."
            : "تأكد من صحة البيانات وحاول مرة أخرى."
        );
        return;
      }
      setSubmitted(true);
    } catch {
      setErrorMsg(
        isEn
          ? "Network error. Please try again."
          : "حدث خطأ في الاتصال. حاول مرة أخرى."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="why-wait"
      className="ta-waitlist-section"
      aria-labelledby="contact-title"
      dir={isEn ? "ltr" : "rtl"}
    >
      <div id="contact" className="contact-panel ta-waitlist-panel">
        <div className="contact-details">
          <p className="contact-eyebrow">
            {isEn
              ? "OFFICIAL OPENING: DECEMBER 1ST · WAITLIST OPEN"
              : "الافتتاح الرسمي: 1 ديسمبر · حجز المقاعد متاح الآن"}
          </p>
          <h2 id="contact-title">
            {isEn ? (
              <>
                Reserve your spot.
                <br />
                Start on Dec 1.
              </>
            ) : (
              <>
                احجز مقعدك الآن.
                <br />
                الانطلاق 1 ديسمبــــر.
              </>
            )}
          </h2>

          <div className="contact-phone-row" dir="ltr">
            <span className="ta-launch-destination-pill">
              <Calendar size={16} strokeWidth={2.3} aria-hidden="true" />
              <span>
                {isEn
                  ? "DEC 1 LAUNCH · 1,500 EGP ALL-ACCESS"
                  : "افتتاح 1 ديسمبر · 1500 ج.م شاملة كل شيء"}
              </span>
            </span>
          </div>

          <p
            style={{
              fontSize: 14,
              color: "#62584f",
              marginTop: 8,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <ShieldCheck size={17} strokeWidth={2.3} aria-hidden="true" />
            <span>
              {isEn
                ? "3-Day 100% Money-Back Guarantee · Recover your 1,500 EGP from your first client"
                : "ضمان استرداد كامل المبلغ في أول 3 أيام · وتسترد قيمته من أول مشروع"}
            </span>
          </p>
        </div>

        {submitted ? (
          <div className="contact-form">
            <div className="ta-waitlist-success" role="status">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={24} color="#157340" strokeWidth={2.4} />
                <strong>
                  {isEn
                    ? "Your spot on the December 1st Waitlist is reserved!"
                    : "تم تسجيلك في قائمة الانتظار (Waitlist) لافتتاح 1 ديسمبر!"}
                </strong>
              </div>
              <p>
                {isEn
                  ? `Thank you, ${name}. We've registered your phone number (${phone}) and will contact you right before the December 1st launch to activate your full access.`
                  : `أهلًا بيك يا ${name} في Tornado Academy. سجّلنا رقم تليفونك (${phone}) وهنتواصل معاك قبل افتتاح 1 ديسمبر مباشرة لتفعيل دخولك الشامل للمنصة والمجتمع.`}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setName("");
                  setPhone("");
                }}
                style={{ width: "fit-content", marginTop: 8 }}
              >
                <span>{isEn ? "Register another phone number" : "تسجيل رقم آخر"}</span>
              </button>
            </div>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                insetInlineStart: "-9999px",
                width: 1,
                height: 1,
                overflow: "hidden",
              }}
            >
              <label>
                Website
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(ev) => setWebsite(ev.target.value)}
                />
              </label>
            </div>
            <label>
              {isEn ? "Your name" : "اسمك بالكامل"}
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={100}
                value={name}
                onChange={(ev) => setName(ev.target.value)}
                placeholder={isEn ? "Enter your full name" : "اكتب اسمك هنا"}
              />
            </label>
            <label>
              {isEn ? "Phone number" : "رقم التليفون"}
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={30}
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
                placeholder={isEn ? "+20 1X XXX XXXX" : "01XXXXXXXXX"}
                dir="ltr"
              />
            </label>
            {errorMsg && (
              <p
                role="alert"
                style={{
                  color: "#b91c1c",
                  fontSize: 13,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                {errorMsg}
              </p>
            )}
            <button type="submit" disabled={submitting}>
              <span>
                {submitting
                  ? isEn
                    ? "Reserving your spot..."
                    : "جاري تأكيد الحجز..."
                  : isEn
                  ? "Join Waitlist — Launching Dec 1"
                  : "احجز مقعدك في الـ Waitlist — افتتاح 1 ديسمبر"}
              </span>
              <ArrowUpRight size={20} aria-hidden="true" />
            </button>
            <p className="contact-form-note">
              {isEn
                ? "Official opening is December 1st · 1,500 EGP one-time all-access · 3-day money-back guarantee."
                : "الافتتاح الرسمي يوم 1 ديسمبر · الدخول الشامل بـ 1500 ج.م فقط · ضمان استرداد فلوسك في أول 3 أيام."}
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
