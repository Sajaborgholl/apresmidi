import { getSupabaseAdmin } from "@/lib/supabase";
import { getTemplateBySlug, TEMPLATE_REGISTRY } from "./_designs/registry";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: invite } = await supabaseAdmin
    .from("invites")
    .select("*, templates(slug, name)")
    .eq("slug", slug)
    .single();

  if (!invite) notFound();

  const templateSlug = invite.templates?.slug;

  // Falls back to the first registered template if the invite's template
  // slug doesn't match anything (mirrors the previous if/else behavior,
  // which always defaulted to WeddingClassic).
  const template = getTemplateBySlug(templateSlug) ?? TEMPLATE_REGISTRY[0];

  const TemplateComponent = template.component;
  return <TemplateComponent invite={invite} />;
}
