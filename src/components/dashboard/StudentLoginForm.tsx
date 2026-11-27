"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface StudentLoginFormProps {
  isConfigured: boolean;
  sessionMismatch?: boolean;
  suspended?: boolean;
}

export function StudentLoginForm({
  isConfigured,
  sessionMismatch = false,
  suspended = false,
}: StudentLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isConfigured) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        router.refresh();
      } else {
        setError(data?.error || "تعذر تسجيل الدخول.");
      }
    } catch {
      setError("حدث خطأ في الاتصال. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sd-shell-bg" dir="rtl">
      <div className="sd-login-wrap">
        <div className="sd-login-card">
          <div className="sd-login-brand">
            <div className="sd-brand-icon">
              <img src="/brand/tornado-icon.webp" alt="Tornado Academy" />
            </div>
            <div>
              <div className="sd-login-kicker">
                <ShieldCheck size={13} strokeWidth={2.3} aria-hidden="true" />
                <span>بوابة أعضاء Tornado Academy</span>
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(229,228,226,0.55)" }}>
                الكورسات · المجتمع · الخزنة الحصرية
              </div>
            </div>
          </div>

          <h1 className="sd-login-title">تسجيل دخول الطلاب</h1>
          <p className="sd-login-subtitle">
            أدخل بيانات الحساب المُرسلة لك من إدارة الأكاديمية. الحساب يعمل على
            جهاز واحد في نفس الوقت لحماية المحتوى.
          </p>

          {!isConfigured && (
            <div className="sd-alert is-warning">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>إعدادات Supabase غير مكتملة حالياً.</span>
            </div>
          )}

          {sessionMismatch && (
            <div className="sd-alert is-warning">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                تم تسجيل الدخول بحسابك من جهاز آخر، لذلك تم إنهاء هذه الجلسة.
                سجّل الدخول مجدداً للمتابعة على هذا الجهاز.
              </span>
            </div>
          )}

          {suspended && (
            <div className="sd-alert is-error">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>
                تم إيقاف هذا الحساب مؤقتاً. تواصل مع إدارة Tornado Academy.
              </span>
            </div>
          )}

          {error && (
            <div className="sd-alert is-error" role="alert">
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="sd-field">
              <label htmlFor="sd-email">البريد الإلكتروني</label>
              <div className="sd-input-wrap">
                <Mail size={16} className="sd-input-icon" aria-hidden="true" />
                <input
                  id="sd-email"
                  type="email"
                  dir="ltr"
                  className="sd-input"
                  placeholder="student@domain.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="sd-field">
              <label htmlFor="sd-password">كلمة المرور</label>
              <div className="sd-input-wrap">
                <Lock size={16} className="sd-input-icon" aria-hidden="true" />
                <input
                  id="sd-password"
                  type={showPassword ? "text" : "password"}
                  dir="ltr"
                  className="sd-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="sd-eye-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="sd-btn-primary"
              disabled={loading || !isConfigured}
            >
              {loading ? (
                <Loader2 size={16} className="sd-spin" />
              ) : (
                <LogIn size={16} />
              )}
              <span>{loading ? "جاري الدخول..." : "دخول إلى المنصة"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
