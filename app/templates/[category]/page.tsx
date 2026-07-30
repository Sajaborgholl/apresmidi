import { getSupabaseAdmin } from "@/lib/supabase";
import TemplateCard from "./_components/TemplateCard";
import type { TemplateMeta } from "@/lib/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  // Category row gives us the display name and the price for every
  // template in this category (price lives on categories, not templates).
  const { data: categoryRow } = await supabaseAdmin
    .from("categories")
    .select("slug, name, price")
    .eq("slug", category)
    .single();

  if (!categoryRow) notFound();

  const { data: templateRows } = await supabaseAdmin
    .from("templates")
    .select("id, slug, name, description, thumbnail_url")
    .eq("category", category);

  const templates: TemplateMeta[] = (templateRows ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description ?? null,
    price: categoryRow.price,
    thumbnail_url: t.thumbnail_url,
    category_slug: categoryRow.slug,
    category_name: categoryRow.name,
  }));

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-neutral-900">
        {categoryRow.name} Templates
      </h1>
      <p className="mt-1 text-neutral-600">${categoryRow.price} per invite</p>

      {templates.length === 0 ? (
        <p className="mt-8 text-neutral-500">No templates in this category yet.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </main>
  );
}
