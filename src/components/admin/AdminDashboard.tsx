"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Clock,
  CheckCircle2,
  Search,
  RefreshCw,
  LogOut,
  Download,
  Plus,
  X,
  Copy,
  Check,
  Trash2,
  MessageCircle,
  ShieldCheck,
  Calendar,
  Database,
  Inbox,
  Loader2,
} from "lucide-react";
import type {
  AdminProfile,
  WaitlistEntry,
  WaitlistStats,
  WaitlistStatus,
} from "@/lib/supabase/types";

interface AdminDashboardProps {
  profile: AdminProfile;
  initialEntries: WaitlistEntry[];
  initialStats: WaitlistStats;
}

const STATUS_LABELS: Record<WaitlistStatus, string> = {
  new: "جديد",
  contacted: "تم التواصل",
  enrolled: "مشترك",
  archived: "مؤرشف",
};

const FILTER_OPTIONS: { value: "all" | WaitlistStatus; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "new", label: "جديد" },
  { value: "contacted", label: "تم التواصل" },
  { value: "enrolled", label: "مشترك" },
  { value: "archived", label: "مؤرشف" },
];

function formatWhatsAppUrl(rawPhone: string, name: string) {
  const digits = rawPhone.replace(/[^\d+]/g, "");
  let normalized = digits.replace(/^\+/, "");
  if (normalized.startsWith("01") && normalized.length === 11) {
    normalized = `20${normalized.slice(1)}`;
  } else if (normalized.startsWith("00")) {
    normalized = normalized.slice(2);
  }
  const text = encodeURIComponent(
    `أهلًا ${name}، معاك فريق Tornado Academy بخصوص تسجيلك في قائمة الانتظار لافتتاح 1 ديسمبر.`
  );
  return `https://wa.me/${normalized}?text=${text}`;
}

function formatDateArabic(iso: string) {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function recomputeStats(entries: WaitlistEntry[]): WaitlistStats {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let today = 0;
  let last7Days = 0;
  let newCount = 0;
  let contactedCount = 0;
  let enrolledCount = 0;
  let archivedCount = 0;

  for (const item of entries) {
    const ms = new Date(item.created_at).getTime();
    if (ms >= startOfToday) today += 1;
    if (ms >= sevenDaysAgo) last7Days += 1;
    if (item.status === "new") newCount += 1;
    else if (item.status === "contacted") contactedCount += 1;
    else if (item.status === "enrolled") enrolledCount += 1;
    else if (item.status === "archived") archivedCount += 1;
  }

  return {
    total: entries.length,
    today,
    last7Days,
    newCount,
    contactedCount,
    enrolledCount,
    archivedCount,
  };
}

export function AdminDashboard({
  profile,
  initialEntries,
  initialStats,
}: AdminDashboardProps) {
  const router = useRouter();
  const [entries, setEntries] = useState<WaitlistEntry[]>(initialEntries);
  const [stats, setStats] = useState<WaitlistStats>(initialStats);
  const [statusFilter, setStatusFilter] = useState<"all" | WaitlistStatus>(
    "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Quick Add state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Local draft notes per row
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return entries.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [entries, statusFilter, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setActionError(null);
    try {
      const res = await fetch("/api/admin/waitlist", { cache: "no-store" });
      if (res.status === 401) {
        router.refresh();
        return;
      }
      const data = await res.json();
      if (data?.ok && Array.isArray(data.entries)) {
        setEntries(data.entries);
        setStats(data.stats ?? recomputeStats(data.entries));
      }
    } catch {
      setActionError("تعذر تحديث البيانات. حاول مرة أخرى.");
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  const handleStatusChange = async (id: string, nextStatus: WaitlistStatus) => {
    setBusyId(id);
    setActionError(null);
    const prevEntries = entries;
    const optimistic = entries.map((item) =>
      item.id === id ? { ...item, status: nextStatus } : item
    );
    setEntries(optimistic);
    setStats(recomputeStats(optimistic));

    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setEntries(prevEntries);
        setStats(recomputeStats(prevEntries));
        setActionError("تعذر تحديث الحالة.");
      }
    } catch {
      setEntries(prevEntries);
      setStats(recomputeStats(prevEntries));
      setActionError("تعذر تحديث الحالة.");
    } finally {
      setBusyId(null);
    }
  };

  const handleNotesBlur = async (entry: WaitlistEntry) => {
    const draft = notesDraft[entry.id];
    if (draft === undefined || draft.trim() === entry.notes.trim()) return;

    setBusyId(entry.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/waitlist/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.entry) {
        setEntries((prev) =>
          prev.map((item) => (item.id === entry.id ? data.entry : item))
        );
      } else {
        setActionError("تعذر حفظ الملاحظة.");
      }
    } catch {
      setActionError("تعذر حفظ الملاحظة.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/waitlist/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const next = entries.filter((item) => item.id !== id);
        setEntries(next);
        setStats(recomputeStats(next));
      } else {
        setActionError("تعذر حذف السجل.");
      }
    } catch {
      setActionError("تعذر حذف السجل.");
    } finally {
      setConfirmDeleteId(null);
      setBusyId(null);
    }
  };

  const handleQuickAdd = async (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setAdding(true);
    setActionError(null);

    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          phone: newPhone.trim(),
          notes: newNotes.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.entry) {
        const next = [data.entry as WaitlistEntry, ...entries];
        setEntries(next);
        setStats(recomputeStats(next));
        setNewName("");
        setNewPhone("");
        setNewNotes("");
        setShowAddForm(false);
      } else {
        setActionError(data?.error || "تعذر إضافة التسجيل.");
      }
    } catch {
      setActionError("تعذر إضافة التسجيل.");
    } finally {
      setAdding(false);
    }
  };

  const handleCopyPhone = async (id: string, phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1500);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleExportCsv = () => {
    const header = ["Name", "Phone", "Status", "Notes", "Source", "Created At"];
    const rows = filteredEntries.map((item) => [
      item.name,
      item.phone,
      item.status,
      item.notes,
      item.source,
      item.created_at,
    ]);

    const escapeCell = (val: string) =>
      `"${String(val ?? "").replaceAll('"', '""')}"`;

    const csv =
      "\uFEFF" +
      [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tornado-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-shell-bg" dir="rtl">
      <div className="admin-container">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="admin-topbar-brand">
            <div className="admin-brand-icon">
              <img src="/brand/tornado-icon.webp" alt="Tornado Academy" />
            </div>
            <div>
              <h1 className="admin-topbar-title">لوحة تحكم Tornado Academy</h1>
              <div className="admin-topbar-meta">
                <span className="admin-role-pill">
                  <ShieldCheck size={12} strokeWidth={2.4} aria-hidden="true" />
                  <span>{profile.role}</span>
                </span>
                <span dir="ltr">{profile.email}</span>
              </div>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                size={15}
                className={refreshing ? "admin-spin" : undefined}
                aria-hidden="true"
              />
              <span>تحديث</span>
            </button>

            <button
              type="button"
              className="admin-btn-secondary"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              <LogOut size={15} aria-hidden="true" />
              <span>{signingOut ? "جاري الخروج..." : "تسجيل خروج"}</span>
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="admin-kpi-grid" aria-label="إحصائيات سريعة">
          <div className="admin-kpi-card">
            <div className="admin-kpi-head">
              <span>إجمالي الـ Waitlist</span>
              <span className="admin-kpi-icon">
                <Users size={17} aria-hidden="true" />
              </span>
            </div>
            <div className="admin-kpi-value">{stats.total}</div>
            <div className="admin-kpi-foot">
              آخر 7 أيام: {stats.last7Days} تسجيل
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-head">
              <span>تسجيلات اليوم</span>
              <span className="admin-kpi-icon">
                <UserPlus size={17} aria-hidden="true" />
              </span>
            </div>
            <div className="admin-kpi-value">{stats.today}</div>
            <div className="admin-kpi-foot">تسجيل جديد منذ بداية اليوم</div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-head">
              <span>بانتظار التواصل</span>
              <span className="admin-kpi-icon">
                <Clock size={17} aria-hidden="true" />
              </span>
            </div>
            <div className="admin-kpi-value">{stats.newCount}</div>
            <div className="admin-kpi-foot">
              تم التواصل: {stats.contactedCount}
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="admin-kpi-head">
              <span>تم التأكيد (مشتركين)</span>
              <span className="admin-kpi-icon">
                <CheckCircle2 size={17} aria-hidden="true" />
              </span>
            </div>
            <div className="admin-kpi-value">{stats.enrolledCount}</div>
            <div className="admin-kpi-foot">
              نسبة التحويل:{" "}
              {stats.total > 0
                ? `${Math.round((stats.enrolledCount / stats.total) * 100)}%`
                : "0%"}
            </div>
          </div>
        </section>

        {actionError && (
          <div className="admin-alert admin-alert-error" role="alert">
            <span>{actionError}</span>
          </div>
        )}

        {/* Waitlist Management Panel */}
        <section className="admin-panel" aria-labelledby="waitlist-heading">
          <div className="admin-panel-header">
            <div className="admin-panel-title-wrap">
              <h2 id="waitlist-heading">قائمة الانتظار (Waitlist)</h2>
              <p>
                إدارة المسجلين، متابعة حالات التواصل، والتصدير السريع للافتتاح يوم 1
                ديسمبر.
              </p>
            </div>

            <div className="admin-topbar-actions">
              <button
                type="button"
                className="admin-btn-secondary"
                onClick={handleExportCsv}
                disabled={filteredEntries.length === 0}
              >
                <Download size={15} aria-hidden="true" />
                <span>تصدير CSV</span>
              </button>

              <button
                type="button"
                className="admin-btn-accent"
                onClick={() => setShowAddForm((prev) => !prev)}
              >
                {showAddForm ? (
                  <>
                    <X size={15} aria-hidden="true" />
                    <span>إغلاق</span>
                  </>
                ) : (
                  <>
                    <Plus size={15} aria-hidden="true" />
                    <span>إضافة يدوية</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {showAddForm && (
            <form className="admin-add-form" onSubmit={handleQuickAdd}>
              <label>
                <span>الاسم بالكامل</span>
                <input
                  className="admin-input no-start-icon no-end-icon"
                  required
                  maxLength={120}
                  placeholder="مثال: أحمد محمود"
                  value={newName}
                  onChange={(ev) => setNewName(ev.target.value)}
                />
              </label>
              <label>
                <span>رقم التليفون</span>
                <input
                  className="admin-input no-start-icon no-end-icon"
                  dir="ltr"
                  required
                  maxLength={40}
                  placeholder="01XXXXXXXXX"
                  value={newPhone}
                  onChange={(ev) => setNewPhone(ev.target.value)}
                />
              </label>
              <label>
                <span>ملاحظة (اختياري)</span>
                <input
                  className="admin-input no-start-icon no-end-icon"
                  maxLength={1000}
                  placeholder="مصدر التواصل أو أي تفاصيل"
                  value={newNotes}
                  onChange={(ev) => setNewNotes(ev.target.value)}
                />
              </label>
              <button
                type="submit"
                className="admin-btn-accent"
                style={{ height: 40 }}
                disabled={adding}
              >
                {adding ? (
                  <Loader2 size={15} className="admin-spin" aria-hidden="true" />
                ) : (
                  <Plus size={15} aria-hidden="true" />
                )}
                <span>{adding ? "جاري الحفظ..." : "حفظ"}</span>
              </button>
            </form>
          )}

          {/* Filter & Search Toolbar */}
          <div className="admin-toolbar">
            <div className="admin-filter-pills" role="tablist">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === opt.value}
                  className={`admin-filter-pill ${
                    statusFilter === opt.value ? "is-active" : ""
                  }`}
                  onClick={() => setStatusFilter(opt.value)}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="admin-search-box">
              <div className="admin-input-wrap">
                <Search
                  size={16}
                  className="admin-input-icon"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  className="admin-input no-end-icon"
                  placeholder="ابحث بالاسم أو الرقم أو الملاحظات..."
                  value={searchQuery}
                  onChange={(ev) => setSearchQuery(ev.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          {filteredEntries.length === 0 ? (
            <div className="admin-empty">
              <Inbox size={34} strokeWidth={1.6} aria-hidden="true" />
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>
                لا توجد تسجيلات مطابقة حاليًا
              </div>
              <div style={{ fontSize: 13 }}>
                {entries.length === 0
                  ? "أي شخص يسجل من صفحة الهبوط سيظهر هنا فورًا."
                  : "جرّب تغيير الفلتر أو كلمة البحث."}
              </div>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>رقم التليفون</th>
                    <th>الحالة</th>
                    <th>ملاحظات</th>
                    <th>تاريخ التسجيل</th>
                    <th style={{ width: 92 }}>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => {
                    const currentNote =
                      notesDraft[entry.id] !== undefined
                        ? notesDraft[entry.id]
                        : entry.notes;
                    const isDeletingConfirm = confirmDeleteId === entry.id;

                    return (
                      <tr key={entry.id}>
                        <td>
                          <div className="admin-lead-name">{entry.name}</div>
                          <div className="admin-lead-source">
                            المصدر: {entry.source === "admin" ? "إضافة يدوية" : "صفحة الهبوط"}
                          </div>
                        </td>

                        <td>
                          <div className="admin-phone-cell">
                            <span>{entry.phone}</span>
                            <button
                              type="button"
                              className="admin-icon-btn"
                              title="نسخ الرقم"
                              aria-label="نسخ الرقم"
                              onClick={() => handleCopyPhone(entry.id, entry.phone)}
                            >
                              {copiedId === entry.id ? (
                                <Check size={14} color="#6ee7a8" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                            <a
                              href={formatWhatsAppUrl(entry.phone, entry.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-icon-btn whatsapp"
                              title="مراسلة عبر واتساب"
                              aria-label="مراسلة عبر واتساب"
                            >
                              <MessageCircle size={14} />
                            </a>
                          </div>
                        </td>

                        <td>
                          <select
                            className={`admin-status-select status-${entry.status}`}
                            value={entry.status}
                            disabled={busyId === entry.id}
                            onChange={(ev) =>
                              handleStatusChange(
                                entry.id,
                                ev.target.value as WaitlistStatus
                              )
                            }
                            aria-label={`حالة ${entry.name}`}
                          >
                            {(Object.keys(STATUS_LABELS) as WaitlistStatus[]).map(
                              (statusKey) => (
                                <option key={statusKey} value={statusKey}>
                                  {STATUS_LABELS[statusKey]}
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            className="admin-notes-input"
                            placeholder="أضف ملاحظة..."
                            value={currentNote}
                            onChange={(ev) =>
                              setNotesDraft((prev) => ({
                                ...prev,
                                [entry.id]: ev.target.value,
                              }))
                            }
                            onBlur={() => handleNotesBlur(entry)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") {
                                ev.currentTarget.blur();
                              }
                            }}
                          />
                        </td>

                        <td
                          style={{
                            color: "rgba(229, 228, 226, 0.6)",
                            whiteSpace: "nowrap",
                            fontSize: 12.5,
                          }}
                        >
                          {formatDateArabic(entry.created_at)}
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              className="admin-icon-btn danger"
                              title={
                                isDeletingConfirm
                                  ? "اضغط مرة أخرى لتأكيد الحذف"
                                  : "حذف التسجيل"
                              }
                              aria-label="حذف التسجيل"
                              disabled={busyId === entry.id}
                              onClick={() => handleDelete(entry.id)}
                              onBlur={() => {
                                if (isDeletingConfirm) setConfirmDeleteId(null);
                              }}
                              style={
                                isDeletingConfirm
                                  ? {
                                      width: "auto",
                                      padding: "0 10px",
                                      fontSize: 11.5,
                                      fontWeight: 700,
                                      background: "rgba(239, 68, 68, 0.22)",
                                      borderColor: "rgba(239, 68, 68, 0.5)",
                                      color: "#fca5a5",
                                    }
                                  : undefined
                              }
                            >
                              {isDeletingConfirm ? (
                                "تأكيد؟"
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* System Status Footer Strip */}
        <footer className="admin-footer-strip">
          <div className="admin-footer-item">
            <span className="admin-dot-live" aria-hidden="true" />
            <Database size={14} aria-hidden="true" />
            <span>متصل بـ Supabase (RLS &amp; Role Auth مفعّل)</span>
          </div>
          <div className="admin-footer-item">
            <Calendar size={14} aria-hidden="true" />
            <span>موعد الافتتاح الرسمي: 1 ديسمبر 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
