import type { Metadata } from "next";
import { getAdminSession } from "@/lib/supabase/admin-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WaitlistEntry, WaitlistStats } from "@/lib/supabase/types";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import "./admin.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Tornado Academy",
  robots: {
    index: false,
    follow: false,
  },
};

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
    const ms = new Date(item.created_at).getTime();
    if (ms >= startOfToday) today += 1;
    if (ms >= sevenDaysAgo) last7Days += 1;
    if (item.status === "new") newCount += 1;
    else if (item.status === "contacted") contactedCount += 1;
    else if (item.status === "enrolled") enrolledCount += 1;
    else if (item.status === "archived") archivedCount += 1;
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

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session.isAdmin || !session.profile) {
    return <AdminLoginForm isConfigured={session.configured} />;
  }

  const supabase = await createSupabaseServerClient();
  let entries: WaitlistEntry[] = [];

  if (supabase) {
    const { data } = await supabase
      .from("waitlist_entries")
      .select(
        "id, name, phone, status, notes, source, launch_date, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (Array.isArray(data)) {
      entries = data as WaitlistEntry[];
    }
  }

  const stats = computeStats(entries);

  return (
    <AdminDashboard
      profile={session.profile}
      initialEntries={entries}
      initialStats={stats}
    />
  );
}
