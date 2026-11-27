import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";

export async function POST(req: Request) {
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

  let body: { lesson_id?: string; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const lessonId = (body.lesson_id || "").trim();
  if (!lessonId) {
    return NextResponse.json(
      { ok: false, error: "lesson_id is required" },
      { status: 400 }
    );
  }

  const completed = Boolean(body.completed);

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: session.profile.id,
      lesson_id: lessonId,
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" }
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, lesson_id: lessonId, completed });
}
