import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getClientIp,
  rateLimitResponse,
  verifySameOrigin,
} from "@/lib/security/request-guard";
import type { WaitlistEntry, WaitlistStats, WaitlistStatus } from "@/lib/supabase/types";

const VALID_STATUSES: WaitlistStatus[] = [
  "new",
  "contacted",
  "enrolled",
  "archived",
];

function computeStats(entries: WaitlistEntry[]): WaitlistStats {
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let today = 0;
  let last7Days = 0;
  let newCount = 0;
  let contactedCount = 0;
  let enrolledCount = 0;
  let archivedCount = 0;

  for (const item of entries) {
    const createdMs = new Date(item.created_at).getTime();
    if (createdMs >= startOfToday) today += 1;
    if (createdMs >= sevenDaysAgo) last7Days += 1;

    switch (item.status) {
      case "new":
        newCount += 1;
        break;
      case "contacted":
        contactedCount += 1;
        break;
      case "enrolled":
        enrolledCount += 1;
        break;
      case "archived":
        archivedCount += 1;
        break;
    }
  }

  return {
    total: entries.length,
    today,
    last7Days,
    newCount,
    contactedCount,
    enrolledCount,
    archivedCount,
  };
}

export async function GET(req: Request) {
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

  const { data: allRows, error } = await supabase
    .from("waitlist_entries")
    .select(
      "id, name, phone, status, notes, source, launch_date, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  const entries = (allRows ?? []) as WaitlistEntry[];
  const stats = computeStats(entries);

  const { searchParams } = new URL(req.url);
  const statusFilter = searchParams.get("status");
  const query = (searchParams.get("q") || "").trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (
      statusFilter &&
      statusFilter !== "all" &&
      VALID_STATUSES.includes(statusFilter as WaitlistStatus) &&
      entry.status !== statusFilter
    ) {
      return false;
    }

    if (query) {
      const matchesName = entry.name.toLowerCase().includes(query);
      const matchesPhone = entry.phone.toLowerCase().includes(query);
      const matchesNotes = entry.notes.toLowerCase().includes(query);
      return matchesName || matchesPhone || matchesNotes;
    }

    return true;
  });

  return NextResponse.json({
    ok: true,
    entries: filtered,
    stats,
  });
}

export async function POST(req: Request) {
  if (!verifySameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "Forbidden origin" },
      { status: 403 }
    );
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit({
    key: `admin-waitlist:${ip}`,
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

  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const notes = typeof body?.notes === "string" ? body.notes.trim() : "";

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "الاسم ورقم التليفون مطلوبين." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("waitlist_entries")
      .insert({
        name: name.slice(0, 120),
        phone: phone.slice(0, 40),
        notes: notes.slice(0, 1000),
        status: "new",
        source: "admin",
        launch_date: "2026-12-01",
      })
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

    return NextResponse.json({ ok: true, entry: data }, { status: 201 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "بيانات غير صالحة." },
      { status: 400 }
    );
  }
}
