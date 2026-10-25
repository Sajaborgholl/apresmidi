import Link from "next/link";
import type { TemplateMeta } from "@/lib/types";
import { CARD_COLORS } from "@/lib/categories";
import { STANDARD_PLAN } from "@/lib/plans";
import HeroPreview from "@/app/_components/HeroPreview";

// One template in a category page's grid, styled like the homepage's occasion
// cards (folded corner, accent-colour backing, dark hover scrim with cream
// pills). The scrim offers both next steps, as the homepage cards do: "View
// template" (its detail page) and "Customize" (straight to ordering). Pure
// display: it takes a TemplateMeta and fetches nothing. Descriptions are
// deliberately not shown. Without a screenshot it falls back to the live
// demo, the same way the homepage cards do, and only shows "Preview coming
// soon" if there's neither.
//
// The whole card still opens the detail page: a full-size link sits under
// the picture (a "stretched" link, since the pills are links themselves and
// links can't nest). The picture and scrim let clicks through to it; only the
// pills take clicks, once the scrim is showing. The stretched link is hidden from
// keyboards and screen readers, which get the two pills instead; focusing
// either one shows the scrim too.
export default function TemplateCard({
  template,
  colorIndex = 0,
  demoSlug,
}: {
  template: TemplateMeta;
  colorIndex?: number;
  demoSlug?: string;
}) {
  const detailHref = `/templates/${template.category_slug}/${template.slug}`;
  return (
    <div className="group relative">
      <Link href={detailHref} aria-hidden="true" tabIndex={-1} className="absolute inset-0 z-[1] rounded-3xl" />

      <div
        className="folded-card pointer-events-none relative z-[2] aspect-[4/5] w-full overflow-hidden rounded-3xl"
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
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
          style={{ background: "rgba(31,36,48,0.55)" }}
        >
          <Link
            href={detailHref}
            className="rounded-full px-5 py-2 text-sm font-medium transition group-hover:pointer-events-auto group-focus-within:pointer-events-auto active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ background: "var(--cream)", color: "var(--ink)", outlineColor: "var(--cream)" }}
          >
            View template
          </Link>
          <Link
            href={`/order/${template.slug}`}
            className="rounded-full border px-5 py-2 text-sm font-medium transition group-hover:pointer-events-auto group-focus-within:pointer-events-auto active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ borderColor: "var(--cream)", color: "var(--cream)", outlineColor: "var(--cream)" }}
          >
            Customize
          </Link>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-3 px-1">
        <h3 className="display text-lg font-bold">{template.name}</h3>
        <span className="shrink-0 text-sm opacity-60">From {STANDARD_PLAN.price}</span>
      </div>
    </div>
  );
}
