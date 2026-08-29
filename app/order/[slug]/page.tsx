import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { getTemplateBySlug, type TemplateFieldManifest } from "@/lib/templates/registry";
import CustomizePanel from "./_components/CustomizePanel";

// Fallback if a template row exists in the database but somehow has no
// matching registry entry (e.g. added to the catalog before its code
// shipped) — shows nothing rather than crashing the page.
const EMPTY_FIELDS: TemplateFieldManifest = {
  host_names: false,
  event_date: false,
  venue_name: false,
  venue_map_url: false,
  whatsapp_number: false,
  photoCount: 0,
};

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id, slug, name, category")
    .eq("slug", slug)
    .single();

  if (!template) notFound();

  const registryEntry = getTemplateBySlug(template.slug);
  const fields = registryEntry?.fields ?? EMPTY_FIELDS;

  return (
    <div className="min-h-dvh" style={{ background: "var(--cream)" }}>
      <main className="mx-auto max-w-[1400px] px-6 py-8">
        <CustomizePanel
          slug={template.slug}
          category={template.category}
          fields={fields}
          templateName={template.name}
          priceLabel="$80"
        />
      </main>
    </div>
  );
}
