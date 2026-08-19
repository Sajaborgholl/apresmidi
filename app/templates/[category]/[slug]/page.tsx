import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: categoryRow } = await supabaseAdmin
    .from("categories")
    .select("slug, name")
    .eq("slug", category)
    .single();

  if (!categoryRow) notFound();

  const { data: template } = await supabaseAdmin
    .from("templates")
    .select("id, slug, name, description, thumbnail_url")
    .eq("slug", slug)
    .eq("category", category)
    .single();

  if (!template) notFound();

  // Find a permanent public invite for this template that's flagged as a
  // demo, so we can link to a live, working example. Not every template
  // will have one yet, so this is allowed to come back empty.
  const { data: demoInvite } = await supabaseAdmin
    .from("invites")
    .select("slug")
    .eq("template_id", template.id)
    .eq("is_demo", true)
    .limit(1)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link
        href={`/templates/${category}`}
        className="text-sm text-neutral-500 hover:underline"
      >
        ← Back to {categoryRow.name}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-neutral-100">
          {template.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.thumbnail_url}
              alt={template.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
              No preview yet
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {categoryRow.name}
          </span>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-900">
            {template.name}
          </h1>
          {template.description && (
            <p className="mt-3 text-neutral-600">{template.description}</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {demoInvite && (
              <a
                href={`/i/${demoInvite.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-neutral-300 px-5 py-2.5 text-center font-medium text-neutral-900 hover:bg-neutral-50"
              >
                View live demo
              </a>
            )}
            <Link
              href={`/order/${template.slug}`}
              className="rounded-full bg-neutral-900 px-5 py-2.5 text-center font-medium text-white hover:bg-neutral-800"
            >
              Order this template
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
