import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { LessonRecord, LessonVideoType } from "@/lib/supabase/types";

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
    course_id?: string;
    module_title?: string;
    title?: string;
    description?: string;
    sort_order?: number;
    duration_seconds?: number;
    video_type?: LessonVideoType;
    r2_key?: string;
    hls_key_hex?: string;
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

  const course_id = (body.course_id || "").trim();
  const title = (body.title || "").trim();
  if (!course_id || title.length < 2) {
    return NextResponse.json(
      { ok: false, error: "يرجى إدخال عنوان الدرس والكورس المرتبط به" },
      { status: 400 }
    );
  }

  const video_type: LessonVideoType = body.video_type === "mp4" ? "mp4" : "hls";
  const hls_key_hex = (body.hls_key_hex || "").trim().toLowerCase();
  if (hls_key_hex && !/^[0-9a-f]{32}$/.test(hls_key_hex)) {
    return NextResponse.json(
      {
        ok: false,
        error: "مفتاح تشفير AES-128 يجب أن يكون 32 حرفاً بصيغة Hex",
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("course_lessons")
    .insert({
      course_id,
      module_title: (body.module_title || "المقدمة").trim().slice(0, 120),
      title: title.slice(0, 180),
      description: (body.description || "").trim().slice(0, 2000),
      sort_order: Number.isFinite(body.sort_order)
        ? Math.floor(Number(body.sort_order))
        : 0,
      duration_seconds: Number.isFinite(body.duration_seconds)
        ? Math.max(0, Math.floor(Number(body.duration_seconds)))
        : 0,
      video_type,
      r2_key: (body.r2_key || "").trim().slice(0, 500),
      hls_key_hex,
      is_published: body.is_published ?? true,
    })
    .select(
      "id, course_id, module_title, title, description, sort_order, duration_seconds, video_type, r2_key, hls_key_hex, is_published, created_at, updated_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  const lesson: LessonRecord = {
    id: data.id,
    course_id: data.course_id,
    module_title: data.module_title,
    title: data.title,
    description: data.description,
    sort_order: data.sort_order,
    duration_seconds: data.duration_seconds,
    video_type: data.video_type,
    r2_key: data.r2_key,
    has_video: Boolean(data.r2_key),
    has_hls_encryption: Boolean(data.hls_key_hex),
    is_published: data.is_published,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  return NextResponse.json({ ok: true, lesson }, { status: 201 });
}
