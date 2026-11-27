"use client";

import React, { useState } from "react";
import {
  User,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Save,
  Mail,
} from "lucide-react";
import type { MemberProfile } from "@/lib/supabase/types";

interface StudentSettingsViewProps {
  profile: MemberProfile;
  onProfileUpdated: (next: MemberProfile) => void;
}

export function StudentSettingsView({
  profile,
  onProfileUpdated,
}: StudentSettingsViewProps) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [specialty, setSpecialty] = useState(profile.specialty || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          specialty: specialty.trim(),
          bio: bio.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.profile) {
        onProfileUpdated(data.profile as MemberProfile);
        setSuccessMsg("تم تحديث بيانات الحساب بنجاح.");
      } else {
        setError(data?.error || "تعذر تحديث البيانات.");
      }
    } catch {
      setError("تعذر تحديث البيانات.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingPassword) return;
    setError(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("تأكيد كلمة المرور غير مطابق.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setNewPassword("");
        setConfirmPassword("");
        setSuccessMsg("تم تغيير كلمة المرور بنجاح.");
      } else {
        setError(data?.error || "تعذر تغيير كلمة المرور.");
      }
    } catch {
      setError("تعذر تغيير كلمة المرور.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="sd-section-stack">
      <header className="sd-view-header">
        <div>
          <h1 className="sd-view-title">إعدادات الحساب</h1>
          <p className="sd-view-sub">
            تحكم في بيانات ملفك الشخصي داخل المجتمع وكلمة المرور.
          </p>
        </div>
      </header>

      {error && (
        <div className="sd-alert is-error" role="alert">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="sd-alert is-success" role="status">
          <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="sd-settings-grid">
        <section className="sd-card">
          <h2 className="sd-card-title">
            <User size={16} />
            <span>البيانات الشخصية</span>
          </h2>

          <form onSubmit={handleSaveProfile}>
            <div className="sd-field">
              <label>البريد الإلكتروني (مربوط بالاشتراك ولا يمكن تعديله)</label>
              <div className="sd-input-wrap">
                <Mail size={15} className="sd-input-icon" />
                <input
                  type="email"
                  dir="ltr"
                  className="sd-input"
                  value={profile.email}
                  disabled
                  style={{ opacity: 0.6, cursor: "not-allowed" }}
                />
              </div>
            </div>

            <div className="sd-field">
              <label>الاسم الظاهر في المجتمع</label>
              <input
                type="text"
                className="sd-input no-icons"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="sd-field">
              <label>التخصص / المجال</label>
              <input
                type="text"
                className="sd-input no-icons"
                placeholder="مثال: مطور Full-Stack / مونتير / Media Buyer"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </div>

            <div className="sd-field">
              <label>نبذة مختصرة</label>
              <textarea
                className="sd-textarea"
                rows={3}
                placeholder="اكتب نبذة قصيرة عنك أو عن المشاريع اللي شغال عليها..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="sd-btn-primary"
              disabled={savingProfile}
            >
              {savingProfile ? (
                <Loader2 size={15} className="sd-spin" />
              ) : (
                <Save size={15} />
              )}
              <span>حفظ التعديلات</span>
            </button>
          </form>
        </section>

        <div className="sd-section-stack">
          <section className="sd-card">
            <h2 className="sd-card-title">
              <Lock size={16} />
              <span>تغيير كلمة المرور</span>
            </h2>

            <form onSubmit={handleSavePassword}>
              <div className="sd-field">
                <label>كلمة المرور الجديدة (8 أحرف على الأقل)</label>
                <input
                  type="password"
                  dir="ltr"
                  className="sd-input no-icons"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="sd-field">
                <label>تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  dir="ltr"
                  className="sd-input no-icons"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="sd-btn-secondary"
                style={{ width: "100%", height: 44 }}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <Loader2 size={15} className="sd-spin" />
                ) : (
                  <Lock size={15} />
                )}
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </section>

          <section className="sd-card">
            <h2 className="sd-card-title">
              <ShieldCheck size={16} />
              <span>حماية الحساب والجلسة</span>
            </h2>
            <p className="sd-muted-copy">
              حسابك محمي بنظام الجلسة الواحدة (Single Active Session). عند
              تسجيل الدخول من جهاز جديد، يتم إنهاء الجلسة السابقة تلقائياً لحماية
              محتوى الكورس.
            </p>
            <div className="sd-status-pill">
              <span className="sd-dot-live" />
              <span>اشتراك Tornado Academy النشط · صلاحية كاملة</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
