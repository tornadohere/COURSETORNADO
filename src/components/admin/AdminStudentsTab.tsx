"use client";

import React, { useMemo, useState } from "react";
import {
  UserPlus,
  Users,
  Search,
  KeyRound,
  Copy,
  Check,
  ShieldBan,
  ShieldCheck,
  VolumeX,
  Volume2,
  LogOut,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import type { MemberProfile } from "@/lib/supabase/types";

interface AdminStudentsTabProps {
  initialStudents: MemberProfile[];
  serviceRoleConfigured: boolean;
  prefillFromWaitlist?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  onClearPrefill?: () => void;
  onWaitlistEnrolled?: (waitlistId: string) => void;
}

function generateStrongPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#!";
  let out = "";
  for (let i = 0; i < 12; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function AdminStudentsTab({
  initialStudents,
  serviceRoleConfigured,
  prefillFromWaitlist,
  onClearPrefill,
  onWaitlistEnrolled,
}: AdminStudentsTabProps) {
  const [students, setStudents] = useState<MemberProfile[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create form state
  const [fullName, setFullName] = useState(prefillFromWaitlist?.name || "");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [password, setPassword] = useState(() => generateStrongPassword());
  const [creating, setCreating] = useState(false);

  // Newly created credentials box
  const [createdCreds, setCreatedCreds] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copiedCreds, setCopiedCreds] = useState(false);

  // Sync prefill when converting from Waitlist
  React.useEffect(() => {
    if (prefillFromWaitlist) {
      setFullName(prefillFromWaitlist.name);
      setPassword(generateStrongPassword());
    }
  }, [prefillFromWaitlist]);

  const studentOnlyList = useMemo(
    () => students.filter((s) => s.role !== "admin"),
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return studentOnlyList;
    return studentOnlyList.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.specialty || "").toLowerCase().includes(q)
    );
  }, [studentOnlyList, search]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || creating) return;

    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          specialty: specialty.trim(),
          password,
          waitlist_id: prefillFromWaitlist?.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.student) {
        setStudents((prev) => [data.student as MemberProfile, ...prev]);
        setCreatedCreds({
          name: fullName.trim() || email.trim(),
          email: email.trim().toLowerCase(),
          password,
        });
        if (prefillFromWaitlist?.id && onWaitlistEnrolled) {
          onWaitlistEnrolled(prefillFromWaitlist.id);
        }
        onClearPrefill?.();
        setFullName("");
        setEmail("");
        setSpecialty("");
        setPassword(generateStrongPassword());
        setSuccessMsg("تم إنشاء حساب الطالب وتفعيله بنجاح.");
      } else {
        setError(data?.error || "تعذر إنشاء حساب الطالب.");
      }
    } catch {
      setError("تعذر إنشاء حساب الطالب.");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCreds) return;
    const loginUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard`
        : "/dashboard";
    const message = `أهلًا ${createdCreds.name}، مرحباً بك في مجتمع Tornado Academy.\nرابط الدخول: ${loginUrl}\nالبريد الإلكتروني: ${createdCreds.email}\nكلمة المرور: ${createdCreds.password}\n(الحساب مفعّل لجهاز واحد في نفس الوقت، ويمكنك تغيير كلمة المرور من الإعدادات).`;
    try {
      await navigator.clipboard.writeText(message);
      setCopiedCreds(true);
      setTimeout(() => setCopiedCreds(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  const handlePatchStudent = async (
    student: MemberProfile,
    payload: Record<string, unknown>,
    doneMsg?: string
  ) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        if (data.student) {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === student.id ? (data.student as MemberProfile) : s
            )
          );
        }
        if (doneMsg) setSuccessMsg(doneMsg);
      } else {
        setError(data?.error || "تعذر تحديث الحساب.");
      }
    } catch {
      setError("تعذر تحديث الحساب.");
    }
  };

  const handleResetPassword = async (student: MemberProfile) => {
    const nextPw = window.prompt(
      `أدخل كلمة المرور الجديدة للطالب (${student.email}) — 8 أحرف على الأقل:`,
      generateStrongPassword()
    );
    if (!nextPw) return;
    await handlePatchStudent(
      student,
      { new_password: nextPw, force_logout: true },
      `تم تغيير كلمة مرور ${student.email} وإخراج الجلسة القديمة.`
    );
  };

  const handleDeleteStudent = async (student: MemberProfile) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف حساب "${student.full_name || student.email}" نهائياً؟`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/students/${student.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== student.id));
        setSuccessMsg("تم حذف حساب الطالب.");
      } else {
        setError(data?.error || "تعذر حذف الحساب.");
      }
    } catch {
      setError("تعذر حذف الحساب.");
    }
  };

  return (
    <div className="admin-tab-stack">
      {!serviceRoleConfigured && (
        <div className="admin-alert is-warning" role="status">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>مطلوب إعداد Service Role Key:</strong> لإنشاء حسابات الطلاب
            من لوحة الأدمن، أضف <code dir="ltr">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            في <code dir="ltr">.env.local</code> (من Supabase Dashboard →
            Settings → API).
          </div>
        </div>
      )}

      {error && (
        <div className="admin-alert is-error" role="alert">
          <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="admin-alert is-success" role="status">
          <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {createdCreds && (
        <div className="admin-creds-banner">
          <div>
            <strong>تم إنشاء الحساب! انسخ رسالة الترحيب وأرسلها للطالب:</strong>
            <div className="admin-creds-meta" dir="ltr">
              <span>{createdCreds.email}</span>
              <span>|</span>
              <span>{createdCreds.password}</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn-accent"
            onClick={handleCopyCredentials}
          >
            {copiedCreds ? <Check size={15} /> : <Copy size={15} />}
            <span>{copiedCreds ? "تم النسخ" : "نسخ بيانات الدخول"}</span>
          </button>
        </div>
      )}

      {/* Create Student Panel */}
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">
            <UserPlus size={16} />
            <span>
              {prefillFromWaitlist
                ? `تحويل "${prefillFromWaitlist.name}" من الـ Waitlist إلى حساب طالب`
                : "إنشاء حساب طالب جديد (All-Access)"}
            </span>
          </h2>
          {prefillFromWaitlist && onClearPrefill && (
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onClearPrefill}
            >
              إلغاء الربط بالـ Waitlist
            </button>
          )}
        </div>

        <form className="admin-student-form" onSubmit={handleCreateStudent}>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label>الاسم الكامل</label>
            <input
              type="text"
              className="admin-input no-start-icon no-end-icon"
              placeholder="أحمد محمد"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label>البريد الإلكتروني</label>
            <input
              type="email"
              dir="ltr"
              className="admin-input no-start-icon no-end-icon"
              placeholder="student@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label>التخصص (اختياري)</label>
            <input
              type="text"
              className="admin-input no-start-icon no-end-icon"
              placeholder="برمجة / مونتاج / تسويق"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>

          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label>كلمة المرور المؤقتة</label>
            <div className="admin-input-wrap">
              <input
                type="text"
                dir="ltr"
                className="admin-input no-start-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="admin-eye-btn"
                title="توليد كلمة مرور جديدة"
                onClick={() => setPassword(generateStrongPassword())}
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn-accent"
            style={{ height: 46, alignSelf: "end" }}
            disabled={creating}
          >
            {creating ? (
              <Loader2 size={15} className="admin-spin" />
            ) : (
              <UserPlus size={15} />
            )}
            <span>إنشاء الحساب</span>
          </button>
        </form>
      </section>

      {/* Students List */}
      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">
            <Users size={16} />
            <span>الطلاب المسجلون ({studentOnlyList.length})</span>
          </h2>
          <div className="admin-input-wrap" style={{ width: 260 }}>
            <Search size={15} className="admin-input-icon" />
            <input
              type="text"
              className="admin-input no-end-icon"
              style={{ height: 38 }}
              placeholder="بحث بالاسم أو الإيميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="admin-empty">
            <Users size={28} />
            <p>لا يوجد طلاب مطابقون للبحث حالياً.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الحالة</th>
                  <th>الدردشة</th>
                  <th>إجراءات الحماية والتحكم</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#fafafa" }}>
                        {student.full_name || "بدون اسم"}
                      </div>
                      <div
                        dir="ltr"
                        style={{
                          fontSize: 12.5,
                          color: "rgba(229,228,226,0.58)",
                        }}
                      >
                        {student.email}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          student.is_active ? "is-enrolled" : "is-archived"
                        }`}
                      >
                        {student.is_active ? "نشط" : "موقوف"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          student.is_muted ? "is-contacted" : "is-new"
                        }`}
                      >
                        {student.is_muted ? "مكتوم" : "مسموح"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() =>
                            handlePatchStudent(
                              student,
                              { is_active: !student.is_active },
                              student.is_active
                                ? "تم إيقاف الحساب."
                                : "تم تفعيل الحساب."
                            )
                          }
                        >
                          {student.is_active ? (
                            <ShieldBan size={14} />
                          ) : (
                            <ShieldCheck size={14} />
                          )}
                          <span>{student.is_active ? "إيقاف" : "تفعيل"}</span>
                        </button>

                        <button
                          type="button"
                          className="admin-btn-secondary"
                          onClick={() =>
                            handlePatchStudent(
                              student,
                              { is_muted: !student.is_muted },
                              student.is_muted
                                ? "تم فك كتم الطالب في الشات."
                                : "تم كتم الطالب في الشات."
                            )
                          }
                        >
                          {student.is_muted ? (
                            <Volume2 size={14} />
                          ) : (
                            <VolumeX size={14} />
                          )}
                          <span>{student.is_muted ? "فك الكتم" : "كتم"}</span>
                        </button>

                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="تغيير كلمة المرور"
                          onClick={() => handleResetPassword(student)}
                        >
                          <KeyRound size={14} />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="إخراج من الجهاز الحالي"
                          onClick={() =>
                            handlePatchStudent(
                              student,
                              { force_logout: true },
                              "تم إنهاء جلسة الطالب الحالية."
                            )
                          }
                        >
                          <LogOut size={14} />
                        </button>

                        <button
                          type="button"
                          className="admin-icon-btn is-danger"
                          title="حذف الحساب"
                          onClick={() => handleDeleteStudent(student)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
