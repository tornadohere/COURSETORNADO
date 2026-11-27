import crypto from "crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { DEVICE_SESSION_COOKIE } from "@/lib/supabase/member-auth";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getClientIp,
  rateLimitResponse,
  verifySameOrigin,
} from "@/lib/security/request-guard";

export async function POST(req: Request) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Invalid request origin" },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit({
    key: `student-login:${ip}`,
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!limit.allowed) {
    return rateLimitResponse(
      limit.retryAfterSeconds,
      "تم تجاوز عدد محاولات الدخول. يرجى المحاولة لاحقاً."
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "إعدادات قاعدة البيانات غير مكتملة" },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "بيانات الدخول غير صالحة" },
      { status: 400 }
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "يرجى إدخال البريد الإلكتروني وكلمة المرور" },
      { status: 400 }
    );
  }

  const { data: authData, error: signInErr } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInErr || !authData.user) {
    return NextResponse.json(
      { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, error: "الحساب غير مفعّل في النظام" },
      { status: 403 }
    );
  }

  if (profile.role !== "admin" && !profile.is_active) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { ok: false, error: "تم إيقاف هذا الحساب. تواصل مع إدارة الأكاديمية." },
      { status: 403 }
    );
  }

  // Generate fresh single-device session token (invalidates any previous device)
  const sessionToken = crypto.randomBytes(24).toString("hex");
  const service = createSupabaseServiceClient();
  if (service) {
    await service
      .from("profiles")
      .update({ active_session_token: sessionToken })
      .eq("id", authData.user.id);
  } else {
    // Fallback to user's own update policy if service key isn't set yet
    await supabase
      .from("profiles")
      .update({ active_session_token: sessionToken })
      .eq("id", authData.user.id);
  }

  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  );

  response.cookies.set(DEVICE_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
