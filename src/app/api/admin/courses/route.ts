import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { CourseRecord, LessonRecord } from "@/lib/supabase/types";

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  return base || `course-${Date.now()}`;
}

export async function GET() {
  const session = await getAdminSession();
  if (!session.configured) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured" },
      { status: 503 }
    );
  }
  if (!session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase unavailable" },
      { status: 503 }
    );
  }

  const [{ data: courses, error: cErr }, { data: lessons, error: lErr }] =
    await Promise.all([
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
    ]);

  if (cErr) {
    return NextResponse.json(
      { ok: false, error: cErr.message },
      { status: 500 }
    );
  }
  if (lErr) {
    return NextResponse.json(
      { ok: false, error: lErr.message },
      { status: 500 }
    );
  }

  const lessonsByCourse = new Map<string, LessonRecord[]>();
  for (const row of lessons || []) {
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

  const enriched: CourseRecord[] = (courses || []).map((c) => ({
    ...(c as CourseRecord),
    lessons: lessonsByCourse.get(c.id) || [],
  }));

  return NextResponse.json(
    { ok: true, courses: enriched },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function POST(req: Request) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Invalid request origin" },
      { status: 403 }
    );
  }

  const session = await getAdminSession();
  if (!session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase unavailable" },
      { status: 503 }
    );
  }

  let body: {
    title?: string;
    slug?: string;
    description?: string;
    thumbnail_url?: string;
    sort_order?: number;
    is_published?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const title = (body.title || "").trim();
  if (title.length < 2 || title.length > 180) {
    return NextResponse.json(
      { ok: false, error: "عنوان الكورس يجب أن يكون بين حرفين و180 حرفاً" },
      { status: 400 }
    );
  }

  const slug = slugify(body.slug?.trim() || title);
  const description = (body.description || "").trim().slice(0, 2000);
  const thumbnail_url = (body.thumbnail_url || "").trim().slice(0, 500);
  const sort_order = Number.isFinite(body.sort_order)
    ? Math.floor(Number(body.sort_order))
    : 0;
  const is_published = Boolean(body.is_published);

  const { data, error } = await supabase
    .from("courses")
    .insert({
      title,
      slug,
      description,
      thumbnail_url,
      sort_order,
      is_published,
    })
    .select(
      "id, slug, title, description, thumbnail_url, sort_order, is_published, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { ok: true, course: { ...(data as CourseRecord), lessons: [] } },
    { status: 201 }
  );
}
