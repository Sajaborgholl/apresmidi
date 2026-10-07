import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase";

// The visitor's IP. On Vercel, x-forwarded-for is set by Vercel's own edge
// (a client can't spoof it there); the first entry is the client. If this
// ever moves to another host, check how that host fills these headers.
export async function clientIp(source?: Headers): Promise<string> {
  const h = source ?? (await headers());
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

// True if this request is allowed: fewer than `limit` allowed hits for
// (`action`, `id`) in the last `windowSeconds`. Counts live in Supabase
// (supabase/add-rate-limits.sql) so every server instance shares them; the
// id (usually an IP) is hashed before it's stored.
//
// Limits should be generous: Lebanese mobile carriers put many people
// behind one shared IP, and a wedding's guests may RSVP from the same Wi-Fi.
//
// Fails open: if the check itself errors (migration not run yet, database
// hiccup) the request goes through and a warning is logged — a broken rate
// limiter must never take the order or RSVP flow down with it.
export async function rateLimit(action: string, id: string, limit: number, windowSeconds: number): Promise<boolean> {
  const key = `${action}:${createHash("sha256").update(id).digest("hex").slice(0, 32)}`;
  const { data, error } = await getSupabaseAdmin().rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    console.warn(`rateLimit: check failed for "${action}", allowing request — ${error.message}`);
    return true;
  }
  return data === true;
}
