import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getClientIp,
  rateLimitResponse,
  verifySameOrigin,
} from "@/lib/security/request-guard";
import type { WaitlistStatus } from "@/lib/supabase/types";

const VALID_STATUSES: WaitlistStatus[] = [
  "new",
  "contacted",
  "enrolled",
  "archived",
];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden origin" },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit({
    key: `admin-waitlist-id:${ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  const session = await getAdminSession();
  if (!session.configured) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase client unavailable" },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing entry id" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const updates: Partial<{ status: WaitlistStatus; notes: string }> = {};

    if (typeof body?.status === "string") {
      if (!VALID_STATUSES.includes(body.status as WaitlistStatus)) {
        return NextResponse.json(
          { ok: false, error: "Invalid status value" },
          { status: 400 }
        );
      }
      updates.status = body.status as WaitlistStatus;
    }

    if (typeof body?.notes === "string") {
      updates.notes = body.notes.trim().slice(0, 1000);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("waitlist_entries")
      .update(updates)
      .eq("id", id)
      .select(
        "id, name, phone, status, notes, source, launch_date, created_at, updated_at"
      )
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, entry: data });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden origin" },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit({
    key: `admin-waitlist-id:${ip}`,
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limit.allowed) {
    return rateLimitResponse(limit.retryAfterSeconds);
  }

  const session = await getAdminSession();
  if (!session.configured) {
    return NextResponse.json(
      { ok: false, error: "Supabase is not configured" },
      { status: 503 }
    );
  }

  if (!session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Supabase client unavailable" },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing entry id" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("waitlist_entries")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id });
}
