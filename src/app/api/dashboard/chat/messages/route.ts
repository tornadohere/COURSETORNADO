import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { rateLimitResponse, verifySameOrigin } from "@/lib/security/request-guard";
import type { ChatMessageRecord } from "@/lib/supabase/types";

export async function GET(req: Request) {
  const session = await getMemberSession();
  if (!session.authenticated || !session.profile) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const channelId = (searchParams.get("channelId") || "").trim();
  if (!channelId) {
    return NextResponse.json(
      { ok: false, error: "channelId is required" },
      { status: 400 }
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
    .from("chat_messages")
    .select("*")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const chronological = ((data || []) as ChatMessageRecord[]).reverse();
  return NextResponse.json(
    { ok: true, messages: chronological },
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

  const session = await getMemberSession();
  if (!session.authenticated || !session.profile) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (!session.isAdmin && session.profile.is_muted) {
    return NextResponse.json(
      { ok: false, error: "تم كتم حسابك مؤقتاً من الكتابة في الدردشة" },
      { status: 403 }
    );
  }

  const limit = checkRateLimit({
    key: `chat-msg:${session.profile.id}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!limit.allowed) {
    return rateLimitResponse(
      limit.retryAfterSeconds,
      "أرسلت رسائل كثيرة بسرعة. انتظر قليلاً."
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
    channel_id?: string;
    content?: string;
    reply_to_id?: string | null;
    reply_preview?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const channelId = (body.channel_id || "").trim();
  const content = (body.content || "").trim();
  if (!channelId || !content || content.length > 4000) {
    return NextResponse.json(
      { ok: false, error: "الرسالة فارغة أو أطول من الحد المسموح" },
      { status: 400 }
    );
  }

  const { data: channel } = await supabase
    .from("chat_channels")
    .select("id, is_readonly")
    .eq("id", channelId)
    .maybeSingle();

  if (!channel) {
    return NextResponse.json(
      { ok: false, error: "القناة غير موجودة" },
      { status: 404 }
    );
  }

  if (channel.is_readonly && !session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "هذه القناة للإعلانات والقراءة فقط" },
      { status: 403 }
    );
  }

  const authorName =
    session.profile.full_name?.trim() ||
    session.profile.email.split("@")[0] ||
    "عضو";

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      channel_id: channelId,
      user_id: session.profile.id,
      author_name: authorName,
      author_role: session.profile.role,
      content,
      reply_to_id: body.reply_to_id || null,
      reply_preview: (body.reply_preview || "").trim().slice(0, 140),
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
    { ok: true, message: data as ChatMessageRecord },
    { status: 201 }
  );
}
