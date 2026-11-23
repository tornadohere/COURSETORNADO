"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  Database,
  Loader2,
} from "lucide-react";

interface AdminLoginFormProps {
  isConfigured: boolean;
}

export function AdminLoginForm({ isConfigured }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setError(
          typeof data?.error === "string"
            ? data.error
            : "تعذر تسجيل الدخول. تأكد من البيانات."
        );
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال بالخادم. حاول مرة أخرى.");
      setSubmitting(false);
    }
  };

  return (
    <main className="admin-shell-bg" dir="rtl">
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <div className="admin-brand-icon">
              <img src="/brand/tornado-icon.webp" alt="Tornado Academy" />
            </div>
            <div>
              <div className="admin-login-kicker">
                <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" />
                <span>TORNADO ACADEMY ADMIN</span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(229, 228, 226, 0.48)",
                  marginTop: 2,
                }}
              >
                لوحة التحكم الخاصة بالإدارة
              </div>
            </div>
          </div>

          <h1 className="admin-login-title">تسجيل دخول الأدمن</h1>
          <p className="admin-login-subtitle">
            أدخل البريد الإلكتروني وكلمة المرور المسجلين بصلاحية{" "}
            <strong style={{ color: "#fafafa" }}>admin</strong> في قاعدة البيانات.
          </p>

          {!isConfigured && (
            <div className="admin-alert admin-alert-warn" role="status">
              <Database
                size={18}
                style={{ flexShrink: 0, marginTop: 2 }}
                aria-hidden="true"
              />
              <div>
                <strong>قاعدة البيانات غير متصلة بعد:</strong> أضف{" "}
                <code>NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
                <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> في ملف{" "}
                <code>.env.local</code> ثم نفّذ <code>supabase/schema.sql</code>.
              </div>
            </div>
          )}

          {error && (
            <div className="admin-alert admin-alert-error" role="alert">
              <AlertCircle
                size={18}
                style={{ flexShrink: 0, marginTop: 2 }}
                aria-hidden="true"
              />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="admin-field">
              <label htmlFor="admin-email">البريد الإلكتروني</label>
              <div className="admin-input-wrap">
                <Mail
                  size={17}
                  className="admin-input-icon"
                  aria-hidden="true"
                />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  dir="ltr"
                  className="admin-input no-end-icon"
                  placeholder="admin@tornadoacademy.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="admin-field" style={{ marginBottom: 22 }}>
              <label htmlFor="admin-password">كلمة المرور</label>
              <div className="admin-input-wrap">
                <Lock
                  size={17}
                  className="admin-input-icon"
                  aria-hidden="true"
                />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  dir="ltr"
                  className="admin-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  disabled={submitting}
                />
                <button
                  type="button"
                  className="admin-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="admin-btn-primary"
              disabled={submitting || !isConfigured}
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="admin-spin" aria-hidden="true" />
                  <span>جاري التحقق من الصلاحية...</span>
                </>
              ) : (
                <>
                  <span>دخول إلى لوحة التحكم</span>
                  <ArrowLeft size={17} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
