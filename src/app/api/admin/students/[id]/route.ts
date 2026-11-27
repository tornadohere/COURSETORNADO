import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { verifySameOrigin } from "@/lib/security/request-guard";

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
    full_name?: string;
    is_active?: boolean;
    is_muted?: boolean;
    force_logout?: boolean;
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
        { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      );
    }
    const service = createSupabaseServiceClient();
    if (!service) {
      return NextResponse.json(
        {
          ok: false,
          error: "SUPABASE_SERVICE_ROLE_KEY مطلوب لتغيير كلمة مرور الطالب",
        },
        { status: 503 }
      );
    }
    const { error: pwErr } = await service.auth.admin.updateUserById(id, {
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
    updates.full_name = body.full_name.trim().slice(0, 120);
  }
  if (typeof body.is_active === "boolean") {
    updates.is_active = body.is_active;
  }
  if (typeof body.is_muted === "boolean") {
    updates.is_muted = body.is_muted;
  }
  if (body.force_logout) {
    updates.active_session_token = `revoked-${Date.now()}`;
  }

  if (Object.keys(updates).length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
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

    return NextResponse.json({ ok: true, student: data });
  }

  return NextResponse.json({ ok: true });
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
  if (!session.isAdmin || !session.profile) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  if (id === session.profile.id) {
    return NextResponse.json(
      { ok: false, error: "لا يمكنك حذف حساب الأدمن الخاص بك" },
      { status: 400 }
    );
  }

  const service = createSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      {
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY مطلوب لحذف حسابات الطلاب",
      },
      { status: 503 }
    );
  }

  const { error } = await service.auth.admin.deleteUser(id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
