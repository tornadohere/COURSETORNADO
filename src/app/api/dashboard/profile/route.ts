import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";

export async function PATCH(req: Request) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Invalid request origin" },
      { status: 403 }
    );
  }

  const session = await getMemberSession();
  if (!session.authenticated || !session.profile) {
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
    full_name?: string;
    specialty?: string;
    bio?: string;
    new_password?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (body.new_password) {
    if (body.new_password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }
    const { error: pwErr } = await supabase.auth.updateUser({
      password: body.new_password,
    });
    if (pwErr) {
      return NextResponse.json(
        { ok: false, error: pwErr.message },
        { status: 400 }
      );
    }
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.full_name === "string") {
    const clean = body.full_name.trim();
    if (clean.length < 2) {
      return NextResponse.json(
        { ok: false, error: "الاسم يجب أن يكون حرفين على الأقل" },
        { status: 400 }
      );
    }
    updates.full_name = clean.slice(0, 120);
  }
  if (typeof body.specialty === "string") {
    updates.specialty = body.specialty.trim().slice(0, 120);
  }
  if (typeof body.bio === "string") {
    updates.bio = body.bio.trim().slice(0, 500);
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.profile.id)
      .select(
        "id, email, full_name, role, bio, specialty, is_active, is_muted, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true, profile: data });
  }

  return NextResponse.json({ ok: true, profile: session.profile });
}
