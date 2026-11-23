import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  getClientIp,
  rateLimitResponse,
  verifySameOrigin,
} from "@/lib/security/request-guard";

function isValidPhone(phone: string): boolean {
  if (!/^\+?[0-9\s\-()]{7,30}$/.test(phone)) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 16;
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
    key: `waitlist:${ip}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!limit.allowed) {
    return rateLimitResponse(
      limit.retryAfterSeconds,
      "تم إرسال طلبات كثيرة من نفس الجهاز. يرجى المحاولة بعد قليل."
    );
  }

  try {
    const contentLength = Number(req.headers.get("content-length") || "0");
    if (contentLength > 4096) {
      return NextResponse.json(
        { ok: false, error: "Payload too large" },
        { status: 413 }
      );
    }

    const body = await req.json();

    // Honeypot trap for automated spam bots
    const honeypot =
      typeof body?.website === "string" ? body.website.trim() : "";
    if (honeypot.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    const source =
      typeof body?.source === "string" && body.source.trim()
        ? body.source.trim().slice(0, 40)
        : "landing";

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

    if (name.length > 120 || !isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid name and phone number" },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.from("waitlist_entries").insert({
        name,
        phone,
        status: "new",
        source,
        launch_date: "2026-12-01",
      });

      if (error) {
        console.error("[waitlist] Supabase insert error:", error.message);
        return NextResponse.json(
          { ok: false, error: "Failed to save waitlist entry" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        entry: {
          name,
          phone,
          launchDate: "2026-12-01",
          createdAt: new Date().toISOString(),
        },
      });
    }

    // Fallback when Supabase env vars are not yet configured locally
    const entry = {
      name,
      phone,
      launchDate: "2026-12-01",
      createdAt: new Date().toISOString(),
    };

    try {
      const filePath = path.join(process.cwd(), "waitlist-entries.json");
      let existing: unknown[] = [];
      try {
        const raw = await fs.readFile(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) existing = parsed;
      } catch {
        existing = [];
      }

      existing.push(entry);
      await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf-8");
    } catch {
      console.info("[waitlist]", JSON.stringify(entry));
    }

    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
