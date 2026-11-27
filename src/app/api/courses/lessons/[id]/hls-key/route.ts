import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getMemberSession();
  if (!session.authenticated || !session.profile) {
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return new NextResponse("Service Unavailable", { status: 503 });
  }

  const { data: lesson, error } = await supabase
    .from("course_lessons")
    .select("id, hls_key_hex, is_published")
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !lesson ||
    !lesson.hls_key_hex ||
    (!lesson.is_published && !session.isAdmin)
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const hex = lesson.hls_key_hex.trim();
  if (!/^[0-9a-fA-F]{32}$/.test(hex)) {
    return new NextResponse("Invalid Key", { status: 500 });
  }

  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": "16",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
