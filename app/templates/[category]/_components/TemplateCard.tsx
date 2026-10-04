import Link from "next/link";
import type { TemplateMeta } from "@/lib/types";
import { CARD_COLORS } from "@/lib/categories";
import { STANDARD_PLAN } from "@/lib/plans";
import HeroPreview from "@/app/_components/HeroPreview";

// One template in a category page's grid, styled like the homepage's occasion
// cards (folded corner, accent-colour backing, dark hover scrim with a cream
// pill) and linking to that template's detail page. Pure display: it takes a
// TemplateMeta and fetches nothing. Descriptions are deliberately not shown.
// Without a screenshot it falls back to the live demo, the same way the
// homepage cards do, and only shows "Preview coming soon" if there's neither.
export default function TemplateCard({
  template,
  colorIndex = 0,
  demoSlug,
}: {
  template: TemplateMeta;
  colorIndex?: number;
  demoSlug?: string;
}) {
  return (
    <Link
      href={`/templates/${template.category_slug}/${template.slug}`}
      className="group block rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{ outlineColor: "var(--ink)" }}
    >
      <div
        className="folded-card relative aspect-[4/5] w-full overflow-hidden rounded-3xl"
        style={{ background: CARD_COLORS[colorIndex % CARD_COLORS.length] }}
      >
        {template.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnail_url}
            alt={template.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : demoSlug ? (
          <div className="absolute inset-0">
            <HeroPreview slug={demoSlug} />
          </div>
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(31,36,48,0.06)", border: "1px dashed rgba(31,36,48,0.25)" }}
          >
            <span className="text-sm font-medium opacity-50">Preview coming soon</span>
          </div>
        )}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{ background: "rgba(31,36,48,0.55)" }}
        >
          <span
            className="rounded-full px-5 py-2 text-sm font-medium"
            style={{ background: "var(--cream)", color: "var(--ink)" }}
          >
            View template
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
        <h3 className="display text-lg font-bold">{template.name}</h3>
        <span className="shrink-0 text-sm opacity-60">From {STANDARD_PLAN.price}</span>
      </div>
    </Link>
  );
}
