import { getSupabaseAdmin } from "@/lib/supabase";
import WeddingClassic from "@/components/templates/WeddingClassic";
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

  if (templateSlug === "wedding-classic") {
    return <WeddingClassic invite={invite} />;
  }

  return <WeddingClassic invite={invite} />;
}
