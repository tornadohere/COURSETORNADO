import type { Metadata } from "next";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/service";
import { getR2Config } from "@/lib/r2/client";
import type {
  ChatChannelRecord,
  CourseRecord,
  ExclusiveVaultItem,
  LessonRecord,
  MemberProfile,
  WaitlistEntry,
  WaitlistStats,
} from "@/lib/supabase/types";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Tornado Academy",
  robots: {
    index: false,
    follow: false,
  },
};

function computeStats(entries: WaitlistEntry[]): WaitlistStats {
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

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session.isAdmin || !session.profile) {
    return <AdminLoginForm isConfigured={session.configured} />;
  }

  const supabase = await createSupabaseServerClient();
  let entries: WaitlistEntry[] = [];
  let courses: CourseRecord[] = [];
  let students: MemberProfile[] = [];
  let vaultItems: ExclusiveVaultItem[] = [];
  let channels: ChatChannelRecord[] = [];

  if (supabase) {
    const [waitlistRes, coursesRes, lessonsRes, studentsRes, vaultRes, channelsRes] =
      await Promise.all([
        supabase
          .from("waitlist_entries")
          .select(
            "id, name, phone, status, notes, source, launch_date, created_at, updated_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("courses")
          .select(
            "id, slug, title, description, thumbnail_url, sort_order, is_published, created_at, updated_at"
          )
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("course_lessons")
          .select(
            "id, course_id, module_title, title, description, sort_order, duration_seconds, video_type, r2_key, hls_key_hex, is_published, created_at, updated_at"
          )
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
        supabase
          .from("profiles")
          .select(
            "id, email, full_name, role, bio, specialty, is_active, is_muted, created_at, updated_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("exclusive_vault_items")
          .select("*")
          .order("is_featured", { ascending: false })
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: false }),
        supabase
          .from("chat_channels")
          .select("*")
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (Array.isArray(waitlistRes.data)) {
      entries = waitlistRes.data as WaitlistEntry[];
    }

    if (Array.isArray(coursesRes.data)) {
      const lessonsByCourse = new Map<string, LessonRecord[]>();
      if (Array.isArray(lessonsRes.data)) {
        for (const row of lessonsRes.data) {
          const item: LessonRecord = {
            id: row.id,
            course_id: row.course_id,
            module_title: row.module_title,
            title: row.title,
            description: row.description,
            sort_order: row.sort_order,
            duration_seconds: row.duration_seconds,
            video_type: row.video_type,
            r2_key: row.r2_key,
            has_video: Boolean(row.r2_key),
            has_hls_encryption: Boolean(row.hls_key_hex),
            is_published: row.is_published,
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
          const list = lessonsByCourse.get(row.course_id) || [];
          list.push(item);
          lessonsByCourse.set(row.course_id, list);
        }
      }

      courses = coursesRes.data.map((c) => ({
        ...(c as CourseRecord),
        lessons: lessonsByCourse.get(c.id) || [],
      }));
    }

    if (Array.isArray(studentsRes.data)) {
      students = studentsRes.data as MemberProfile[];
    }

    if (Array.isArray(vaultRes.data)) {
      vaultItems = vaultRes.data as ExclusiveVaultItem[];
    }

    if (Array.isArray(channelsRes.data)) {
      channels = channelsRes.data as ChatChannelRecord[];
    }
  }

  const stats = computeStats(entries);

  return (
    <AdminDashboard
      profile={session.profile}
      initialEntries={entries}
      initialStats={stats}
      initialCourses={courses}
      initialStudents={students}
      initialVaultItems={vaultItems}
      initialChannels={channels}
      r2Configured={getR2Config().isConfigured}
      serviceRoleConfigured={isServiceRoleConfigured()}
    />
  );
}
