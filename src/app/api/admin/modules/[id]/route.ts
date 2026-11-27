import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { CourseModuleRecord } from "@/lib/supabase/types";

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

  let body: { title?: string; description?: string; sort_order?: number };
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
    updates.title = body.title.trim().slice(0, 160);
  }
  if (typeof body.description === "string") {
    updates.description = body.description.trim().slice(0, 600);
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    updates.sort_order = Math.floor(body.sort_order);
  }

  const { data, error } = await supabase
    .from("course_modules")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  // Keep denormalized module_title in sync for all lessons under this module
  if (typeof updates.title === "string") {
    await supabase
      .from("course_lessons")
      .update({ module_title: updates.title })
      .eq("module_id", id);
  }

  return NextResponse.json({
    ok: true,
    module: data as CourseModuleRecord,
  });
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

  const { error } = await supabase
    .from("course_modules")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
