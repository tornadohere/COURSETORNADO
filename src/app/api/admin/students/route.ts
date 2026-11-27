import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { MemberProfile } from "@/lib/supabase/types";

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
    .from("profiles")
    .select(
      "id, email, full_name, role, bio, specialty, is_active, is_muted, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, students: (data || []) as MemberProfile[] },
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

  const service = createSupabaseServiceClient();
  if (!service) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "مفتاح SUPABASE_SERVICE_ROLE_KEY غير مضاف في متغيرات البيئة. أضفه لتفعيل إنشاء حسابات الطلاب.",
      },
      { status: 503 }
    );
  }

  let body: {
    email?: string;
    password?: string;
    full_name?: string;
    specialty?: string;
    waitlist_id?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const full_name = (body.full_name || "").trim().slice(0, 120);
  const specialty = (body.specialty || "").trim().slice(0, 120);

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "يرجى إدخال بريد إلكتروني صحيح" },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
      { status: 400 }
    );
  }

  const { data: created, error: createErr } =
    await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

  if (createErr || !created.user) {
    return NextResponse.json(
      { ok: false, error: createErr?.message || "تعذر إنشاء حساب الطالب" },
      { status: 400 }
    );
  }

  // Ensure profile is populated with full_name & specialty
  const { data: profile, error: profErr } = await service
    .from("profiles")
    .upsert(
      {
        id: created.user.id,
        email,
        full_name,
        specialty,
        role: "user",
        is_active: true,
        is_muted: false,
      },
      { onConflict: "id" }
    )
    .select(
      "id, email, full_name, role, bio, specialty, is_active, is_muted, created_at, updated_at"
    )
    .single();

  if (profErr) {
    return NextResponse.json(
      { ok: false, error: profErr.message },
      { status: 500 }
    );
  }

  // If created from a Waitlist entry, automatically mark it as enrolled
  if (body.waitlist_id) {
    await service
      .from("waitlist_entries")
      .update({ status: "enrolled" })
      .eq("id", body.waitlist_id);
  }

  return NextResponse.json(
    { ok: true, student: profile as MemberProfile },
    { status: 201 }
  );
}
