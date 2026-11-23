import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getClientIp,
  rateLimitResponse,
  verifySameOrigin,
} from "@/lib/security/request-guard";

export async function POST(req: Request) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden origin" },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit({
    key: `admin-login:${ip}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!limit.allowed) {
    return rateLimitResponse(
      limit.retryAfterSeconds,
      "محاولات تسجيل دخول كثيرة. يرجى الانتظار ثم المحاولة مرة أخرى."
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "إعدادات Supabase غير مفعّلة بعد. أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في .env.local",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password || email.length > 200 || password.length > 200) {
      return NextResponse.json(
        { ok: false, error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      const msg = (authError?.message || "").toLowerCase();
      if (msg.includes("invalid api key")) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "مفتاح Supabase (NEXT_PUBLIC_SUPABASE_ANON_KEY) غير صحيح. تأكد من نسخ الـ anon public key أو publishable key الصحيح.",
          },
          { status: 500 }
        );
      }
      if (msg.includes("email not confirmed")) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "الحساب غير مفعّل بعد. فعّل Auto Confirm User في Supabase ثم حاول مرة أخرى.",
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." },
        { status: 401 }
      );
    }

    const accessToken = authData.session?.access_token;
    const { url, anonKey } = getSupabaseConfig();
    const profileClient = accessToken
      ? createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        })
      : supabase;

    const { data: profile, error: profileError } = await profileClient
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      const reason = profileError
        ? `خطأ في قراءة الصلاحية: ${profileError.message}`
        : !profile
        ? "لم يتم العثور على سجل لهذا الحساب في جدول public.profiles."
        : `هذا الحساب لا يملك صلاحية الأدمن (الحالي: ${profile.role}).`;
      return NextResponse.json(
        {
          ok: false,
          error: reason,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile,
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "حدث خطأ غير متوقع أثناء تسجيل الدخول." },
      { status: 500 }
    );
  }
}
