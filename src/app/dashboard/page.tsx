import type { Metadata } from "next";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ChatChannelRecord,
  ChatMessageRecord,
  CourseModuleRecord,
  CourseRecord,
  ExclusiveVaultItem,
  LessonRecord,
} from "@/lib/supabase/types";
import { StudentLoginForm } from "@/components/dashboard/StudentLoginForm";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";
import "./dashboard.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "بوابة الطلاب — Tornado Academy",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StudentDashboardPage() {
  const session = await getMemberSession();

  if (!session.authenticated || !session.profile) {
    return (
      <StudentLoginForm
        isConfigured={session.configured}
        sessionMismatch={session.sessionMismatch}
        suspended={session.suspended}
      />
    );
  }

  const supabase = await createSupabaseServerClient();
  let courses: CourseRecord[] = [];
  let completedLessonIds: string[] = [];
  let channels: ChatChannelRecord[] = [];
  let initialMessages: ChatMessageRecord[] = [];
  let initialChannelId = "";
  let vaultItems: ExclusiveVaultItem[] = [];

  if (supabase) {
    const [coursesRes, modulesRes, lessonsRes, progressRes, channelsRes, vaultRes] =
      await Promise.all([
        supabase
          .from("courses")
          .select(
            "id, slug, title, description, thumbnail_url, sort_order, is_published, created_at, updated_at"
          )
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("course_modules")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("course_lessons")
          .select(
            "id, course_id, module_id, module_title, title, description, sort_order, duration_seconds, video_type, is_published, created_at, updated_at"
          )
          .eq("is_published", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("lesson_progress")
          .select("lesson_id")
          .eq("user_id", session.profile.id)
          .eq("completed", true),
        supabase
          .from("chat_channels")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("exclusive_vault_items")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
      ]);

    if (Array.isArray(coursesRes.data)) {
      const modulesByCourse = new Map<string, CourseModuleRecord[]>();
      if (Array.isArray(modulesRes.data)) {
        for (const mod of modulesRes.data as CourseModuleRecord[]) {
          const list = modulesByCourse.get(mod.course_id) || [];
          list.push(mod);
          modulesByCourse.set(mod.course_id, list);
        }
      }

      const lessonsByCourse = new Map<string, LessonRecord[]>();
      if (Array.isArray(lessonsRes.data)) {
        for (const row of lessonsRes.data) {
          const item = row as LessonRecord;
          const list = lessonsByCourse.get(item.course_id) || [];
          list.push(item);
          lessonsByCourse.set(item.course_id, list);
        }
      }
      courses = coursesRes.data.map((c) => ({
        ...(c as CourseRecord),
        modules: modulesByCourse.get(c.id) || [],
        lessons: lessonsByCourse.get(c.id) || [],
      }));
    }

    if (Array.isArray(progressRes.data)) {
      completedLessonIds = progressRes.data.map(
        (r) => (r as { lesson_id: string }).lesson_id
      );
    }

    if (Array.isArray(channelsRes.data)) {
      channels = channelsRes.data as ChatChannelRecord[];
      // Default to general chat if available, otherwise first channel
      const general = channels.find((c) => c.slug === "general") || channels[0];
      if (general) {
        initialChannelId = general.id;
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("channel_id", general.id)
          .order("created_at", { ascending: false })
          .limit(80);
        if (Array.isArray(msgs)) {
          initialMessages = (msgs as ChatMessageRecord[]).reverse();
        }
      }
    }

    if (Array.isArray(vaultRes.data)) {
      vaultItems = vaultRes.data as ExclusiveVaultItem[];
    }
  }

  return (
    <StudentDashboard
      initialProfile={session.profile}
      courses={courses}
      completedLessonIds={completedLessonIds}
      channels={channels}
      initialMessages={initialMessages}
      initialChannelId={initialChannelId}
      vaultItems={vaultItems}
    />
  );
}
