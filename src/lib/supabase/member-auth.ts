import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./server";
import type { MemberProfile } from "./types";

export const DEVICE_SESSION_COOKIE = "ta_device_session";

export interface MemberSessionResult {
  configured: boolean;
  authenticated: boolean;
  isAdmin: boolean;
  suspended: boolean;
  sessionMismatch: boolean;
  profile: MemberProfile | null;
}

export async function getMemberSession(): Promise<MemberSessionResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      configured: false,
      authenticated: false,
      isAdmin: false,
      suspended: false,
      sessionMismatch: false,
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
      authenticated: false,
      isAdmin: false,
      suspended: false,
      sessionMismatch: false,
      profile: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, role, bio, specialty, is_active, is_muted, active_session_token, created_at, updated_at"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      configured: true,
      authenticated: false,
      isAdmin: false,
      suspended: false,
      sessionMismatch: false,
      profile: null,
    };
  }

  const typed = profile as MemberProfile;
  const isAdmin = typed.role === "admin";

  if (!isAdmin && !typed.is_active) {
    return {
      configured: true,
      authenticated: false,
      isAdmin: false,
      suspended: true,
      sessionMismatch: false,
      profile: null,
    };
  }

  // Enforce Single Active Session for students (admins can use multiple devices if needed)
  if (!isAdmin && typed.active_session_token) {
    const cookieStore = await cookies();
    const deviceToken = cookieStore.get(DEVICE_SESSION_COOKIE)?.value || "";
    if (!deviceToken || deviceToken !== typed.active_session_token) {
      return {
        configured: true,
        authenticated: false,
        isAdmin: false,
        suspended: false,
        sessionMismatch: true,
        profile: null,
      };
    }
  }

  const safeProfile: MemberProfile = {
    id: typed.id,
    email: typed.email,
    full_name: typed.full_name,
    role: typed.role,
    bio: typed.bio ?? "",
    specialty: typed.specialty ?? "",
    is_active: typed.is_active ?? true,
    is_muted: typed.is_muted ?? false,
    created_at: typed.created_at,
    updated_at: typed.updated_at,
  };

  return {
    configured: true,
    authenticated: true,
    isAdmin,
    suspended: false,
    sessionMismatch: false,
    profile: safeProfile,
  };
}
