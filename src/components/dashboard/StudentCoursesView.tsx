"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Circle,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Layers,
  ChevronDown,
} from "lucide-react";
import type { CourseRecord, LessonRecord } from "@/lib/supabase/types";
import { VideoPlayer } from "@/components/VideoPlayer";

interface StudentCoursesViewProps {
  courses: CourseRecord[];
  initialCompletedIds: string[];
  onSessionExpired: () => void;
}

export function StudentCoursesView({
  courses,
  initialCompletedIds,
  onSessionExpired,
}: StudentCoursesViewProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || ""
  );
  const [completedSet, setCompletedSet] = useState<Set<string>>(
    () => new Set(initialCompletedIds)
  );
  const [activeLessonId, setActiveLessonId] = useState<string>(
    courses[0]?.lessons?.[0]?.id || ""
  );

  const [playback, setPlayback] = useState<{
    src: string;
    isHls: boolean;
    watermarkText: string;
  } | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(
    () => new Set()
  );

  const activeCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || courses[0] || null,
    [courses, selectedCourseId]
  );

  const activeLesson = useMemo(() => {
    if (!activeCourse?.lessons?.length) return null;
    return (
      activeCourse.lessons.find((l) => l.id === activeLessonId) ||
      activeCourse.lessons[0]
    );
  }, [activeCourse, activeLessonId]);

  // Group lessons by explicit modules (in sort_order) + fallback by module_title
  const modules = useMemo(() => {
    if (!activeCourse) return [];
    const explicitMods = [...(activeCourse.modules || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const lessons = activeCourse.lessons || [];
    const usedIds = new Set<string>();
    const result: { key: string; title: string; lessons: LessonRecord[] }[] =
      [];

    for (const mod of explicitMods) {
      const modLessons = lessons.filter((l) => {
        const match =
          l.module_id === mod.id ||
          (!l.module_id && l.module_title === mod.title);
        if (match) usedIds.add(l.id);
        return match;
      });
      if (modLessons.length > 0) {
        result.push({ key: mod.id, title: mod.title, lessons: modLessons });
      }
    }

    const remaining = lessons.filter((l) => !usedIds.has(l.id));
    if (remaining.length > 0) {
      const map = new Map<string, LessonRecord[]>();
      for (const lesson of remaining) {
        const mod = lesson.module_title || "عام";
        const list = map.get(mod) || [];
        list.push(lesson);
        map.set(mod, list);
      }
      for (const [title, list] of map.entries()) {
        result.push({ key: `legacy-${title}`, title, lessons: list });
      }
    }

    return result;
  }, [activeCourse]);

  // Load protected playback URL whenever activeLesson changes
  useEffect(() => {
    if (!activeLesson?.id) {
      setPlayback(null);
      setVideoError(null);
      return;
    }

    let cancelled = false;
    setLoadingVideo(true);
    setVideoError(null);
    setPlayback(null);

    fetch(`/api/courses/lessons/${activeLesson.id}/playback`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 401 && data?.sessionMismatch) {
          onSessionExpired();
          return;
        }
        if (res.ok && data?.ok && data.src) {
          setPlayback({
            src: data.src,
            isHls: data.videoType === "hls",
            watermarkText: data.watermarkText || "",
          });
        } else {
          setVideoError(data?.error || "تعذر تحميل الفيديو.");
        }
      })
      .catch(() => {
        if (!cancelled) setVideoError("حدث خطأ في الاتصال بالسيرفر.");
      })
      .finally(() => {
        if (!cancelled) setLoadingVideo(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeLesson?.id, onSessionExpired]);

  const handleToggleComplete = async (lessonId: string) => {
    const nextCompleted = !completedSet.has(lessonId);
    setCompletedSet((prev) => {
      const next = new Set(prev);
      if (nextCompleted) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });

    try {
      await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lesson_id: lessonId,
          completed: nextCompleted,
        }),
      });
    } catch {
      // Keep optimistic state
    }
  };

  if (courses.length === 0) {
    return (
      <div className="sd-empty-card">
        <BookOpen size={30} />
        <h2 style={{ margin: "8px 0 4px", color: "#fafafa", fontSize: 18 }}>
          لا توجد كورسات منشورة حالياً
        </h2>
        <p style={{ margin: 0 }}>
          سيتم نشر الدروس هنا فور إضافتها من إدارة Tornado Academy.
        </p>
      </div>
    );
  }

  const courseLessons = activeCourse?.lessons || [];
  const completedInCourse = courseLessons.filter((l) =>
    completedSet.has(l.id)
  ).length;
  const progressPct =
    courseLessons.length > 0
      ? Math.round((completedInCourse / courseLessons.length) * 100)
      : 0;

  return (
    <div className="sd-section-stack">
      {/* Course selector pills if multiple courses */}
      {courses.length > 1 && (
        <div className="sd-course-switcher">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              className={`sd-course-pill${
                course.id === activeCourse?.id ? " is-active" : ""
              }`}
              onClick={() => {
                setSelectedCourseId(course.id);
                setActiveLessonId(course.lessons?.[0]?.id || "");
              }}
            >
              <BookOpen size={14} />
              <span>{course.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Split: Video Stage + Curriculum */}
      <div className="sd-player-layout">
        {/* Video Stage */}
        <div className="sd-stage-col">
          <div className="sd-video-frame">
            {loadingVideo ? (
              <div className="sd-video-placeholder">
                <Loader2 size={28} className="sd-spin" />
                <span>جاري تجهيز البث الآمن المشفر...</span>
              </div>
            ) : videoError ? (
              <div className="sd-video-placeholder">
                <AlertTriangle size={28} />
                <span>{videoError}</span>
              </div>
            ) : playback ? (
              <VideoPlayer
                key={activeLesson?.id}
                src={playback.src}
                isEn={false}
                autoPlay={false}
                loop={false}
                isHls={playback.isHls}
                watermarkText={playback.watermarkText}
                protectedMode={true}
              />
            ) : (
              <div className="sd-video-placeholder">
                <PlayCircle size={32} />
                <span>اختر درساً من القائمة لبدء المشاهدة</span>
              </div>
            )}
          </div>

          {activeLesson && (
            <div className="sd-lesson-header-card">
              <div className="sd-lesson-header-top">
                <div>
                  <div className="sd-kicker">
                    <Layers size={12} />
                    <span>{activeLesson.module_title}</span>
                  </div>
                  <h1 className="sd-lesson-heading">{activeLesson.title}</h1>
                </div>

                <button
                  type="button"
                  className={
                    completedSet.has(activeLesson.id)
                      ? "sd-btn-primary"
                      : "sd-btn-secondary"
                  }
                  style={{ width: "auto", padding: "0 16px", height: 40 }}
                  onClick={() => handleToggleComplete(activeLesson.id)}
                >
                  {completedSet.has(activeLesson.id) ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Circle size={15} />
                  )}
                  <span>
                    {completedSet.has(activeLesson.id)
                      ? "تم إكمال الدرس"
                      : "تحديد كمكتمل"}
                  </span>
                </button>
              </div>

              {activeLesson.description && (
                <p className="sd-muted-copy" style={{ marginTop: 10 }}>
                  {activeLesson.description}
                </p>
              )}

              <div className="sd-security-strip">
                <ShieldCheck size={14} />
                <span>
                  بث محمي بتشفير Cloudflare R2 + علامة مائية باسم حسابك
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Curriculum Sidebar */}
        <aside className="sd-curriculum-card">
          <div className="sd-curriculum-head">
            <div>
              <h2 className="sd-card-title" style={{ marginBottom: 4 }}>
                {activeCourse?.title}
              </h2>
              <div style={{ fontSize: 12.5, color: "rgba(229,228,226,0.58)" }}>
                أكملت {completedInCourse} من {courseLessons.length} دروس (
                {progressPct}%)
              </div>
            </div>
          </div>

          <div className="sd-progress-track">
            <div
              className="sd-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="sd-modules-list">
            {modules.map((mod) => {
              const isCollapsed = collapsedModules.has(mod.key);
              const modCompleted = mod.lessons.filter((l) =>
                completedSet.has(l.id)
              ).length;
              return (
                <div key={mod.key} className="sd-module-group">
                  <button
                    type="button"
                    className="sd-module-head-btn"
                    onClick={() =>
                      setCollapsedModules((prev) => {
                        const next = new Set(prev);
                        if (next.has(mod.key)) next.delete(mod.key);
                        else next.add(mod.key);
                        return next;
                      })
                    }
                  >
                    <span className="sd-module-title" style={{ marginBottom: 0 }}>
                      {mod.title}
                    </span>
                    <span className="sd-module-head-meta">
                      <span>
                        {modCompleted}/{mod.lessons.length}
                      </span>
                      <ChevronDown
                        size={14}
                        style={{
                          transform: isCollapsed
                            ? "rotate(90deg)"
                            : "rotate(0deg)",
                          transition: "transform 0.18s ease",
                        }}
                      />
                    </span>
                  </button>

                  {!isCollapsed && (
                    <div className="sd-module-lessons">
                      {mod.lessons.map((lesson) => {
                        const isActive = lesson.id === activeLesson?.id;
                        const isDone = completedSet.has(lesson.id);
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`sd-lesson-item${isActive ? " is-active" : ""}`}
                            onClick={() => setActiveLessonId(lesson.id)}
                          >
                            <span
                              className={`sd-lesson-check${isDone ? " is-done" : ""}`}
                            >
                              {isDone ? (
                                <CheckCircle2 size={15} />
                              ) : (
                                <PlayCircle size={15} />
                              )}
                            </span>
                            <span className="sd-lesson-item-title">
                              {lesson.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
