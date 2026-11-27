"use client";

import React, { useMemo, useState } from "react";
import {
  Sparkles,
  Search,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode2,
  Star,
} from "lucide-react";
import type {
  ExclusiveVaultCategory,
  ExclusiveVaultItem,
} from "@/lib/supabase/types";

interface StudentVaultViewProps {
  items: ExclusiveVaultItem[];
}

const CATEGORIES: { value: "all" | ExclusiveVaultCategory; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "coding", label: "البرمجة والـ AI" },
  { value: "video", label: "المونتاج والفيديو" },
  { value: "design", label: "التصميم والهوية" },
  { value: "marketing", label: "التسويق والإعلانات" },
  { value: "general", label: "عام" },
];

export function StudentVaultView({ items }: StudentVaultViewProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | ExclusiveVaultCategory>(
    "all"
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
      );
    });
  }, [items, search, category]);

  const handleCopy = async (id: string, text: string, isCmd = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isCmd) {
        setCopiedCmdId(id);
        setTimeout(() => setCopiedCmdId((c) => (c === id ? null : c)), 1800);
      } else {
        setCopiedId(id);
        setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1800);
      }
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDownload = (item: ExclusiveVaultItem) => {
    const blob = new Blob([item.content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = item.file_name || "tornado-skill.md";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="sd-section-stack">
      <header className="sd-view-header">
        <div>
          <div className="sd-kicker">
            <Sparkles size={13} />
            <span>حزمة تورنادو الحصرية للطلاب فقط</span>
          </div>
          <h1 className="sd-view-title">خزنة الـ Skills والبرومتات المميزة</h1>
          <p className="sd-view-sub">
            الأدوات والمهارات والبرومتات الإنتاجية الخاصة بمجتمع Tornado Academy
            — محدثة باستمرار.
          </p>
        </div>
      </header>

      <div className="sd-vault-toolbar">
        <div className="sd-input-wrap" style={{ flex: 1, minWidth: 220 }}>
          <Search size={15} className="sd-input-icon" />
          <input
            type="text"
            className="sd-input"
            style={{ height: 42 }}
            placeholder="ابحث في الـ Skills والبرومتات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sd-filter-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              className={`sd-filter-pill${
                category === cat.value ? " is-active" : ""
              }`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="sd-empty-card">
          <Sparkles size={28} />
          <p>لا توجد عناصر مطابقة حالياً في الخزنة الحصرية.</p>
        </div>
      ) : (
        <div className="sd-vault-grid">
          {filtered.map((item) => (
            <article key={item.id} className="sd-vault-card">
              <div className="sd-vault-card-top">
                <div className="sd-vault-tags">
                  <span className="sd-chip">
                    {item.type === "skill" ? (
                      <Terminal size={12} />
                    ) : (
                      <FileCode2 size={12} />
                    )}
                    <span>{item.type === "skill" ? "Skill" : "Prompt"}</span>
                  </span>
                  {item.tag && <span className="sd-chip">{item.tag}</span>}
                  {item.is_featured && (
                    <span className="sd-chip is-gold">
                      <Star size={11} />
                      <span>مميز</span>
                    </span>
                  )}
                </div>
                <span className="sd-vault-filename" dir="ltr">
                  {item.file_name}
                </span>
              </div>

              <h2 className="sd-vault-title">{item.title}</h2>
              {item.description && (
                <p className="sd-vault-desc">{item.description}</p>
              )}
              {item.how_to && (
                <div className="sd-vault-howto">
                  <strong>طريقة الاستخدام:</strong> {item.how_to}
                </div>
              )}

              {item.install_cmd && (
                <div className="sd-cmd-box" dir="ltr">
                  <code>{item.install_cmd}</code>
                  <button
                    type="button"
                    className="sd-icon-btn"
                    title="نسخ الأمر"
                    onClick={() => handleCopy(item.id, item.install_cmd, true)}
                  >
                    {copiedCmdId === item.id ? (
                      <Check size={14} />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
              )}

              <pre className="sd-vault-code" dir="ltr">
                <code>{item.content}</code>
              </pre>

              <div className="sd-vault-actions">
                <button
                  type="button"
                  className="sd-btn-primary"
                  style={{ height: 38, fontSize: 13 }}
                  onClick={() => handleCopy(item.id, item.content, false)}
                >
                  {copiedId === item.id ? (
                    <Check size={14} />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span>
                    {copiedId === item.id ? "تم النسخ" : "نسخ المحتوى"}
                  </span>
                </button>
                <button
                  type="button"
                  className="sd-btn-secondary"
                  style={{ height: 38 }}
                  onClick={() => handleDownload(item)}
                >
                  <Download size={14} />
                  <span>تحميل الملف</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
