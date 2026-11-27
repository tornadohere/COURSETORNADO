"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  MessageSquare,
  Sparkles,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Home,
} from "lucide-react";
import type {
  ChatChannelRecord,
  ChatMessageRecord,
  CourseRecord,
  ExclusiveVaultItem,
  MemberProfile,
} from "@/lib/supabase/types";
import { StudentCoursesView } from "./StudentCoursesView";
import { StudentCommunityView } from "./StudentCommunityView";
import { StudentVaultView } from "./StudentVaultView";
import { StudentSettingsView } from "./StudentSettingsView";

type DashboardSection = "courses" | "community" | "vault" | "settings";

interface StudentDashboardProps {
  initialProfile: MemberProfile;
  courses: CourseRecord[];
  completedLessonIds: string[];
  channels: ChatChannelRecord[];
  initialMessages: ChatMessageRecord[];
  initialChannelId: string;
  vaultItems: ExclusiveVaultItem[];
}

export function StudentDashboard({
  initialProfile,
  courses,
  completedLessonIds,
  channels,
  initialMessages,
  initialChannelId,
  vaultItems,
}: StudentDashboardProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<MemberProfile>(initialProfile);
  const [section, setSection] = useState<DashboardSection>("courses");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/dashboard/auth/logout", { method: "POST" });
    } finally {
      router.refresh();
    }
  };

  const navItems: {
    id: DashboardSection;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    badge?: number;
  }[] = [
    { id: "courses", label: "الكورسات والدروس", icon: BookOpen, badge: courses.length },
    { id: "community", label: "مجتمع الدردشة", icon: MessageSquare, badge: channels.length },
    { id: "vault", label: "الخزنة الحصرية", icon: Sparkles, badge: vaultItems.length },
    { id: "settings", label: "إعدادات الحساب", icon: Settings },
  ];

  const displayName =
    profile.full_name?.trim() || profile.email.split("@")[0] || "طالب";

  return (
    <div className="sd-shell-bg" dir="rtl">
      <div className="sd-app-layout">
        {/* Mobile Header */}
        <header className="sd-mobile-header">
          <div className="sd-mobile-brand">
            <div className="sd-brand-icon" style={{ width: 34, height: 34 }}>
              <img src="/brand/tornado-icon.webp" alt="Tornado Academy" />
            </div>
            <strong>Tornado Academy</strong>
          </div>
          <button
            type="button"
            className="sd-icon-btn"
            aria-label="القائمة"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {/* Sidebar */}
        <aside className={`sd-sidebar${mobileMenuOpen ? " is-open" : ""}`}>
          <div className="sd-sidebar-brand">
            <div className="sd-brand-icon">
              <img src="/brand/tornado-icon.webp" alt="Tornado Academy" />
            </div>
            <div>
              <div className="sd-sidebar-title">Tornado Academy</div>
              <div className="sd-sidebar-sub">بوابة الطلاب والمجتمع</div>
            </div>
          </div>

          <nav className="sd-sidebar-nav" aria-label="التنقل الرئيسي">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`sd-nav-btn${active ? " is-active" : ""}`}
                  onClick={() => {
                    setSection(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon size={17} />
                  <span style={{ flex: 1, textAlign: "start" }}>
                    {item.label}
                  </span>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span className="sd-nav-badge">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="sd-sidebar-footer">
            {profile.role === "admin" && (
              <Link href="/admin" className="sd-nav-btn">
                <ShieldCheck size={16} />
                <span>لوحة تحكم الأدمن</span>
              </Link>
            )}
            <Link href="/" className="sd-nav-btn">
              <Home size={16} />
              <span>الصفحة الرئيسية</span>
            </Link>

            <div className="sd-user-card">
              <div className="sd-user-avatar">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
              <div className="sd-user-meta">
                <div className="sd-user-name">{displayName}</div>
                <div className="sd-user-email" dir="ltr">
                  {profile.email}
                </div>
              </div>
              <button
                type="button"
                className="sd-icon-btn"
                title="تسجيل خروج"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="sd-main-stage">
          {section === "courses" && (
            <StudentCoursesView
              courses={courses}
              initialCompletedIds={completedLessonIds}
              onSessionExpired={() => router.refresh()}
            />
          )}

          {section === "community" && (
            <StudentCommunityView
              profile={profile}
              channels={channels}
              initialMessages={initialMessages}
              initialChannelId={initialChannelId}
            />
          )}

          {section === "vault" && <StudentVaultView items={vaultItems} />}

          {section === "settings" && (
            <StudentSettingsView
              profile={profile}
              onProfileUpdated={(next) => setProfile(next)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
