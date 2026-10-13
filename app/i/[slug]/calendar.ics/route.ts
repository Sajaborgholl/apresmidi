import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { calendarEvent, eventTitle, icsFile } from "@/lib/calendar";
import { slugify } from "@/app/order/[slug]/_lib/slugify";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// /i/<slug>/calendar.ics — the invite's event as a calendar file, behind the
// "Save the date" → Apple / iPhone option. Served from here rather than built
// in the browser: browser-made downloads often fail in WhatsApp's and
// Instagram's in-app browsers, which is where most guests open their invite.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: invite } = await getSupabaseAdmin()
    .from("invites")
    .select("slug, host_names, event_date, venue_name, venue_map_url, status, is_demo, templates(category)")
    .eq("slug", slug)
    .maybeSingle();

  // Same visibility rule as the guest page (app/i/[slug]/page.tsx).
  if (!invite || (!invite.is_demo && invite.status !== "live")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rel = invite.templates as { category: string } | { category: string }[] | null;
  const category = Array.isArray(rel) ? rel[0]?.category : rel?.category;
  const event = calendarEvent({
    title: eventTitle(invite.host_names, category),
    eventDate: invite.event_date,
    venueName: invite.venue_name,
    venueMapUrl: invite.venue_map_url,
    guestUrl: `${BASE_URL}/i/${invite.slug}`,
  });
  if (!event) {
    return new NextResponse("This invitation has no date yet", { status: 404 });
  }

  const host = new URL(BASE_URL).hostname;
  const fileName = `${slugify(event.title) || "invitation"}.ics`;
  return new NextResponse(icsFile(event, `${invite.slug}@${host}`), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
