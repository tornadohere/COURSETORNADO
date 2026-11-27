import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";
import type { CourseModuleRecord } from "@/lib/supabase/types";

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
    course_id?: string;
    title?: string;
    description?: string;
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

  const course_id = (body.course_id || "").trim();
  const title = (body.title || "").trim();
  if (!course_id || title.length < 2 || title.length > 160) {
    return NextResponse.json(
      { ok: false, error: "اسم الفصل يجب أن يكون بين حرفين و160 حرفاً" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("course_modules")
    .insert({
      course_id,
      title,
      description: (body.description || "").trim().slice(0, 600),
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
    { ok: true, module: data as CourseModuleRecord },
    { status: 201 }
  );
}
