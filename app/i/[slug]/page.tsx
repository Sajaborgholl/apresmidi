import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug, TEMPLATE_REGISTRY } from "@/lib/templates/registry";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  // Explicit safe column list — this row gets passed straight into a
  // "use client" template component below, so it's serialized into the
  // RSC payload sent to the browser. dashboard_token/owner_email/paid_at
  // must NEVER be selected here.
  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select(
      "id, host_names, event_date, venue_name, venue_map_url, primary_color, photo_urls, music_url, whatsapp_number, age, slug, status, is_demo, templates(slug, name)"
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

  const TemplateComponent = template.component;
  return <TemplateComponent invite={invite} />;
}
