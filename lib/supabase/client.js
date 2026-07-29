// Browser-side Supabase client. Safe to use with the anon key because
// Row Level Security enforces access at the database.
import { createBrowserClient } from "@supabase/ssr";

// True only when both env vars are present. Lets the UI run (calculator, etc.)
// before you've connected Supabase, instead of crashing on a missing key.
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
