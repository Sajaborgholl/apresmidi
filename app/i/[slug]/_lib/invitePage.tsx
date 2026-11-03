import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug, TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import type { Invite } from "@/lib/types";
import type { InviteGuest } from "@/lib/guestRules";

// Shared by the general invitation page (/i/<slug>) and a guest's personal
// page (/i/<slug>/g/<token>): loads the invite a guest may see and renders
// its template.

export async function loadPublicInvite(slug: string) {
  // Explicit safe column list — this row gets passed straight into a
  // "use client" template component, so it's serialized into the RSC payload
  // sent to the browser. dashboard_token/owner_email/paid_at must NEVER be
  // selected here, and neither is whatsapp_number: the host's number is
  // private (used only to forward guests' WhatsApp messages to them).
  const { data: invite } = await getSupabaseAdmin()
    .from("invites")
    .select(
      "id, host_names, event_date, venue_name, venue_map_url, primary_color, photo_urls, music_url, slug, status, is_demo, templates(slug, name)"
    )
    .eq("slug", slug)
    .single();

  if (!invite) notFound();

  // Unpaid/draft invites aren't guest-visible either — except demo rows,
  // which stay always-visible (used on the homepage/template previews).
  if (!invite.is_demo && invite.status !== "live") notFound();

  // The `templates(slug, name)` join can be inferred as either a single
  // object or an array depending on how the select string is parsed
  // (there's no generated Database type here to pin the cardinality) —
  // same defensive shape already used for this in app/page.tsx.
  const templatesRelation = invite.templates as { slug: string } | { slug: string }[] | null;
  const templateSlug = Array.isArray(templatesRelation) ? templatesRelation[0]?.slug : templatesRelation?.slug;

  // Falls back to the first registered template if the invite's template
  // slug doesn't match anything (mirrors the previous if/else behavior,
  // which always defaulted to WeddingClassic).
  const template = getTemplateBySlug(templateSlug) ?? TEMPLATE_REGISTRY[0];

  const publicInvite: Invite = {
    id: invite.id,
    host_names: invite.host_names,
    event_date: invite.event_date,
    venue_name: invite.venue_name,
    venue_map_url: invite.venue_map_url,
    primary_color: invite.primary_color,
    photo_urls: invite.photo_urls,
    music_url: invite.music_url,
    whatsapp_number: null,
    is_demo: invite.is_demo,
    slug: invite.slug,
  };
  return { invite: publicInvite, template };
}

export function InvitePageBody({
  invite,
  template,
  embedded,
  guest,
}: {
  invite: Invite;
  template: ReturnType<typeof getTemplateBySlug> & object;
  embedded: boolean;
  guest: InviteGuest | null;
}) {
  const TemplateComponent = template.component;
  // min-height: 100vh + the template's own background color, so if the
  // rendered page is shorter than the viewport it's embedded in (e.g. the
  // homepage's scaled-up preview iframe), the leftover space blends with
  // this template instead of showing the site's own (dark-mode-capable)
  // background.
  return (
    <div style={{ minHeight: "100vh", background: template.previewBackground }}>
      {/* Demos are public showcases: stop phone browsers (iPhone Safari above
          all) from turning numbers on the page into tappable call links.
          React hoists this into <head>. Real invites are left as they are. */}
      {invite.is_demo && <meta name="format-detection" content="telephone=no" />}
      <TemplateComponent invite={invite} embedded={embedded} guest={guest} />
    </div>
  );
}
