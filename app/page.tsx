import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import HeroPreview from "./_components/HeroPreview";
import ExpandPreviewButton from "./_components/ExpandPreviewButton";
import ClickableCard from "./_components/ClickableCard";
import PreviewPill from "./_components/PreviewPill";
import HeroCarousel, { type CarouselTemplate } from "./_components/HeroCarousel";
import Reveal from "./_components/Reveal";
import HowItWorks from "./_components/HowItWorks";
import Pricing from "./_components/Pricing";
import FeatureShowcase from "./_components/FeatureShowcase";
import TypewriterText from "./_components/TypewriterText";
import RequestCategorySection from "./_components/RequestCategorySection";

export const dynamic = "force-dynamic";

type CategoryRow = {
  slug: string;
  name: string;
  price: number | null;
  sort_order: number | null;
};

type RecentInviteRow = {
  slug: string;
  host_names: string;
  event_date: string | null;
  templates: { name: string } | { name: string }[] | null;
};

type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  thumbnail_url: string | null;
  video_url: string | null;
};

// Cycles through the site's three accent colors for any number of
// categories/cards, so this still looks right if a category is added later.
const CARD_COLORS = ["var(--blue)", "var(--yellow)", "var(--blue-light)"];

// Temporarily hides the "Recently designed" section — flip back to true to
// restore it. Left in place (rather than deleting the section) so it's a
// one-line change either way.
const SHOW_RECENTLY_DESIGNED = false;

function templateName(templates: RecentInviteRow["templates"]) {
  if (!templates) return "Invitation";
  return Array.isArray(templates) ? templates[0]?.name ?? "Invitation" : templates.name;
}

export default async function Home() {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: categoryRows } = await supabaseAdmin
    .from("categories")
    .select("slug, name, price, sort_order")
    .order("sort_order", { ascending: true });
  const categories: CategoryRow[] = categoryRows ?? [];

  const { data: templateRows } = await supabaseAdmin
    .from("templates")
    .select("id, slug, name, category, thumbnail_url, video_url");

  // Group templates by category so each occasion row can show up to 3 real
  // templates. Categories with fewer than 3 (or zero) templates get
  // "coming soon" filler cards for the remaining slots — no fake stand-ins.
  const templatesByCategory: Record<string, TemplateRow[]> = {};
  for (const t of templateRows ?? []) {
    (templatesByCategory[t.category] ??= []).push(t);
  }

  // Same "is_demo" flag the template detail page uses to link to a live
  // example — reused here so occasion cards can embed a real HeroPreview
  // (like the hero section) instead of a flat thumbnail, wherever a demo
  // invite exists for that template.
  const { data: demoInviteRows } = await supabaseAdmin
    .from("invites")
    .select("template_id, slug")
    .eq("is_demo", true);
  const demoSlugByTemplateId: Record<string, string> = {};
  for (const d of demoInviteRows ?? []) {
    if (d.template_id) demoSlugByTemplateId[d.template_id] = d.slug;
  }

  // Flat list (all categories combined) for the hero carousel, which
  // showcases templates generally rather than grouped by occasion.
  const carouselTemplates: CarouselTemplate[] = (templateRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    thumbnail_url: t.thumbnail_url,
    video_url: t.video_url,
    demoSlug: demoSlugByTemplateId[t.id] ?? null,
  }));

  const { count: liveInviteCount } = await supabaseAdmin
    .from("invites")
    .select("*", { count: "exact", head: true })
    .eq("status", "live");

  const { data: recentInvitesRaw } = await supabaseAdmin
    .from("invites")
    .select("slug, host_names, event_date, templates(name)")
    .eq("status", "live")
    .order("created_at", { ascending: false })
    .limit(3);
  const recentInvites: RecentInviteRow[] = recentInvitesRaw ?? [];

  return (
    <div className="overflow-x-clip" style={{ background: "var(--cream)", color: "var(--ink)", fontFamily: "Inter, sans-serif" }}>
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <span className="script text-3xl">Après-midi</span>
        <div className="hidden md:flex gap-8 text-sm font-medium">
          {categories.slice(0, 3).map((cat) => (
            <a key={cat.slug} href={`#occasion-${cat.slug}`} className="hover:opacity-70">
              {cat.name}
            </a>
          ))}
          <a href="#how-it-works" className="hover:opacity-70">How it works</a>
        </div>
        <a
          href="#occasions"
          className="rounded-full px-5 py-2 text-sm font-medium transition active:scale-[0.97]"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          Browse templates
        </a>
      </nav>

      <section className="relative px-6 md:px-12 pt-8 pb-20 overflow-hidden">
        <h1 className="display font-bold leading-[0.85] tracking-tight select-none" style={{ fontSize: "clamp(3rem,10vw,9rem)" }}>
          <span className="block">Invitations</span>
          <span className="block -mt-2 md:-mt-6" style={{ marginLeft: "8%" }}>
            <span style={{ color: "var(--blue-dark)" }}>worth</span> opening
          </span>
        </h1>

        <a
          href="#occasions"
          className="mt-6 inline-flex rounded-full px-6 py-3 text-sm font-medium transition active:scale-[0.97]"
          style={{ background: "var(--ink)", color: "var(--cream)", marginLeft: "8%" }}
        >
          Browse templates
        </a>

        <div className="mt-10">
          <HeroCarousel templates={carouselTemplates} />

          <div
            className="float mt-4 flex max-w-xs flex-col justify-between rounded-2xl p-4 md:p-5"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--blue-dark)" }}>Live now</span>
            <span className="display font-bold text-2xl">
              {liveInviteCount ?? 0} invite{(liveInviteCount ?? 0) === 1 ? "" : "s"} sent
            </span>
          </div>
        </div>
      </section>

      <HowItWorks />

      <section id="occasions" className="px-6 md:px-12 py-14">
        <h2 className="display font-bold text-2xl md:text-3xl mb-8">Browse by occasion</h2>
        {categories.length > 0 ? (
          <div className="flex flex-col gap-10">
            {categories.map((cat, catIndex) => (
              <Reveal key={cat.slug} delay={Math.min(catIndex, 3) * 80}>
              <div id={`occasion-${cat.slug}`} className="scroll-mt-24">
                <div className="mb-4">
                  <Link href={`/templates/${cat.slug}`} className="display font-bold text-xl hover:opacity-70">
                    {cat.name}
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {Array.from({ length: 3 }, (_, cardIndex) => templatesByCategory[cat.slug]?.[cardIndex] ?? null).map(
                    (template, cardIndex) =>
                      template ? (
                        <ClickableCard
                          key={template.slug}
                          href={`/order/${template.slug}`}
                          className="occasion-card folded-card block aspect-[4/5] rounded-3xl transition"
                          style={{ background: CARD_COLORS[(catIndex + cardIndex) % CARD_COLORS.length] }}
                        >
                          {demoSlugByTemplateId[template.id] ? (
                            <>
                              <HeroPreview slug={demoSlugByTemplateId[template.id]} />
                              <ExpandPreviewButton slug={demoSlugByTemplateId[template.id]} />
                            </>
                          ) : (
                            template.thumbnail_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={template.thumbnail_url}
                                alt={template.name}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            )
                          )}
                          <div
                            className="occasion-overlay absolute inset-0 flex flex-col items-center justify-center gap-3"
                            style={{ background: "rgba(31,36,48,0.55)" }}
                          >
                            <span
                              className="rounded-full px-5 py-2 text-sm font-medium"
                              style={{ background: "var(--cream)", color: "var(--ink)" }}
                            >
                              Customize
                            </span>
                            {demoSlugByTemplateId[template.id] && (
                              <PreviewPill slug={demoSlugByTemplateId[template.id]} />
                            )}
                          </div>
                        </ClickableCard>
                      ) : (
                        <div
                          key={`coming-soon-${cardIndex}`}
                          className="folded-card flex aspect-[4/5] items-center justify-center rounded-3xl"
                          style={{ background: "rgba(31,36,48,0.06)", border: "1px dashed rgba(31,36,48,0.25)" }}
                        >
                          <span className="text-sm font-medium opacity-50">Coming soon</span>
                        </div>
                      )
                  )}
                </div>
                <div className="flex justify-end mt-4">
                  <Link
                    href={`/templates/${cat.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70"
                  >
                    See all
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-neutral-500">Categories coming soon.</p>
        )}
      </section>

      <RequestCategorySection />

      {SHOW_RECENTLY_DESIGNED && (
      <section className="px-6 md:px-12 py-14">
        <h2 className="display font-bold text-2xl md:text-3xl mb-8">Recently designed</h2>
        {recentInvites.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-5">
            {recentInvites.map((invite, i) => (
              <Link
                key={invite.slug}
                href={`/i/${invite.slug}`}
                className="rounded-3xl h-56 md:h-72 p-6 flex flex-col justify-between transition hover:opacity-90"
                style={
                  i === 0
                    ? { background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }
                    : { background: CARD_COLORS[i % CARD_COLORS.length] }
                }
              >
                <span className="text-xs font-medium uppercase tracking-wide opacity-60">
                  {templateName(invite.templates)}
                </span>
                <div>
                  <p className="script text-3xl leading-tight">{invite.host_names}</p>
                  {invite.event_date && (
                    <p className="text-sm mt-2 opacity-70">
                      {new Date(invite.event_date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            className="rounded-3xl py-14 px-6 flex flex-col items-center justify-center text-center gap-4"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <p className="text-neutral-600">No live invites yet, yours could be the first.</p>
            <a
              href="#occasions"
              className="rounded-full px-5 py-2 text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Start one
            </a>
          </div>
        )}
      </section>
      )}

      <FeatureShowcase />

      <section className="px-6 md:px-12 py-14">
        <Reveal>
          <h2 className="display font-bold text-2xl md:text-3xl mb-8">What guests are saying</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-6">
          <Reveal className="md:col-span-2">
            <div className="rounded-3xl p-8 md:p-10 h-full flex flex-col justify-between" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
              <TypewriterText
                className="display font-medium text-xl md:text-2xl leading-snug max-w-lg"
                text={`"Guests loved the link, RSVPs came in within a day and the photos made it feel like our actual wedding site."`}
              />
              <div className="flex items-center gap-3 mt-6">
                <div
                  className="display font-bold text-sm w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: "var(--blue)", border: "3px solid var(--blue-dark)", color: "var(--ink)" }}
                >
                  S
                </div>
                <p className="text-sm opacity-70">Sarah, Wedding</p>
              </div>
            </div>
          </Reveal>
          <div className="flex flex-col gap-6">
            <Reveal delay={80}>
              <div className="rounded-3xl p-6" style={{ background: "var(--yellow)" }}>
                <TypewriterText className="text-sm" text={`"Set up in ten minutes, looked amazing."`} startDelay={200} />
                <div className="flex items-center gap-2 mt-4">
                  <div
                    className="display font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "var(--cream)", color: "var(--ink)" }}
                  >
                    K
                  </div>
                  <p className="text-xs opacity-80">Karim, Birthday</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="rounded-3xl p-6" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>
                <TypewriterText className="text-sm" text={`"Exactly the vibe we wanted for the baptism."`} startDelay={400} />
                <div className="flex items-center gap-2 mt-4">
                  <div
                    className="display font-bold text-xs w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: "var(--blue)", border: "2px solid var(--blue-dark)", color: "var(--ink)" }}
                  >
                    L
                  </div>
                  <p className="text-xs opacity-70">Layla&apos;s family</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Pricing />

      <footer className="px-6 md:px-12 py-14 mt-8" style={{ background: "var(--blue)" }}>
        <Reveal>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <h3 className="display font-bold text-2xl md:text-3xl max-w-md">Get notified when we add new templates</h3>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="you@email.com"
              className="rounded-full px-5 py-3 w-64"
              style={{ border: "1px solid rgba(0,0,0,0.15)", background: "#fff", color: "var(--ink)" }}
            />
            <button
              className="rounded-full px-6 py-3 font-medium transition active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Subscribe
            </button>
          </div>
        </div>
        </Reveal>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-10 pt-6 border-t" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <span className="script text-2xl">Après-midi</span>
          <div className="flex gap-6 text-sm">
            {categories.slice(0, 3).map((cat) => (
              <Link key={cat.slug} href={`/templates/${cat.slug}`}>
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="flex gap-4 text-sm">
            <a href="#">Instagram</a>
            <a href="#">WhatsApp</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
