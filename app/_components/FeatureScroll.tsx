"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { blendAt, progressAt, type ColourStop } from "@/lib/oklch";

// Scroll-driven feature section: a full-height colour panel that blends from
// one feature's colour to the next as you scroll, each feature pairing a
// portrait image with a two-tone headline, plus a sticky list of the features
// on the right that lights up as you reach each one. Full build spec:
// docs/prompts/features-scroll-section.md.
//
// Real features only — no seating/reservation system exists (RSVP is
// accept/decline + guest count), guests never share or generate a link
// themselves (only the host shares theirs), background music (music_url) is a
// dead field no template renders, and no template collects the guest message
// the dashboard can show. Don't add any of those here.
//
// Brand colours only: every resting colour below is a token from globals.css
// :root, kept as hex because the blend maths needs to parse it. Backgrounds
// are the pastels and the text is --ink throughout, which is forced rather
// than chosen — every readable pairing in the brand kit involves ink, and a
// dark section beside a light one swaps background and text mid-scroll,
// dropping contrast to 1.05:1 at the crossover. --cream is left out (it would
// melt into the page and the title list) and so is --blue-dark (nothing in
// the kit is readable on it; ink manages 4.31:1). Four usable pastels across
// five sections means one repeats (--blue), never side by side. Text contrast is 8.61:1
// at worst, at every point of every handoff.
type Feature = {
  slug: string;
  label: string; // the title list entry
  headline: [plain: string, emphasis: string];
  copy: string;
  bg: string;
  fg: string;
  // null renders a placeholder in the card's exact shape; a path renders the
  // image, cover-fitted, with no layout change. UI overlays belong in the image.
  image: string | null;
};

const FEATURES: Feature[] = [
  {
    slug: "rsvps",
    label: "Watch RSVPs roll in",
    headline: ["Watch every RSVP", "roll in"],
    copy: "Private to you — accepted, declined, and total responses, live.",
    bg: "#D7EDEB", // --blue-light
    fg: "#2C251D", // --ink
    image: "/homepage/features/rsvps.webp",
  },
  {
    slug: "venue",
    label: "Venue on the map",
    headline: ["One tap to", "the venue"],
    copy: "One tap opens Google Maps to the exact venue.",
    bg: "#B4C4E5", // --blue
    fg: "#2C251D", // --ink
    image: "/homepage/features/venue.webp",
  },
  {
    slug: "accept-or-decline",
    label: "Accept or decline",
    headline: ["Guests reply", "right on the page"],
    copy: "Guests RSVP right on the page and say how many are coming.",
    bg: "#FFF5DC", // --yellow
    fg: "#2C251D", // --ink
    image: "/homepage/features/accept-or-decline.webp",
  },
  {
    slug: "photos",
    label: "Add your photos",
    headline: ["Make it yours with", "your photos"],
    copy: "Upload up to six photos and see them in the design instantly.",
    bg: "#FBF0A3", // --yellow-dark
    fg: "#2C251D", // --ink
    image: "/homepage/features/photos.webp",
  },
  {
    slug: "share",
    label: "Share it anywhere",
    headline: ["One private link,", "sent anywhere"],
    copy: "Send your private link by text, WhatsApp, or email — that's it.",
    bg: "#B4C4E5", // --blue
    fg: "#2C251D", // --ink
    image: null,
  },
];

const STOPS: ColourStop[] = FEATURES.map(({ bg, fg }) => ({ bg, fg }));

// Before hydration (and without JS), every subsection paints its own solid
// colour, so the section never looks unfinished. Once the scroll engine is
// running it marks the panel data-engaged: subsections go transparent and the
// panel carries the blended colour instead. Custom properties rather than an
// inline background so the engaged rule can override them without !important.
const CSS = `
.fs-section { background: var(--fs-bg); color: var(--fs-fg); }
.fs-panel[data-engaged] .fs-section { background: transparent; color: inherit; }
`;

export default function FeatureScroll() {
  const panelRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<HTMLElement[]>([]);
  // Index of the furthest feature the viewport centre has reached; every title
  // up to it is lit. -1 before the section is reached.
  const [lit, setLit] = useState(-1);

  useEffect(() => {
    const panel = panelRef.current;
    const sections = sectionRefs.current;
    if (!panel || sections.length === 0) return;

    // Subsection positions are cached RELATIVE TO THE PANEL, and the panel's
    // own position is read live each frame. Caching absolute page positions
    // instead is subtly wrong: anything above this section that shifts after
    // load — web fonts swapping in, an image arriving — moves the panel
    // without resizing it, so the ResizeObserver never fires and every cached
    // position goes stale. Offsets within the panel only change when the panel
    // itself resizes, which is exactly what the observer watches.
    let tops: number[] = [];
    let centers: number[] = [];
    const measure = () => {
      const panelTop = panel.getBoundingClientRect().top;
      tops = sections.map((s) => s.getBoundingClientRect().top - panelTop);
      centers = sections.map((s, i) => tops[i] + s.offsetHeight / 2);
    };

    let ticking = false;
    let lastLit = -2;
    const update = () => {
      ticking = false;
      // The viewport's centre line, in the panel's own coordinates. One layout
      // read per frame, taken before any style is written, so it never forces
      // a second layout pass.
      const viewportCenter = window.innerHeight / 2 - panel.getBoundingClientRect().top;

      // Written straight onto the panel: color inherits natively, so the text
      // follows with no CSS-variable fan-out recalculating the subtree.
      const { bg, fg } = blendAt(progressAt(viewportCenter, centers), STOPS);
      panel.style.backgroundColor = bg;
      panel.style.color = fg;

      let reached = -1;
      for (let i = 0; i < tops.length; i++) if (tops[i] <= viewportCenter) reached = i;
      if (reached !== lastLit) {
        lastLit = reached;
        setLit(reached);
      }
    };

    const schedule = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    measure();
    panel.setAttribute("data-engaged", "");
    schedule();

    const observer = new ResizeObserver(() => {
      measure();
      schedule();
    });
    observer.observe(panel);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      panel.removeAttribute("data-engaged");
    };
  }, []);

  // The colour blend stays under reduced motion — it's a colour change tied to
  // position, not movement — but jumping to a feature does not glide there.
  function jumpTo(event: MouseEvent<HTMLAnchorElement>, index: number) {
    const target = sectionRefs.current[index];
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#feature-${FEATURES[index].slug}`);
  }

  return (
    <section aria-labelledby="features-heading">
      <style>{CSS}</style>
      {/* The reference layout opens straight into its first feature with no
          heading, but the page outline still needs one for screen readers. */}
      <h2 id="features-heading" className="sr-only">
        Everything&apos;s included
      </h2>

      <div className="flex">
        <div ref={panelRef} className="fs-panel min-w-0 flex-1" style={{ background: STOPS[0].bg }}>
          {FEATURES.map((f, i) => (
            <section
              key={f.slug}
              id={`feature-${f.slug}`}
              ref={(el) => {
                if (el) sectionRefs.current[i] = el;
              }}
              aria-labelledby={`feature-${f.slug}-title`}
              className="fs-section flex flex-col gap-8 px-6 py-16 lg:min-h-screen lg:flex-row lg:items-center lg:gap-[clamp(2rem,3.5vw,4rem)] lg:py-12 lg:pr-[4%] lg:pl-[2.5%]"
              style={{ "--fs-bg": f.bg, "--fs-fg": f.fg } as CSSProperties}
            >
              {/* Portrait card, about 40% of the panel. The vh cap keeps the
                  whole card inside a short, wide window instead of letting it
                  run taller than the screen. */}
              <div className="relative aspect-[4/5] w-full shrink-0 overflow-hidden rounded-[28px] lg:aspect-[10/13] lg:w-[min(43%,61.5vh)]">
                {f.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholder label={f.label} />
                )}
              </div>

              <div className="lg:flex-1">
                <h3
                  id={`feature-${f.slug}-title`}
                  className="display font-medium tracking-[-0.02em]"
                  style={{ fontSize: "clamp(2.25rem, 4.2vw, 5.25rem)", lineHeight: 1.02 }}
                >
                  <span className="block">{f.headline[0]}</span>
                  {/* 1.25em: the brand's script-to-display ratio. Caveat 600
                      because that's the weight actually loaded; normal
                      tracking, since the tight display tracking crowds it. */}
                  <span className="script block font-semibold tracking-normal" style={{ fontSize: "1.25em" }}>
                    {f.headline[1]}
                  </span>
                </h3>
                <p
                  className="max-w-[36ch]"
                  style={{
                    fontSize: "clamp(1rem, 1.5vw, 1.625rem)",
                    lineHeight: 1.6,
                    marginTop: "clamp(1.25rem, 3vw, 4rem)",
                  }}
                >
                  {f.copy}
                </p>
              </div>
            </section>
          ))}
        </div>

        <aside
          className="sticky top-0 hidden h-screen shrink-0 self-start lg:block"
          style={{ width: "clamp(220px, 16.5vw, 340px)", background: "var(--cream)" }}
        >
          <nav aria-label="Features" className="px-7" style={{ paddingTop: "10vh" }}>
            <ol>
              {FEATURES.map((f, i) => (
                <li key={f.slug} className="flex items-center" style={{ height: "12vh", borderBottom: "1px solid rgba(44, 37, 29, 0.1)" }}>
                  {/* Progressive: every feature up to the one you're on is lit,
                      like a progress bar, rather than only the current one. */}
                  <a
                    href={`#feature-${f.slug}`}
                    onClick={(e) => jumpTo(e, i)}
                    aria-current={i === lit ? "step" : undefined}
                    className="font-medium transition-colors duration-300 ease-[ease]"
                    style={{
                      fontSize: "clamp(0.95rem, 1.05vw, 1.3rem)",
                      color: i <= lit ? "var(--ink)" : "rgba(44, 37, 29, 0.25)",
                    }}
                  >
                    {f.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
      </div>
    </section>
  );
}

// Stand-in until the real images are designed: the card's exact shape, tinted
// from the text colour so it reads correctly on every background, and it
// follows the blend automatically through currentColor.
function ImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center rounded-[28px] p-6 text-center"
      style={{
        background: "color-mix(in srgb, currentColor 12%, transparent)",
        border: "1.5px dashed color-mix(in srgb, currentColor 30%, transparent)",
      }}
    >
      <span className="text-sm font-medium opacity-60">Image — {label}</span>
    </div>
  );
}
