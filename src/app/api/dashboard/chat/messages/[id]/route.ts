import { NextResponse } from "next/server";
import { getMemberSession } from "@/lib/supabase/member-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifySameOrigin } from "@/lib/security/request-guard";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
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

  const { id } = await context.params;
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase unavailable" },
      { status: 503 }
    );
  }

  const { error } = await supabase.from("chat_messages").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
