import { createClient } from "@supabase/supabase-js";

// Cookie-free anonymous client for data that is public under RLS (menus,
// site settings). Safe inside unstable_cache, where cookies() is unavailable.
export function createAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
