"use client";

import React, { useState } from "react";
import {
  Hash,
  Lock,
  Unlock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from "lucide-react";
import type { ChatChannelRecord } from "@/lib/supabase/types";

interface AdminChannelsTabProps {
  initialChannels: ChatChannelRecord[];
}

export function AdminChannelsTab({ initialChannels }: AdminChannelsTabProps) {
  const [channels, setChannels] = useState<ChatChannelRecord[]>(initialChannels);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isReadonly, setIsReadonly] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || creating) return;
    setCreating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          is_readonly: isReadonly,
          sort_order: channels.length + 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.channel) {
        setChannels((prev) => [...prev, data.channel as ChatChannelRecord]);
        setName("");
        setDescription("");
        setIsReadonly(false);
        setSuccessMsg("تم إنشاء القناة الجديدة في المجتمع.");
      } else {
        setError(data?.error || "تعذر إنشاء القناة.");
      }
    } catch {
      setError("تعذر إنشاء القناة.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleReadonly = async (ch: ChatChannelRecord) => {
    setError(null);
    const next = !ch.is_readonly;
    try {
      const res = await fetch(`/api/admin/channels/${ch.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_readonly: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setChannels((prev) =>
          prev.map((item) =>
            item.id === ch.id ? { ...item, is_readonly: next } : item
          )
        );
      } else {
        setError(data?.error || "تعذر تحديث القناة.");
      }
    } catch {
      setError("تعذر تحديث القناة.");
    }
  };

  const handleDelete = async (ch: ChatChannelRecord) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف قناة "# ${ch.name}" وكل الرسائل بداخلها؟`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/channels/${ch.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setChannels((prev) => prev.filter((item) => item.id !== ch.id));
      } else {
        setError(data?.error || "تعذر حذف القناة.");
      }
    } catch {
      setError("تعذر حذف القناة.");
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
          <h2 className="admin-panel-title">
            <Plus size={16} />
            <span>إضافة قناة دردشة جديدة</span>
          </h2>
        </div>

        <form className="admin-channel-form" onSubmit={handleCreate}>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label>اسم القناة</label>
            <input
              type="text"
              className="admin-input no-start-icon no-end-icon"
              placeholder="مثال: عرض أعمال الطلاب"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="admin-field" style={{ marginBottom: 0 }}>
            <label>وصف القناة</label>
            <input
              type="text"
              className="admin-input no-start-icon no-end-icon"
              placeholder="وصف قصير يظهر أعلى القناة"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <label className="admin-check-row" style={{ alignSelf: "end", height: 46 }}>
            <input
              type="checkbox"
              checked={isReadonly}
              onChange={(e) => setIsReadonly(e.target.checked)}
            />
            <span>للقراءة فقط (أدمن فقط يكتب)</span>
          </label>
          <button
            type="submit"
            className="admin-btn-accent"
            style={{ height: 46, alignSelf: "end" }}
            disabled={creating}
          >
            {creating ? (
              <Loader2 size={15} className="admin-spin" />
            ) : (
              <Plus size={15} />
            )}
            <span>إنشاء</span>
          </button>
        </form>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <h2 className="admin-panel-title">
            <MessageSquare size={16} />
            <span>قنوات المجتمع الحالية ({channels.length})</span>
          </h2>
        </div>

        <div className="admin-lesson-list">
          {channels.map((ch) => (
            <div key={ch.id} className="admin-lesson-row">
              <div className="admin-lesson-num">
                {ch.is_readonly ? <Lock size={14} /> : <Hash size={15} />}
              </div>
              <div className="admin-lesson-info">
                <div className="admin-lesson-title">{ch.name}</div>
                <div className="admin-lesson-meta">
                  <span>{ch.description || "بدون وصف"}</span>
                  <span>·</span>
                  <span className="admin-pill-mini">
                    {ch.is_readonly ? "إعلانات (أدمن فقط)" : "مفتوحة للطلاب"}
                  </span>
                </div>
              </div>
              <div className="admin-lesson-actions">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => handleToggleReadonly(ch)}
                >
                  {ch.is_readonly ? <Unlock size={14} /> : <Lock size={14} />}
                  <span>
                    {ch.is_readonly ? "فتح للطلاب" : "جعلها للقراءة فقط"}
                  </span>
                </button>
                <button
                  type="button"
                  className="admin-icon-btn is-danger"
                  title="حذف القناة"
                  onClick={() => handleDelete(ch)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
