import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { ExclusiveVaultItem } from "@/lib/supabase/types";

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

  let body: Partial<ExclusiveVaultItem>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.type === "prompt" || body.type === "skill") updates.type = body.type;
  if (typeof body.category === "string") updates.category = body.category;
  if (typeof body.title === "string" && body.title.trim().length >= 2) {
    updates.title = body.title.trim().slice(0, 180);
  }
  if (typeof body.tag === "string") updates.tag = body.tag.trim().slice(0, 80);
  if (typeof body.description === "string") {
    updates.description = body.description.trim().slice(0, 1000);
  }
  if (typeof body.how_to === "string") {
    updates.how_to = body.how_to.trim().slice(0, 1000);
  }
  if (typeof body.file_name === "string") {
    updates.file_name = body.file_name.trim().slice(0, 120);
  }
  if (typeof body.install_cmd === "string") {
    updates.install_cmd = body.install_cmd.trim().slice(0, 400);
  }
  if (typeof body.content === "string") updates.content = body.content.trim();
  if (typeof body.is_featured === "boolean") {
    updates.is_featured = body.is_featured;
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    updates.sort_order = Math.floor(body.sort_order);
  }

  const { data, error } = await supabase
    .from("exclusive_vault_items")
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

  return NextResponse.json({ ok: true, item: data as ExclusiveVaultItem });
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
    .from("exclusive_vault_items")
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
