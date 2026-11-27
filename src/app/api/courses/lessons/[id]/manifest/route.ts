import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createR2PresignedReadUrl, getR2ObjectText } from "@/lib/r2/client";

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
    .select("id, video_type, r2_key, hls_key_hex, is_published")
    .eq("id", id)
    .maybeSingle();

  if (
    error ||
    !lesson ||
    !lesson.r2_key ||
    lesson.video_type !== "hls" ||
    (!lesson.is_published && !session.isAdmin)
  ) {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let manifestText: string | null = null;
  try {
    manifestText = await getR2ObjectText(lesson.r2_key);
  } catch {
    manifestText = null;
  }

  if (!manifestText) {
    return new NextResponse("Manifest unavailable", {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const lastSlash = lesson.r2_key.lastIndexOf("/");
  const baseDir = lastSlash >= 0 ? lesson.r2_key.slice(0, lastSlash + 1) : "";

  const lines = manifestText.split(/\r?\n/);
  const rewrittenLines = await Promise.all(
    lines.map(async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      // Rewrite AES-128 key URI to our authenticated server endpoint
      if (trimmed.startsWith("#EXT-X-KEY:")) {
        return trimmed.replace(
          /URI="[^"]*"/,
          `URI="/api/courses/lessons/${lesson.id}/hls-key"`
        );
      }

      // Keep other HLS directives untouched
      if (trimmed.startsWith("#")) {
        return line;
      }

      // Rewrite media segment filenames (e.g. seg_0001.ts) to short-lived R2 Presigned URLs
      const segmentName = trimmed.split("/").pop() || trimmed;
      const segmentKey = `${baseDir}${segmentName}`;
      const signed = await createR2PresignedReadUrl({
        key: segmentKey,
        expiresInSeconds: 300,
      });

      return signed || line;
    })
  );

  return new NextResponse(rewrittenLines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
