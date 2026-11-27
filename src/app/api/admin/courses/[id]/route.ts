import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import { deleteR2Prefix } from "@/lib/r2/client";

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
    title?: string;
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

  const updates: Record<string, unknown> = {};
  if (typeof body.title === "string" && body.title.trim().length >= 2) {
    updates.title = body.title.trim().slice(0, 180);
  }
  if (typeof body.description === "string") {
    updates.description = body.description.trim().slice(0, 2000);
  }
  if (typeof body.thumbnail_url === "string") {
    updates.thumbnail_url = body.thumbnail_url.trim().slice(0, 500);
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    updates.sort_order = Math.floor(body.sort_order);
  }
  if (typeof body.is_published === "boolean") {
    updates.is_published = body.is_published;
  }

  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
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

  return NextResponse.json({ ok: true, course: data });
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

  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  // Best-effort cleanup of R2 video files for this course
  try {
    await deleteR2Prefix(`courses/${id}/`);
  } catch {
    // Do not block deletion if R2 is not configured yet
  }

  return NextResponse.json({ ok: true });
}
