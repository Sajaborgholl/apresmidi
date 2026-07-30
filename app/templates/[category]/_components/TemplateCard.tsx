import Link from "next/link";
import type { TemplateMeta } from "@/lib/types";

// Renders one template as a clickable card in the gallery (homepage,
// category pages). Pure display component — it takes a TemplateMeta
// (a row from the `templates` table) as a prop and links to that
// template's detail page. It doesn't fetch anything itself.
export default function TemplateCard({ template }: { template: TemplateMeta }) {
  return (
    <Link
      href={`/templates/${template.category_slug}/${template.slug}`}
      className="group block overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        {template.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnail_url}
            alt={template.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No preview yet
          </div>
        )}
      </div>

      <div className="p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          {template.category_name}
        </span>
        <h3 className="mt-1 text-lg font-semibold text-neutral-900">
          {template.name}
        </h3>
        {template.description && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
            {template.description}
          </p>
        )}
        <p className="mt-3 font-medium text-neutral-900">
          {template.price != null ? `$${template.price}` : "Price TBD"}
        </p>
      </div>
    </Link>
  );
}
