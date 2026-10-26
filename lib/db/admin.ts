import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv, serverEnv } from "@/lib/env";
import type { Database } from "./types";

/**
 * The service role. It bypasses RLS, so use it only for work no user may do
 * directly: issuing and resolving cards, recording events and deleting
 * accounts. Prefer the user-scoped client from ./server everywhere else.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv().NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
