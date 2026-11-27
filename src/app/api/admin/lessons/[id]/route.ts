import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import { deleteR2Prefix } from "@/lib/r2/client";
import type { LessonRecord, LessonVideoType } from "@/lib/supabase/types";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase unavailable" },
      { status: 503 }
    );
  }

  let body: {
    module_id?: string | null;
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

  const updates: Record<string, unknown> = {};
  if (body.module_id !== undefined) {
    updates.module_id = body.module_id || null;
  }
  if (typeof body.module_title === "string") {
    updates.module_title = body.module_title.trim().slice(0, 120) || "المقدمة";
  }
  if (typeof body.title === "string" && body.title.trim().length >= 2) {
    updates.title = body.title.trim().slice(0, 180);
  }
  if (typeof body.description === "string") {
    updates.description = body.description.trim().slice(0, 2000);
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    updates.sort_order = Math.floor(body.sort_order);
  }
  if (
    typeof body.duration_seconds === "number" &&
    Number.isFinite(body.duration_seconds)
  ) {
    updates.duration_seconds = Math.max(0, Math.floor(body.duration_seconds));
  }
  if (body.video_type === "hls" || body.video_type === "mp4") {
    updates.video_type = body.video_type;
  }
  if (typeof body.r2_key === "string") {
    updates.r2_key = body.r2_key.trim().slice(0, 500);
  }
  if (typeof body.hls_key_hex === "string") {
    const clean = body.hls_key_hex.trim().toLowerCase();
    if (clean && !/^[0-9a-f]{32}$/.test(clean)) {
      return NextResponse.json(
        {
          ok: false,
          error: "مفتاح تشفير AES-128 يجب أن يكون 32 حرفاً بصيغة Hex",
        },
        { status: 400 }
      );
    }
    updates.hls_key_hex = clean;
  }
  if (typeof body.is_published === "boolean") {
    updates.is_published = body.is_published;
  }

  const { data, error } = await supabase
    .from("course_lessons")
    .update(updates)
    .eq("id", id)
    .select(
      "id, course_id, module_id, module_title, title, description, sort_order, duration_seconds, video_type, r2_key, hls_key_hex, is_published, created_at, updated_at"
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
    module_id: data.module_id,
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

  return NextResponse.json({ ok: true, lesson });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase unavailable" },
      { status: 503 }
    );
  }

  const { data: existing } = await supabase
    .from("course_lessons")
    .select("id, course_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("course_lessons").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  if (existing?.course_id) {
    try {
      await deleteR2Prefix(`courses/${existing.course_id}/${id}/`);
    } catch {
      // Ignore R2 cleanup error if unconfigured
    }
  }

  return NextResponse.json({ ok: true });
}
