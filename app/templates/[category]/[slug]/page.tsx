import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { CARD_COLORS, getVisibleCategories } from "@/lib/categories";
import { STANDARD_PLAN } from "@/lib/plans";
import SiteHeader from "@/app/_components/SiteHeader";
import SiteFooter from "@/app/_components/SiteFooter";
import Reveal from "@/app/_components/Reveal";
import { FeatureList } from "@/app/_components/Pricing";
import HeroPreview from "@/app/_components/HeroPreview";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string; slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, slug } = await params;
  const { data } = await getSupabaseAdmin()
    .from("templates")
    .select("name, thumbnail_url")
    .eq("slug", slug)
    .eq("category", category)
    .maybeSingle();
  if (!data) return {};
  const description = `${data.name}: a digital invitation with a live RSVP page and a private guest dashboard. ${STANDARD_PLAN.price}.`;
  return {
    title: `${data.name} · Après-midi`,
    description,
    openGraph: {
      title: data.name,
      description,
      ...(data.thumbnail_url ? { images: [data.thumbnail_url] } : {}),
    },
  };
}

// The same colour every time for a given template, picked from its slug, so
// the frame behind the screenshot doesn't change between visits.
function colorFor(slug: string) {
  let sum = 0;
  for (const ch of slug) sum += ch.charCodeAt(0);
  return CARD_COLORS[sum % CARD_COLORS.length];
}

export default async function TemplateDetailPage({ params }: { params: Params }) {
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
    .select("id, slug, name, thumbnail_url")
    .eq("slug", slug)
    .eq("category", category)
    .single();

  if (!template) notFound();

  // A permanent public invite for this template flagged as a demo, so we can
  // link to a live, working example. Not every template has one yet, so this
  // is allowed to come back empty.
  const [{ data: demoInvite }, navCategories] = await Promise.all([
    supabaseAdmin
      .from("invites")
      .select("slug")
      .eq("template_id", template.id)
      .eq("is_demo", true)
      .limit(1)
      .maybeSingle(),
    getVisibleCategories(supabaseAdmin),
  ]);

  return (
    <div className="overflow-x-clip" style={{ background: "var(--cream)", color: "var(--ink)", fontFamily: "Inter, sans-serif" }}>
      <SiteHeader categories={navCategories} />

      {/* pt clears the fixed .site-nav (about 76px tall). */}
      <main className="mx-auto max-w-5xl px-6 pb-16 pt-28 md:pt-32">
        <nav aria-label="Breadcrumb" className="text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/#occasions" className="opacity-60 hover:opacity-100">Templates</Link>
            </li>
            <li aria-hidden="true" className="opacity-40">/</li>
            <li>
              <Link href={`/templates/${categoryRow.slug}`} className="opacity-60 hover:opacity-100">{categoryRow.name}</Link>
            </li>
            <li aria-hidden="true" className="opacity-40">/</li>
            <li aria-current="page" className="font-medium">{template.name}</li>
          </ol>
        </nav>

        <div className="mt-8 grid grid-cols-1 items-start gap-10 md:grid-cols-2 md:gap-12">
          <Reveal>
            <div
              className="folded-card relative aspect-[4/5] w-full overflow-hidden rounded-3xl"
              style={{ background: colorFor(template.slug) }}
            >
              {template.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={template.thumbnail_url}
                  alt={`${template.name} invitation`}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                />
              ) : demoInvite ? (
                <div className="absolute inset-0">
                  <HeroPreview slug={demoInvite.slug} />
                </div>
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(31,36,48,0.06)", border: "1px dashed rgba(31,36,48,0.25)" }}
                >
                  <span className="text-sm font-medium opacity-50">Preview coming soon</span>
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div>
              <span className="text-xs font-medium uppercase tracking-wide opacity-60">{categoryRow.name}</span>
              <h1 className="display mt-2 text-3xl font-bold md:text-4xl">{template.name}</h1>

              <div className="mt-6 rounded-[28px] p-7" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                <div className="flex items-baseline gap-3">
                  <p className="display text-5xl font-extrabold">{STANDARD_PLAN.price}</p>
                  <p className="text-sm opacity-60">one-time · {STANDARD_PLAN.name} plan</p>
                </div>
                <FeatureList features={STANDARD_PLAN.features} check="var(--blue-dark)" opacity="opacity-80" />

                <div className="mt-7 flex flex-col gap-3">
                  <Link
                    href={`/order/${template.slug}`}
                    className="inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition active:scale-[0.97]"
                    style={{ background: "var(--ink)", color: "var(--cream)" }}
                  >
                    Customize this template
                  </Link>
                  {demoInvite && (
                    <a
                      href={`/i/${demoInvite.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition hover:bg-black/[0.04] active:scale-[0.97]"
                      style={{ border: "1px solid rgba(0,0,0,0.18)" }}
                    >
                      View live demo
                    </a>
                  )}
                </div>
              </div>

              <p className="mt-5 text-sm">
                <span className="opacity-70">Want changes to the design? </span>
                <Link href="/#pricing" className="font-medium underline-offset-4 hover:underline">
                  See Plus &amp; Premium&nbsp;<span aria-hidden="true">&rarr;</span>
                </Link>
              </p>
            </div>
          </Reveal>
        </div>
      </main>

      <SiteFooter categories={navCategories} />
    </div>
  );
}
