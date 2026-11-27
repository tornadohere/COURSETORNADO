"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  Trash2,
  X,
  Star,
  Terminal,
  FileCode2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type {
  ExclusiveVaultCategory,
  ExclusiveVaultItem,
  ExclusiveVaultType,
} from "@/lib/supabase/types";

interface AdminVaultTabProps {
  initialItems: ExclusiveVaultItem[];
}

const CATEGORY_LABELS: Record<ExclusiveVaultCategory, string> = {
  coding: "البرمجة والـ AI",
  video: "المونتاج والفيديو",
  design: "التصميم والهوية",
  marketing: "التسويق والإعلانات",
  general: "عام",
};

export function AdminVaultTab({ initialItems }: AdminVaultTabProps) {
  const [items, setItems] = useState<ExclusiveVaultItem[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [type, setType] = useState<ExclusiveVaultType>("skill");
  const [category, setCategory] = useState<ExclusiveVaultCategory>("coding");
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");
  const [fileName, setFileName] = useState("tornado-skill.md");
  const [installCmd, setInstallCmd] = useState("");
  const [description, setDescription] = useState("");
  const [howTo, setHowTo] = useState("");
  const [content, setContent] = useState("");
  const [isFeatured, setIsFeatured] = useState(true);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category,
          title: title.trim(),
          tag: tag.trim(),
          file_name: fileName.trim() || "tornado-skill.md",
          install_cmd: installCmd.trim(),
          description: description.trim(),
          how_to: howTo.trim(),
          content: content.trim(),
          is_featured: isFeatured,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.item) {
        setItems((prev) => [data.item as ExclusiveVaultItem, ...prev]);
        setTitle("");
        setTag("");
        setInstallCmd("");
        setDescription("");
        setHowTo("");
        setContent("");
        setShowForm(false);
        setSuccessMsg("تمت إضافة العنصر إلى الخزنة الحصرية للطلاب.");
      } else {
        setError(data?.error || "تعذر حفظ العنصر.");
      }
    } catch {
      setError("تعذر حفظ العنصر.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ExclusiveVaultItem) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${item.title}"؟`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/vault/${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      } else {
        setError(data?.error || "تعذر حذف العنصر.");
      }
    } catch {
      setError("تعذر حذف العنصر.");
    }
  };

  return (
    <div className="admin-tab-stack">
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

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="admin-panel-title">
              <Sparkles size={16} />
              <span>الخزنة الحصرية للطلاب ({items.length})</span>
            </h2>
            <p className="admin-panel-sub">
              تظهر فقط للطلاب المسجلين داخل واجهة الطالب (/dashboard).
            </p>
          </div>
          <button
            type="button"
            className="admin-btn-accent"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            <span>{showForm ? "إغلاق" : "إضافة Skill / برومت"}</span>
          </button>
        </div>

        {showForm && (
          <form className="admin-inline-form" onSubmit={handleCreate}>
            <div className="admin-form-row-2">
              <div className="admin-field">
                <label>النوع</label>
                <select
                  className="admin-select"
                  value={type}
                  onChange={(e) => setType(e.target.value as ExclusiveVaultType)}
                >
                  <option value="skill">Skill (مهارة)</option>
                  <option value="prompt">Prompt (برومت)</option>
                </select>
              </div>
              <div className="admin-field">
                <label>التصنيف</label>
                <select
                  className="admin-select"
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as ExclusiveVaultCategory)
                  }
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-form-row-2">
              <div className="admin-field">
                <label>العنوان</label>
                <input
                  type="text"
                  className="admin-input no-start-icon no-end-icon"
                  placeholder="مثال: Tornado Website Architect Skill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="admin-field">
                <label>الوسم (Tag)</label>
                <input
                  type="text"
                  className="admin-input no-start-icon no-end-icon"
                  placeholder="مثال: Claude Code · حصري"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-form-row-2">
              <div className="admin-field">
                <label>اسم الملف عند التحميل</label>
                <input
                  type="text"
                  dir="ltr"
                  className="admin-input no-start-icon no-end-icon"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                />
              </div>
              <div className="admin-field">
                <label>أمر التثبيت السريع (اختياري)</label>
                <input
                  type="text"
                  dir="ltr"
                  className="admin-input no-start-icon no-end-icon"
                  placeholder="npx skills add ..."
                  value={installCmd}
                  onChange={(e) => setInstallCmd(e.target.value)}
                />
              </div>
            </div>

            <div className="admin-field">
              <label>وصف مختصر</label>
              <input
                type="text"
                className="admin-input no-start-icon no-end-icon"
                placeholder="ماذا يفعل هذا الـ Skill أو البرومت؟"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>طريقة الاستخدام</label>
              <input
                type="text"
                className="admin-input no-start-icon no-end-icon"
                placeholder="خطوات تشغيله بسرعة"
                value={howTo}
                onChange={(e) => setHowTo(e.target.value)}
              />
            </div>

            <div className="admin-field">
              <label>محتوى الـ Skill أو البرومت</label>
              <textarea
                className="admin-textarea"
                dir="ltr"
                rows={7}
                placeholder="الصق هنا نص البرومت أو محتوى ملف SKILL.md..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <label className="admin-check-row">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />
              <span>تمييز كـ Featured في أعلى الخزنة</span>
            </label>

            <button
              type="submit"
              className="admin-btn-primary"
              disabled={saving}
            >
              {saving ? (
                <Loader2 size={16} className="admin-spin" />
              ) : (
                <Plus size={16} />
              )}
              <span>نشر في الخزنة الحصرية</span>
            </button>
          </form>
        )}

        {items.length === 0 ? (
          <div className="admin-empty">
            <Sparkles size={28} />
            <p>
              لا توجد عناصر في الخزنة الحصرية بعد. أضف أول Skill أو برومت للطلاب!
            </p>
          </div>
        ) : (
          <div className="admin-vault-grid">
            {items.map((item) => (
              <div key={item.id} className="admin-vault-card">
                <div className="admin-vault-card-head">
                  <div className="admin-vault-badges">
                    <span className="admin-pill-mini">
                      {item.type === "skill" ? (
                        <Terminal size={12} />
                      ) : (
                        <FileCode2 size={12} />
                      )}
                      <span>{item.type === "skill" ? "Skill" : "Prompt"}</span>
                    </span>
                    <span className="admin-pill-mini">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    {item.is_featured && (
                      <span className="admin-pill-mini is-gold">
                        <Star size={11} />
                        <span>مميز</span>
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="admin-icon-btn is-danger"
                    title="حذف"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 className="admin-vault-title">{item.title}</h3>
                {item.description && (
                  <p className="admin-vault-desc">{item.description}</p>
                )}
                <div className="admin-vault-foot" dir="ltr">
                  {item.file_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
