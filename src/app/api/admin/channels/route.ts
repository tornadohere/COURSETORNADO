import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { ChatChannelRecord } from "@/lib/supabase/types";

function slugifyChannel(input: string): string {
  const base = input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
  return base || `room-${Date.now()}`;
}

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
    .from("chat_channels")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, channels: (data || []) as ChatChannelRecord[] },
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
    name?: string;
    slug?: string;
    description?: string;
    is_readonly?: boolean;
    sort_order?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const name = (body.name || "").trim();
  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "اسم القناة يجب أن يكون حرفين على الأقل" },
      { status: 400 }
    );
  }

  const slug = slugifyChannel(body.slug?.trim() || name);

  const { data, error } = await supabase
    .from("chat_channels")
    .insert({
      name: name.slice(0, 80),
      slug,
      description: (body.description || "").trim().slice(0, 300),
      is_readonly: Boolean(body.is_readonly),
      sort_order: Number.isFinite(body.sort_order)
        ? Math.floor(Number(body.sort_order))
        : 10,
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
    { ok: true, channel: data as ChatChannelRecord },
    { status: 201 }
  );
}
