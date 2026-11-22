import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

    if (!name || !phone) {
      return NextResponse.json(
        { ok: false, error: "Name and phone are required" },
        { status: 400 }
      );
    }

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
      // Vercel serverless filesystem is read-only; log entry for Runtime Logs
      console.info("[waitlist]", JSON.stringify(entry));
    }

    return NextResponse.json({ ok: true, entry });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
