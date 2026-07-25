import { createClient } from "@supabase/supabase-js";

// Client-side / public client — safe to use in browser components.
// Uses the PUBLISHABLE key (formerly "anon key").
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

// Server-side / admin client — NEVER import this in a "use client" component.
// Uses the SECRET key (formerly "service_role key"). Only use inside
// Server Components, Route Handlers, or Server Actions.
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
