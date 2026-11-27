import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function isServiceRoleConfigured(): boolean {
  const { url } = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  return Boolean(url && serviceKey);
}

/**
 * Server-only Supabase client with Service Role privileges.
 * Used exclusively inside verified Admin or Auth server endpoints
 * (e.g., creating student accounts, updating active_session_token).
 */
export function createSupabaseServiceClient() {
  const { url } = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
