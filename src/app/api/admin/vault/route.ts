import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type {
  ExclusiveVaultCategory,
  ExclusiveVaultItem,
  ExclusiveVaultType,
} from "@/lib/supabase/types";

const VALID_CATEGORIES: ExclusiveVaultCategory[] = [
  "coding",
  "video",
  "design",
  "marketing",
  "general",
];

export async function GET() {
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

  const { data, error } = await supabase
    .from("exclusive_vault_items")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, items: (data || []) as ExclusiveVaultItem[] },
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

  let body: Partial<ExclusiveVaultItem>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const title = (body.title || "").trim();
  if (title.length < 2) {
    return NextResponse.json(
      { ok: false, error: "يرجى إدخال عنوان الـ Skill أو البرومت" },
      { status: 400 }
    );
  }

  const type: ExclusiveVaultType = body.type === "skill" ? "skill" : "prompt";
  const category: ExclusiveVaultCategory = VALID_CATEGORIES.includes(
    body.category as ExclusiveVaultCategory
  )
    ? (body.category as ExclusiveVaultCategory)
    : "coding";

  const { data, error } = await supabase
    .from("exclusive_vault_items")
    .insert({
      type,
      category,
      title: title.slice(0, 180),
      tag: (body.tag || "").trim().slice(0, 80),
      description: (body.description || "").trim().slice(0, 1000),
      how_to: (body.how_to || "").trim().slice(0, 1000),
      file_name: (body.file_name || "tornado-skill.md").trim().slice(0, 120),
      install_cmd: (body.install_cmd || "").trim().slice(0, 400),
      content: (body.content || "").trim(),
      is_featured: Boolean(body.is_featured),
      sort_order: Number.isFinite(body.sort_order)
        ? Math.floor(Number(body.sort_order))
        : 0,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { ok: true, item: data as ExclusiveVaultItem },
    { status: 201 }
  );
}
