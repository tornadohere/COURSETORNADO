import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { verifySameOrigin } from "@/lib/security/request-guard";
import { createR2PresignedUploadUrl, getR2Config } from "@/lib/r2/client";

const ALLOWED_EXTENSIONS = new Set([".mp4", ".webm", ".m3u8", ".ts", ".m4s"]);

function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

function getExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function defaultContentType(ext: string, provided?: string): string {
  if (ext === ".m3u8") return "application/vnd.apple.mpegurl";
  if (ext === ".ts") return "video/mp2t";
  if (ext === ".m4s") return "video/iso.segment";
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  return provided || "application/octet-stream";
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

  const r2Cfg = getR2Config();
  if (!r2Cfg.isConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "إعدادات تخزين الفيديو غير مكتملة. أضف S3_ENDPOINT و S3_REGION (لـ Backblaze B2) أو R2_ACCOUNT_ID (لـ Cloudflare R2)، بالإضافة إلى R2_ACCESS_KEY_ID و R2_SECRET_ACCESS_KEY و R2_BUCKET_NAME في .env.local.",
      },
      { status: 503 }
    );
  }

  let body: {
    courseId?: string;
    lessonId?: string;
    files?: { name: string; contentType?: string }[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const courseId = (body.courseId || "").replace(/[^a-zA-Z0-9-]/g, "");
  const lessonId = (body.lessonId || "").replace(/[^a-zA-Z0-9-]/g, "");
  const files = Array.isArray(body.files) ? body.files : [];

  if (!courseId || !lessonId || files.length === 0 || files.length > 800) {
    return NextResponse.json(
      { ok: false, error: "بيانات الرفع غير صالحة" },
      { status: 400 }
    );
  }

  const uploads: {
    originalName: string;
    safeName: string;
    key: string;
    contentType: string;
    uploadUrl: string;
  }[] = [];

  for (const file of files) {
    const safeName = sanitizeFilename(file.name);
    const ext = getExtension(safeName);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        {
          ok: false,
          error: `امتداد غير مسموح به: ${safeName}. المسموح فقط: .mp4, .webm, .m3u8, .ts, .m4s (ولا ترفع ملف .key إلى R2 أبداً).`,
        },
        { status: 400 }
      );
    }

    const key = `courses/${courseId}/${lessonId}/${safeName}`;
    const contentType = defaultContentType(ext, file.contentType);
    const uploadUrl = await createR2PresignedUploadUrl({
      key,
      contentType,
      expiresInSeconds: 3600,
    });

    if (!uploadUrl) {
      return NextResponse.json(
        { ok: false, error: "تعذر إنشاء رابط الرفع" },
        { status: 500 }
      );
    }

    uploads.push({
      originalName: file.name,
      safeName,
      key,
      contentType,
      uploadUrl,
    });
  }

  return NextResponse.json(
    { ok: true, uploads },
    { headers: { "Cache-Control": "no-store" } }
  );
}
