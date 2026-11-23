import { createSupabaseServerClient } from "./server";
import type { AdminProfile } from "./types";

export interface AdminSessionResult {
  configured: boolean;
  isAdmin: boolean;
  profile: AdminProfile | null;
}

export async function getAdminSession(): Promise<AdminSessionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      isAdmin: false,
      profile: null,
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      configured: true,
      isAdmin: false,
      profile: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    return {
      configured: true,
      isAdmin: false,
      profile: null,
    };
  }

  return {
    configured: true,
    isAdmin: true,
    profile: profile as AdminProfile,
  };
}
