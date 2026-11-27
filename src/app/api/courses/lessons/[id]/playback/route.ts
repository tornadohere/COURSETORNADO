import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createR2PresignedReadUrl, getR2Config } from "@/lib/r2/client";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getMemberSession();
  if (!session.authenticated || !session.profile) {
    return NextResponse.json(
      {
        ok: false,
        error: session.sessionMismatch
          ? "تم تسجيل الدخول من جهاز آخر"
          : "غير مصرح لك بمشاهدة هذا الدرس",
        sessionMismatch: session.sessionMismatch,
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!getR2Config().isConfigured) {
    return NextResponse.json(
      { ok: false, error: "تخزين الفيديو (Cloudflare R2) غير مهيأ بعد" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
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

  const { data: lesson, error } = await supabase
    .from("course_lessons")
    .select("id, video_type, r2_key, is_published")
    .eq("id", id)
    .maybeSingle();

  if (error || !lesson) {
    return NextResponse.json(
      { ok: false, error: "الدرس غير موجود" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!lesson.is_published && !session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "هذا الدرس غير منشور حالياً" },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
  }

  if (!lesson.r2_key) {
    return NextResponse.json(
      { ok: false, error: "لم يتم رفع فيديو لهذا الدرس بعد" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const watermarkText = `${session.profile.full_name || "Member"} · ${session.profile.email}`;

  if (lesson.video_type === "hls") {
    return NextResponse.json(
      {
        ok: true,
        videoType: "hls",
        src: `/api/courses/lessons/${lesson.id}/manifest?t=${Date.now()}`,
        watermarkText,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const signedUrl = await createR2PresignedReadUrl({
    key: lesson.r2_key,
    expiresInSeconds: 180,
  });

  if (!signedUrl) {
    return NextResponse.json(
      { ok: false, error: "تعذر توليد رابط التشغيل المؤقت" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      videoType: "mp4",
      src: signedUrl,
      watermarkText,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
