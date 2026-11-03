import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { processQueue } from "@/lib/whatsappQueue";

// Sends the next queued WhatsApp messages. Called every minute by Supabase
// (supabase/add-whatsapp-worker-cron.sql) with
// "Authorization: Bearer <WHATSAPP_WORKER_SECRET>". The dashboard doesn't call
// this URL: it runs processQueue directly after a host presses Send.

export const dynamic = "force-dynamic";
// Vercel's free plan allows 60 seconds; processQueue stops itself before that.
export const maxDuration = 60;

function authorized(request: Request): boolean {
  const secret = process.env.WHATSAPP_WORKER_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const run = await processQueue(50_000);
    return NextResponse.json(run);
  } catch (err) {
    console.error("whatsapp worker: failed", err);
    return NextResponse.json({ error: "Worker failed" }, { status: 500 });
  }
}
