"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Upload,
  Video,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Play,
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FolderUp,
  FileVideo,
  Layers,
  FolderPlus,
  Pencil,
} from "lucide-react";
import type {
  CourseModuleRecord,
  CourseRecord,
  LessonRecord,
  LessonVideoType,
} from "@/lib/supabase/types";
import { VideoPlayer } from "@/components/VideoPlayer";

interface AdminCoursesTabProps {
  initialCourses: CourseRecord[];
  r2Configured: boolean;
}

function uploadFileWithProgress(
  url: string,
  file: File,
  contentType: string,
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(
          new Error(
            `R2 upload failed (${xhr.status}). تأكد من إعداد CORS في Cloudflare R2 Bucket.`
          )
        );
      }
    };
    xhr.onerror = () =>
      reject(
        new Error(
          "فشل الاتصال بـ Cloudflare R2. تأكد من إعداد CORS في Bucket Settings."
        )
      );
    xhr.send(file);
  });
}

export function AdminCoursesTab({
  initialCourses,
  r2Configured,
}: AdminCoursesTabProps) {
  const [courses, setCourses] = useState<CourseRecord[]>(initialCourses);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    initialCourses[0]?.id || ""
  );
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Create course modal
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [coursePublished, setCoursePublished] = useState(false);
  const [creatingCourse, setCreatingCourse] = useState(false);

  // Create module (chapter) form
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [creatingModule, setCreatingModule] = useState(false);

  // Create lesson + upload form
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonModuleId, setLessonModuleId] = useState<string>("");
  const [lessonModule, setLessonModule] = useState("المقدمة");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [lessonOrder, setLessonOrder] = useState(1);
  const [videoMode, setVideoMode] = useState<LessonVideoType>("hls");
  const [hlsKeyHex, setHlsKeyHex] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadStage, setUploadStage] = useState("");

  // Video preview modal
  const [previewData, setPreviewData] = useState<{
    title: string;
    src: string;
    isHls: boolean;
    watermarkText: string;
  } | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId) || null,
    [courses, selectedCourseId]
  );

  const totalLessons = useMemo(
    () => courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0),
    [courses]
  );

  // Group selected course lessons under explicit modules + any legacy module_title groups
  const groupedModules = useMemo(() => {
    if (!selectedCourse) return [];
    const mods = [...(selectedCourse.modules || [])].sort(
      (a, b) => a.sort_order - b.sort_order
    );
    const lessons = selectedCourse.lessons || [];
    const usedLessonIds = new Set<string>();

    const groups: {
      id: string | null;
      title: string;
      description: string;
      lessons: LessonRecord[];
    }[] = mods.map((mod) => {
      const modLessons = lessons.filter((l) => {
        const match =
          l.module_id === mod.id ||
          (!l.module_id && l.module_title === mod.title);
        if (match) usedLessonIds.add(l.id);
        return match;
      });
      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        lessons: modLessons,
      };
    });

    const ungrouped = lessons.filter((l) => !usedLessonIds.has(l.id));
    if (ungrouped.length > 0) {
      const byTitle = new Map<string, LessonRecord[]>();
      for (const l of ungrouped) {
        const key = l.module_title || "عام";
        const arr = byTitle.get(key) || [];
        arr.push(l);
        byTitle.set(key, arr);
      }
      for (const [title, arr] of byTitle.entries()) {
        groups.push({ id: null, title, description: "", lessons: arr });
      }
    }

    return groups;
  }, [selectedCourse]);

  const publishedCoursesCount = useMemo(
    () => courses.filter((c) => c.is_published).length,
    [courses]
  );

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim() || creatingCourse) return;
    setCreatingCourse(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: courseTitle.trim(),
          description: courseDesc.trim(),
          is_published: coursePublished,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.course) {
        const next = [data.course as CourseRecord, ...courses];
        setCourses(next);
        setSelectedCourseId(data.course.id);
        setCourseTitle("");
        setCourseDesc("");
        setCoursePublished(false);
        setShowCourseForm(false);
        setSuccessMsg("تم إنشاء الكورس بنجاح.");
      } else {
        setError(data?.error || "تعذر إنشاء الكورس.");
      }
    } catch {
      setError("حدث خطأ أثناء إنشاء الكورس.");
    } finally {
      setCreatingCourse(false);
    }
  };

  const handleToggleCoursePublish = async (course: CourseRecord) => {
    setError(null);
    const nextPublished = !course.is_published;
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: nextPublished }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === course.id ? { ...c, is_published: nextPublished } : c
          )
        );
      } else {
        setError(data?.error || "تعذر تحديث حالة الكورس.");
      }
    } catch {
      setError("تعذر تحديث حالة الكورس.");
    }
  };

  const handleDeleteCourse = async (course: CourseRecord) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف كورس "${course.title}" وكل دروسه وفيديوهاته نهائياً؟`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/courses/${course.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        const next = courses.filter((c) => c.id !== course.id);
        setCourses(next);
        if (selectedCourseId === course.id) {
          setSelectedCourseId(next[0]?.id || "");
        }
        setSuccessMsg("تم حذف الكورس وملفاته.");
      } else {
        setError(data?.error || "تعذر حذف الكورس.");
      }
    } catch {
      setError("تعذر حذف الكورس.");
    }
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !moduleTitle.trim() || creatingModule) return;
    setCreatingModule(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          title: moduleTitle.trim(),
          description: moduleDesc.trim(),
          sort_order: (selectedCourse.modules?.length || 0) + 1,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.module) {
        const created = data.module as CourseModuleRecord;
        setCourses((prev) =>
          prev.map((c) =>
            c.id === selectedCourse.id
              ? { ...c, modules: [...(c.modules || []), created] }
              : c
          )
        );
        setLessonModuleId(created.id);
        setLessonModule(created.title);
        setModuleTitle("");
        setModuleDesc("");
        setShowModuleForm(false);
        setSuccessMsg(`تم إنشاء فصل "${created.title}" بنجاح.`);
      } else {
        setError(data?.error || "تعذر إنشاء الفصل.");
      }
    } catch {
      setError("تعذر إنشاء الفصل.");
    } finally {
      setCreatingModule(false);
    }
  };

  const handleRenameModule = async (modId: string, currentTitle: string) => {
    if (!selectedCourse) return;
    const nextTitle = window.prompt("أدخل الاسم الجديد للفصل:", currentTitle);
    if (!nextTitle || nextTitle.trim().length < 2 || nextTitle.trim() === currentTitle) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/modules/${modId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: nextTitle.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === selectedCourse.id
              ? {
                  ...c,
                  modules: (c.modules || []).map((m) =>
                    m.id === modId ? { ...m, title: nextTitle.trim() } : m
                  ),
                  lessons: (c.lessons || []).map((l) =>
                    l.module_id === modId
                      ? { ...l, module_title: nextTitle.trim() }
                      : l
                  ),
                }
              : c
          )
        );
      } else {
        setError(data?.error || "تعذر تعديل اسم الفصل.");
      }
    } catch {
      setError("تعذر تعديل اسم الفصل.");
    }
  };

  const handleDeleteModule = async (modId: string, title: string) => {
    if (!selectedCourse) return;
    if (
      !window.confirm(
        `حذف فصل "${title}"؟ (الدروس الموجودة بداخله لن تُحذف بل ستنتقل إلى "عام").`
      )
    ) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/admin/modules/${modId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === selectedCourse.id
              ? {
                  ...c,
                  modules: (c.modules || []).filter((m) => m.id !== modId),
                  lessons: (c.lessons || []).map((l) =>
                    l.module_id === modId
                      ? { ...l, module_id: null, module_title: "عام" }
                      : l
                  ),
                }
              : c
          )
        );
      } else {
        setError(data?.error || "تعذر حذف الفصل.");
      }
    } catch {
      setError("تعذر حذف الفصل.");
    }
  };

  const handleCreateLessonAndUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !lessonTitle.trim() || uploading) return;

    setError(null);
    setSuccessMsg(null);

    if (selectedFiles.length === 0) {
      setError("يرجى اختيار ملف الفيديو (MP4 أو ملفات HLS) أولاً.");
      return;
    }

    if (videoMode === "hls") {
      const hasPlaylist = selectedFiles.some((f) =>
        f.name.toLowerCase().endsWith(".m3u8")
      );
      if (!hasPlaylist) {
        setError("في وضع HLS يجب تحديد ملف index.m3u8 مع ملفات .ts.");
        return;
      }
      const forbiddenKey = selectedFiles.some((f) =>
        f.name.toLowerCase().endsWith(".key")
      );
      if (forbiddenKey) {
        setError(
          "لا تحدد ملف enc.key للرفع! فقط الصق مفتاح Hex في الحقل المخصص ليتم حفظه في قاعدة البيانات."
        );
        return;
      }
    }

    setUploading(true);
    setUploadPct(2);
    setUploadStage("جاري إنشاء سجل الدرس...");

    try {
      // 1. Create lesson record first to get lessonId
      const createRes = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          module_id: lessonModuleId || null,
          module_title: lessonModule.trim() || "المقدمة",
          title: lessonTitle.trim(),
          description: lessonDesc.trim(),
          sort_order: lessonOrder,
          video_type: videoMode,
          hls_key_hex: videoMode === "hls" ? hlsKeyHex.trim() : "",
          is_published: true,
        }),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok || !createData?.ok || !createData.lesson) {
        throw new Error(createData?.error || "تعذر إنشاء الدرس.");
      }

      const createdLesson = createData.lesson as LessonRecord;

      // 2. Request R2 presigned PUT URLs
      setUploadStage("جاري تجهيز روابط الرفع الآمنة إلى Cloudflare R2...");
      setUploadPct(8);

      const signRes = await fetch("/api/admin/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: selectedCourse.id,
          lessonId: createdLesson.id,
          files: selectedFiles.map((f) => ({
            name: f.name,
            contentType: f.type || undefined,
          })),
        }),
      });
      const signData = await signRes.json().catch(() => ({}));
      if (!signRes.ok || !signData?.ok || !Array.isArray(signData.uploads)) {
        // Rollback empty lesson if R2 signing failed
        await fetch(`/api/admin/lessons/${createdLesson.id}`, {
          method: "DELETE",
        });
        throw new Error(signData?.error || "تعذر تجهيز روابط الرفع إلى R2.");
      }

      const uploads = signData.uploads as {
        originalName: string;
        safeName: string;
        key: string;
        contentType: string;
        uploadUrl: string;
      }[];

      // 3. Direct browser -> R2 upload with progress tracking
      const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0) || 1;
      let uploadedBytesBeforeCurrent = 0;

      for (let i = 0; i < uploads.length; i += 1) {
        const target = uploads[i];
        const file = selectedFiles[i];
        setUploadStage(
          `جاري رفع الملف ${i + 1} من ${uploads.length} (${file.name})...`
        );

        await uploadFileWithProgress(
          target.uploadUrl,
          file,
          target.contentType,
          (loaded) => {
            const pct = Math.min(
              95,
              Math.round(
                10 + ((uploadedBytesBeforeCurrent + loaded) / totalBytes) * 85
              )
            );
            setUploadPct(pct);
          }
        );

        uploadedBytesBeforeCurrent += file.size;
      }

      // 4. Determine primary r2_key (index.m3u8 for HLS, or the mp4 file)
      const primaryUpload =
        videoMode === "hls"
          ? uploads.find((u) => u.safeName.toLowerCase().endsWith(".m3u8")) ||
            uploads[0]
          : uploads[0];

      setUploadStage("جاري ربط الفيديو بالدرس...");
      setUploadPct(98);

      const patchRes = await fetch(`/api/admin/lessons/${createdLesson.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          r2_key: primaryUpload.key,
        }),
      });
      const patchData = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok || !patchData?.ok) {
        throw new Error(patchData?.error || "تعذر حفظ مسار الفيديو.");
      }

      const finalLesson = patchData.lesson as LessonRecord;

      setCourses((prev) =>
        prev.map((c) =>
          c.id === selectedCourse.id
            ? { ...c, lessons: [...(c.lessons || []), finalLesson] }
            : c
        )
      );

      setUploadPct(100);
      setLessonTitle("");
      setLessonDesc("");
      setHlsKeyHex("");
      setSelectedFiles([]);
      setLessonOrder((prev) => prev + 1);
      setShowLessonForm(false);
      setSuccessMsg("تم رفع الفيديو وربطه بالدرس بنجاح!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع الفيديو.");
    } finally {
      setUploading(false);
      setUploadStage("");
      setUploadPct(0);
    }
  };

  const handleDeleteLesson = async (courseId: string, lesson: LessonRecord) => {
    if (!window.confirm(`هل أنت متأكد من حذف درس "${lesson.title}"؟`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setCourses((prev) =>
          prev.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  lessons: (c.lessons || []).filter((l) => l.id !== lesson.id),
                }
              : c
          )
        );
      } else {
        setError(data?.error || "تعذر حذف الدرس.");
      }
    } catch {
      setError("تعذر حذف الدرس.");
    }
  };

  const handlePreviewLesson = async (lesson: LessonRecord) => {
    setLoadingPreviewId(lesson.id);
    setError(null);
    try {
      const res = await fetch(`/api/courses/lessons/${lesson.id}/playback`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok && data.src) {
        setPreviewData({
          title: lesson.title,
          src: data.src,
          isHls: data.videoType === "hls",
          watermarkText: data.watermarkText || "Admin Preview",
        });
      } else {
        setError(data?.error || "تعذر تشغيل المعاينة.");
      }
    } catch {
      setError("تعذر تشغيل المعاينة.");
    } finally {
      setLoadingPreviewId(null);
    }
  };

  return (
    <div className="admin-tab-stack">
      {/* R2 Setup Notice if missing */}
      {!r2Configured && (
        <div className="admin-alert is-warning" role="status">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Cloudflare R2 غير مربوط بعد:</strong> يمكنك إنشاء الكورسات
            الآن، ولتفعيل رفع وتشغيل الفيديوهات أضف المتغيرات التالية في{" "}
            <code dir="ltr">.env.local</code> (و Vercel):{" "}
            <code dir="ltr">R2_ACCOUNT_ID</code>،{" "}
            <code dir="ltr">R2_ACCESS_KEY_ID</code>،{" "}
            <code dir="ltr">R2_SECRET_ACCESS_KEY</code>،{" "}
            <code dir="ltr">R2_BUCKET_NAME</code>.
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

      {/* KPI Row */}
      <section className="admin-kpi-grid" aria-label="إحصائيات الكورسات">
        <div className="admin-kpi-card">
          <div className="admin-kpi-head">
            <span>إجمالي الكورسات</span>
            <span className="admin-kpi-icon">
              <BookOpen size={17} />
            </span>
          </div>
          <div className="admin-kpi-value">{courses.length}</div>
          <div className="admin-kpi-foot">منشور حالياً: {publishedCoursesCount}</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-head">
            <span>إجمالي الدروس المرفوعة</span>
            <span className="admin-kpi-icon">
              <Video size={17} />
            </span>
          </div>
          <div className="admin-kpi-value">{totalLessons}</div>
          <div className="admin-kpi-foot">محمية عبر Cloudflare R2 Private</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-head">
            <span>حالة تخزين R2</span>
            <span className="admin-kpi-icon">
              <ShieldCheck size={17} />
            </span>
          </div>
          <div className="admin-kpi-value" style={{ fontSize: 22 }}>
            {r2Configured ? "متصل وآمن" : "بانتظار الربط"}
          </div>
          <div className="admin-kpi-foot">تشفير HLS AES-128 + Watermark</div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-head">
            <span>سكريبت التشفير السريع</span>
            <span className="admin-kpi-icon">
              <Lock size={17} />
            </span>
          </div>
          <div className="admin-kpi-value" style={{ fontSize: 15 }} dir="ltr">
            scripts/encrypt-hls.ps1
          </div>
          <div className="admin-kpi-foot">يحوّل أي MP4 إلى HLS مشفر بضغطة</div>
        </div>
      </section>

      {/* Main Split: Courses List + Selected Course Lessons */}
      <div className="admin-courses-grid">
        {/* Left: Courses Sidebar */}
        <section className="admin-panel">
          <div className="admin-panel-head">
            <h2 className="admin-panel-title">
              <Layers size={16} />
              <span>الكورسات ({courses.length})</span>
            </h2>
            <button
              type="button"
              className="admin-btn-accent"
              onClick={() => setShowCourseForm((v) => !v)}
            >
              {showCourseForm ? <X size={15} /> : <Plus size={15} />}
              <span>{showCourseForm ? "إغلاق" : "كورس جديد"}</span>
            </button>
          </div>

          {showCourseForm && (
            <form className="admin-inline-form" onSubmit={handleCreateCourse}>
              <div className="admin-field">
                <label>عنوان الكورس</label>
                <input
                  type="text"
                  className="admin-input no-start-icon no-end-icon"
                  placeholder="مثال: أساسيات بناء المواقع بـ AI"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  required
                />
              </div>
              <div className="admin-field">
                <label>وصف مختصر</label>
                <textarea
                  className="admin-textarea"
                  rows={2}
                  placeholder="ماذا سيتعلم الطالب في هذا الكورس؟"
                  value={courseDesc}
                  onChange={(e) => setCourseDesc(e.target.value)}
                />
              </div>
              <label className="admin-check-row">
                <input
                  type="checkbox"
                  checked={coursePublished}
                  onChange={(e) => setCoursePublished(e.target.checked)}
                />
                <span>نشر الكورس للطلاب مباشرة</span>
              </label>
              <button
                type="submit"
                className="admin-btn-primary"
                disabled={creatingCourse}
              >
                {creatingCourse ? (
                  <Loader2 size={16} className="admin-spin" />
                ) : (
                  <Plus size={16} />
                )}
                <span>حفظ الكورس</span>
              </button>
            </form>
          )}

          {courses.length === 0 ? (
            <div className="admin-empty">
              <BookOpen size={28} />
              <p>لم تقم بإنشاء أي كورس بعد. اضغط &quot;كورس جديد&quot; للبدء.</p>
            </div>
          ) : (
            <div className="admin-course-list">
              {courses.map((course) => {
                const active = course.id === selectedCourseId;
                return (
                  <div
                    key={course.id}
                    className={`admin-course-item${active ? " is-active" : ""}`}
                    onClick={() => setSelectedCourseId(course.id)}
                  >
                    <div className="admin-course-item-main">
                      <div className="admin-course-item-title">{course.title}</div>
                      <div className="admin-course-item-meta">
                        <span>{course.lessons?.length || 0} دروس</span>
                        <span
                          className={`admin-badge ${
                            course.is_published ? "is-enrolled" : "is-archived"
                          }`}
                        >
                          {course.is_published ? "منشور" : "مسودة"}
                        </span>
                      </div>
                    </div>
                    <div
                      className="admin-course-item-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="admin-icon-btn"
                        title={
                          course.is_published ? "إخفاء الكورس" : "نشر الكورس"
                        }
                        onClick={() => handleToggleCoursePublish(course)}
                      >
                        {course.is_published ? (
                          <Eye size={15} />
                        ) : (
                          <EyeOff size={15} />
                        )}
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn is-danger"
                        title="حذف الكورس"
                        onClick={() => handleDeleteCourse(course)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Selected Course Lessons + Upload */}
        <section className="admin-panel">
          {!selectedCourse ? (
            <div className="admin-empty">
              <Video size={30} />
              <p>اختر كورساً من القائمة لإدارة دروسه ورفع الفيديوهات.</p>
            </div>
          ) : (
            <>
              <div className="admin-panel-head">
                <div>
                  <h2 className="admin-panel-title">{selectedCourse.title}</h2>
                  {selectedCourse.description && (
                    <p className="admin-panel-sub">{selectedCourse.description}</p>
                  )}
                </div>
                <div className="admin-row-actions">
                  <button
                    type="button"
                    className="admin-btn-secondary"
                    onClick={() => {
                      setShowModuleForm((v) => !v);
                      setShowLessonForm(false);
                    }}
                  >
                    {showModuleForm ? <X size={15} /> : <FolderPlus size={15} />}
                    <span>{showModuleForm ? "إغلاق" : "فصل جديد"}</span>
                  </button>
                  <button
                    type="button"
                    className="admin-btn-accent"
                    onClick={() => {
                      setLessonOrder((selectedCourse.lessons?.length || 0) + 1);
                      const firstMod = selectedCourse.modules?.[0];
                      if (firstMod && !lessonModuleId) {
                        setLessonModuleId(firstMod.id);
                        setLessonModule(firstMod.title);
                      }
                      setShowLessonForm((v) => !v);
                      setShowModuleForm(false);
                    }}
                  >
                    {showLessonForm ? <X size={15} /> : <Upload size={15} />}
                    <span>{showLessonForm ? "إغلاق" : "رفع درس جديد"}</span>
                  </button>
                </div>
              </div>

              {showModuleForm && (
                <form className="admin-inline-form" onSubmit={handleCreateModule}>
                  <div className="admin-form-row-2">
                    <div className="admin-field">
                      <label>اسم الفصل / المجموعة</label>
                      <input
                        type="text"
                        className="admin-input no-start-icon no-end-icon"
                        placeholder="مثال: أساسيات الـ AI"
                        value={moduleTitle}
                        onChange={(e) => setModuleTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>وصف الفصل (اختياري)</label>
                      <input
                        type="text"
                        className="admin-input no-start-icon no-end-icon"
                        placeholder="مثال: مدخل عملي قبل بناء المشاريع"
                        value={moduleDesc}
                        onChange={(e) => setModuleDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={creatingModule}
                  >
                    {creatingModule ? (
                      <Loader2 size={16} className="admin-spin" />
                    ) : (
                      <FolderPlus size={16} />
                    )}
                    <span>حفظ الفصل</span>
                  </button>
                </form>
              )}

              {showLessonForm && (
                <form
                  className="admin-inline-form"
                  onSubmit={handleCreateLessonAndUpload}
                >
                  <div className="admin-form-row-2">
                    <div className="admin-field">
                      <label>عنوان الدرس</label>
                      <input
                        type="text"
                        className="admin-input no-start-icon no-end-icon"
                        placeholder="مثال: الدرس الأول — تجهيز بيئة العمل"
                        value={lessonTitle}
                        onChange={(e) => setLessonTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="admin-field">
                      <label>الفصل / المجموعة</label>
                      {(selectedCourse.modules?.length || 0) > 0 ? (
                        <select
                          className="admin-select"
                          value={lessonModuleId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setLessonModuleId(id);
                            const found = selectedCourse.modules?.find(
                              (m) => m.id === id
                            );
                            if (found) setLessonModule(found.title);
                          }}
                        >
                          <option value="">-- عام / بدون فصل --</option>
                          {(selectedCourse.modules || []).map((mod) => (
                            <option key={mod.id} value={mod.id}>
                              {mod.title}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="admin-input no-start-icon no-end-icon"
                          placeholder="مثال: أساسيات الـ AI"
                          value={lessonModule}
                          onChange={(e) => setLessonModule(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="admin-form-row-2">
                    <div className="admin-field">
                      <label>وصف الدرس (اختياري)</label>
                      <input
                        type="text"
                        className="admin-input no-start-icon no-end-icon"
                        placeholder="ملخص سريع أو روابط مساعدة"
                        value={lessonDesc}
                        onChange={(e) => setLessonDesc(e.target.value)}
                      />
                    </div>
                    <div className="admin-field">
                      <label>ترتيب الدرس</label>
                      <input
                        type="number"
                        className="admin-input no-start-icon no-end-icon"
                        value={lessonOrder}
                        onChange={(e) =>
                          setLessonOrder(parseInt(e.target.value, 10) || 1)
                        }
                      />
                    </div>
                  </div>

                  {/* Video Mode Switcher */}
                  <div className="admin-field">
                    <label>طريقة الحماية والرفع إلى Cloudflare R2</label>
                    <div className="admin-mode-switch">
                      <button
                        type="button"
                        className={`admin-mode-btn${
                          videoMode === "hls" ? " is-active" : ""
                        }`}
                        onClick={() => {
                          setVideoMode("hls");
                          setSelectedFiles([]);
                        }}
                      >
                        <Lock size={15} />
                        <span>HLS مشفر AES-128 (أقصى حماية ضد IDM)</span>
                      </button>
                      <button
                        type="button"
                        className={`admin-mode-btn${
                          videoMode === "mp4" ? " is-active" : ""
                        }`}
                        onClick={() => {
                          setVideoMode("mp4");
                          setSelectedFiles([]);
                        }}
                      >
                        <FileVideo size={15} />
                        <span>MP4 مباشر (سريع + روابط مؤقتة)</span>
                      </button>
                    </div>
                  </div>

                  {videoMode === "hls" ? (
                    <>
                      <div className="admin-field">
                        <label>
                          ملفات HLS (حدد <code>index.m3u8</code> وكل ملفات{" "}
                          <code>seg_*.ts</code> — بدون ملف <code>enc.key</code>)
                        </label>
                        <label className="admin-dropzone">
                          <FolderUp size={20} />
                          <span>
                            {selectedFiles.length > 0
                              ? `تم تحديد ${selectedFiles.length} ملف جاهز للرفع`
                              : "اضغط لاختيار ملفات index.m3u8 و seg_*.ts"}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept=".m3u8,.ts,.m4s"
                            style={{ display: "none" }}
                            onChange={(e) =>
                              setSelectedFiles(Array.from(e.target.files || []))
                            }
                          />
                        </label>
                      </div>
                      <div className="admin-field">
                        <label>
                          مفتاح التشفير AES-128 (من ملف{" "}
                          <code>enc.key.hex</code> — 32 حرف Hex، يُحفظ في قاعدة
                          البيانات فقط)
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          className="admin-input no-start-icon no-end-icon"
                          placeholder="مثال: 4f8a9c12... (اختياري لو HLS غير مشفر)"
                          value={hlsKeyHex}
                          onChange={(e) => setHlsKeyHex(e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="admin-field">
                      <label>ملف الفيديو (MP4 / WebM)</label>
                      <label className="admin-dropzone">
                        <FileVideo size={20} />
                        <span>
                          {selectedFiles[0]
                            ? `${selectedFiles[0].name} (${(
                                selectedFiles[0].size /
                                (1024 * 1024)
                              ).toFixed(1)} MB)`
                            : "اضغط لاختيار ملف MP4 للرفع المباشر إلى R2"}
                        </span>
                        <input
                          type="file"
                          accept="video/mp4,video/webm"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setSelectedFiles(
                              e.target.files?.[0] ? [e.target.files[0]] : []
                            )
                          }
                        />
                      </label>
                    </div>
                  )}

                  {uploading && (
                    <div className="admin-progress-box">
                      <div className="admin-progress-head">
                        <span>{uploadStage}</span>
                        <span dir="ltr">{uploadPct}%</span>
                      </div>
                      <div className="admin-progress-track">
                        <div
                          className="admin-progress-fill"
                          style={{ width: `${uploadPct}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="admin-btn-primary"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 size={16} className="admin-spin" />
                    ) : (
                      <Upload size={16} />
                    )}
                    <span>
                      {uploading
                        ? `جاري الرفع (${uploadPct}%)...`
                        : "رفع الفيديو وحفظ الدرس"}
                    </span>
                  </button>
                </form>
              )}

              {/* Modules & Lessons grouped view */}
              {groupedModules.length === 0 ? (
                <div className="admin-empty">
                  <FolderPlus size={26} />
                  <p>
                    ابدأ بإنشاء فصل (مثل: أساسيات الـ AI) ثم ارفع الفيديوهات
                    بداخله.
                  </p>
                </div>
              ) : (
                <div className="admin-modules-stack">
                  {groupedModules.map((group) => (
                    <div
                      key={group.id || `legacy-${group.title}`}
                      className="admin-module-card"
                    >
                      <div className="admin-module-card-head">
                        <div>
                          <div className="admin-module-card-title">
                            <Layers size={15} />
                            <span>{group.title}</span>
                            <span className="admin-pill-mini">
                              {group.lessons.length} دروس
                            </span>
                          </div>
                          {group.description && (
                            <p className="admin-module-card-desc">
                              {group.description}
                            </p>
                          )}
                        </div>

                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            onClick={() => {
                              setLessonModuleId(group.id || "");
                              setLessonModule(group.title);
                              setLessonOrder(
                                (selectedCourse.lessons?.length || 0) + 1
                              );
                              setShowLessonForm(true);
                              setShowModuleForm(false);
                            }}
                          >
                            <Plus size={14} />
                            <span>رفع فيديو هنا</span>
                          </button>

                          {group.id && (
                            <>
                              <button
                                type="button"
                                className="admin-icon-btn"
                                title="تعديل اسم الفصل"
                                onClick={() =>
                                  handleRenameModule(group.id!, group.title)
                                }
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn is-danger"
                                title="حذف الفصل"
                                onClick={() =>
                                  handleDeleteModule(group.id!, group.title)
                                }
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {group.lessons.length === 0 ? (
                        <div className="admin-module-empty">
                          لا توجد فيديوهات في هذا الفصل بعد — اضغط &quot;رفع فيديو
                          هنا&quot; لإضافة أول درس.
                        </div>
                      ) : (
                        <div className="admin-lesson-list">
                          {group.lessons.map((lesson, idx) => (
                            <div key={lesson.id} className="admin-lesson-row">
                              <div className="admin-lesson-num">{idx + 1}</div>
                              <div className="admin-lesson-info">
                                <div className="admin-lesson-title">
                                  {lesson.title}
                                </div>
                                <div className="admin-lesson-meta">
                                  <span className="admin-pill-mini">
                                    {lesson.video_type === "hls"
                                      ? lesson.has_hls_encryption
                                        ? "HLS مشفر AES-128"
                                        : "HLS"
                                      : "MP4 محمي"}
                                  </span>
                                  {!lesson.has_video && (
                                    <span className="admin-badge is-archived">
                                      بدون فيديو
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="admin-lesson-actions">
                                {lesson.has_video && (
                                  <button
                                    type="button"
                                    className="admin-btn-secondary"
                                    onClick={() => handlePreviewLesson(lesson)}
                                    disabled={loadingPreviewId === lesson.id}
                                  >
                                    {loadingPreviewId === lesson.id ? (
                                      <Loader2
                                        size={14}
                                        className="admin-spin"
                                      />
                                    ) : (
                                      <Play size={14} />
                                    )}
                                    <span>معاينة</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="admin-icon-btn is-danger"
                                  title="حذف الدرس"
                                  onClick={() =>
                                    handleDeleteLesson(
                                      selectedCourse.id,
                                      lesson
                                    )
                                  }
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Protected Preview Modal */}
      {previewData && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setPreviewData(null)}
        >
          <div
            className="admin-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-panel-head" style={{ marginBottom: 14 }}>
              <h3 className="admin-panel-title">{previewData.title}</h3>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setPreviewData(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ borderRadius: 14, overflow: "hidden" }}>
              <VideoPlayer
                src={previewData.src}
                isEn={false}
                autoPlay={true}
                loop={false}
                isHls={previewData.isHls}
                watermarkText={previewData.watermarkText}
                protectedMode={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
