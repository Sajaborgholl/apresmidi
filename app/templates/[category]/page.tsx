import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getVisibleCategories } from "@/lib/categories";
import { mustQuery } from "@/lib/mustQuery";
import type { TemplateMeta } from "@/lib/types";
import TemplateCard from "./_components/TemplateCard";
import SiteHeader from "@/app/_components/SiteHeader";
import SiteFooter from "@/app/_components/SiteFooter";
import Reveal from "@/app/_components/Reveal";

// Stored and rebuilt in the background at most every 5 minutes (same as the
// homepage, app/page.tsx). Every occasion is built at deploy time; one added
// later is built on its first visit and stored from then on.
export const revalidate = 300;

type Params = Promise<{ category: string }>;

export async function generateStaticParams() {
  const rows = mustQuery(await getSupabaseAdmin().from("categories").select("slug"), "category slugs");
  return (rows ?? []).map((r) => ({ category: r.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const data = mustQuery(
    await getSupabaseAdmin().from("categories").select("name").eq("slug", category).maybeSingle(),
    "category name",
  );
  if (!data) return {};
  return {
    title: `${data.name} invitations · Après-midi`,
    description: `Digital ${data.name.toLowerCase()} invitations with a live RSVP page and a private guest dashboard.`,
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { category } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  // maybeSingle, not single: "no such occasion" is a 404, while a real
  // database error throws (mustQuery) so the last good page stays cached.
  const categoryRow = mustQuery(
    await supabaseAdmin.from("categories").select("slug, name").eq("slug", category).maybeSingle(),
    "category",
  );

  if (!categoryRow) notFound();

  const [templateResult, demoResult, navCategories] = await Promise.all([
    supabaseAdmin
      .from("templates")
      .select("id, slug, name, description, thumbnail_url")
      .eq("category", category),
    // Live demos, used as the card picture for templates without a screenshot.
    supabaseAdmin.from("invites").select("template_id, slug").eq("is_demo", true),
    getVisibleCategories(supabaseAdmin),
  ]);
  const templateRows = mustQuery(templateResult, "templates");
  const demoRows = mustQuery(demoResult, "demo invites");
  const demoSlugByTemplateId: Record<string, string> = {};
  for (const d of demoRows ?? []) {
    if (d.template_id) demoSlugByTemplateId[d.template_id] = d.slug;
  }

  const templates: TemplateMeta[] = (templateRows ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description ?? null,
    thumbnail_url: t.thumbnail_url,
    category_slug: categoryRow.slug,
    category_name: categoryRow.name,
  }));

  return (
    <div className="overflow-x-clip" style={{ background: "var(--cream)", color: "var(--ink)", fontFamily: "Inter, sans-serif" }}>
      <SiteHeader categories={navCategories} />

      {/* pt clears the fixed .site-nav (about 76px tall). */}
      <main className="mx-auto max-w-5xl px-6 pb-16 pt-28 md:pt-32">
        <Reveal>
          <Link href="/#occasions" className="inline-flex items-center gap-1.5 text-sm font-medium opacity-60 hover:opacity-100">
            <span aria-hidden="true">&larr;</span> All occasions
          </Link>
          <h1 className="display mt-4 text-3xl font-bold md:text-5xl">{categoryRow.name} invitations</h1>
          <p className="mt-3 max-w-xl text-base opacity-70 md:text-lg">
            Pick a design and add your details and guests. We send each guest a personal invitation on WhatsApp, and every reply lands in your dashboard.
          </p>
        </Reveal>

        {templates.length === 0 ? (
          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 rounded-3xl px-6 py-16 text-center"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="display text-xl font-bold">New designs for this occasion are on the way</p>
            <Link
              href="/#occasions"
              className="rounded-full px-5 py-2 text-sm font-medium transition active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Browse other occasions
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, i) => (
              <Reveal key={template.id} delay={Math.min(i, 5) * 60}>
                <TemplateCard template={template} colorIndex={i} demoSlug={demoSlugByTemplateId[template.id]} />
              </Reveal>
            ))}
          </div>
        )}
      </main>

      <SiteFooter categories={navCategories} />
    </div>
  );
}
