import type { CSSProperties } from "react";
import Reveal from "./Reveal";

// Ported from template-dont-see-your-occasion-prototype.html — see that
// file for the full derivation. Source is a Canva slide, 1366x768; every
// number below is that slide's own value converted to a % of .rc-stage (or
// of the tile it sits in), so the whole collage scales as one unit.
//
// The source's file-name captions ("slay.png", "Details.jpg") and the frames
// they sat in have since been removed, so the scale-corrected caption sizing
// described in the prototype no longer applies here.
//
// Typography is deliberately NOT a match for the source here. The site is
// held to three faces — Space Grotesk, Inter, Ms Madi — so the source's own
// fonts are mapped onto that palette by role rather than by appearance:
//   - "Helvetica World" headline      -> Space Grotesk 700 (site display face)
//   - "Times New Roman MT Condensed"  -> Ms Madi (site expressive face)
//   - "HK Grotesk Pro" button label   -> Inter 500 (matches site buttons)
//   - eyebrow                         -> Space Grotesk 700 (same face as the
//                                        headline, as on the mobile layout)
// Consequence: text widths no longer match the source's, so the geometry
// below (which is still source-exact) and the type no longer line up as
// tightly as they did. The source's blue highlight under "occasion" has
// been removed. Everything else — positions, photo boxes, assets — is
// unchanged.

const ASSETS = "/homepage/request-category";

// The six collage photos. Each keeps the photo box it had in the source
// slide — the grey file-window cards ("slay.png") and polaroid frames
// ("Details.jpg") that used to surround them were removed at the user's
// request, and every photo is now simply rounded with a 3px black border
// (.rc-photo below). Positions and photo boxes are still source-exact, as %
// of the stage and of each tile; photoTop / photoHeight place the photo
// where it sat inside its old frame, so nothing shifts.
const WINDOW_TILES = [
  {
    src: `${ASSETS}/photo-graduation-card.jpg`,
    alt: "Graduation invitation design with a childhood photo and a graduation photo",
    top: "18.782%", left: "6.563%", width: "19.229%", height: "40.883%",
    photoTop: "5.3248%", photoHeight: "94.6752%",
    // A taller image than this slot (0.71 vs 0.88), so cover trims about a
    // fifth of its height. Weighted toward the bottom so the "and that's
    // The End" title at the top stays whole and the trim comes off the grass.
    objectPosition: "center 12%",
  },
  {
    src: `${ASSETS}/photo-thanksgiving.jpg`,
    alt: "Friends eating together at a Thanksgiving party",
    top: "18.782%", left: "72.618%", width: "15.756%", height: "33.397%",
    photoTop: "5.0093%", photoHeight: "94.9907%",
    // Off-centre, as in the source slide where this photo first sat in the
    // big left slot (translate(-105.411) of a 179.708 overflow); this slot
    // has the same proportions, so the same framing carries over.
    objectPosition: "58.657% center",
  },
  {
    src: `${ASSETS}/photo-beach-wedding.jpg`,
    alt: "Couple embracing at a beach wedding",
    top: "43.117%", left: "74.795%", width: "20.18%", height: "42.766%",
    photoTop: "5.0093%", photoHeight: "94.9907%",
    objectPosition: "center",
  },
];

// The three small photos. photoHeight is the photo's share of its tile; the
// rest was the old "Details.jpg" caption's space and is now simply empty.
const POLAROID_TILES = [
  {
    src: `${ASSETS}/photo-selfie.jpg`,
    alt: "Friends taking a selfie outdoors",
    top: "52.17%", left: "21.436%", width: "8.714%", height: "22.705%",
    photoHeight: "84.6483%",
  },
  {
    src: `${ASSETS}/photo-graduation.jpg`,
    alt: "Graduation cupcakes topped with caps and diplomas",
    top: "72.834%", left: "12.72%", width: "8.714%", height: "22.705%",
    photoHeight: "84.6483%",
  },
  {
    src: `${ASSETS}/photo-disco.jpg`,
    alt: "Disco ball hanging among colourful streamers and paper chains",
    top: "64.505%", left: "5.622%", width: "8.855%", height: "23.152%",
    photoHeight: "84.3654%",
  },
];

// The photos render 20% larger than in the source slide. The whole photo
// group is scaled as one unit about the stage centre — sizes by the factor,
// and each tile's distance from the centre by the same factor — so the
// collage keeps its exact arrangement, just bigger, while the text in the
// middle keeps its size and place and the photos grow away from it rather
// than into it. The photo inside each tile is placed by % of the tile, so
// it grows along with it; the border and corner radius stay fixed in px.
//
// 1.2 is the most that fits every desktop width: at 1024px the stage is
// 928px with a 48px gutter, and the right-most photo overhangs the stage by
// 37px; 1.25 would be clipped by the viewport there. The data arrays above
// stay source-exact; only the rendered geometry goes through this.
const PHOTO_SCALE = 1.2;

function enlarge(t: { top: string; left: string; width: string; height: string }) {
  // Unary + drops trailing zeros ("49.060" -> 49.06): the browser normalises
  // the style attribute that way, and a server/client string mismatch there
  // is flagged as a hydration error.
  const fromCentre = (v: string) => `${+(50 + (parseFloat(v) - 50) * PHOTO_SCALE).toFixed(3)}%`;
  const grow = (v: string) => `${+(parseFloat(v) * PHOTO_SCALE).toFixed(3)}%`;
  return { top: fromCentre(t.top), left: fromCentre(t.left), width: grow(t.width), height: grow(t.height) };
}

const CSS = `
.rc-stage {
  container-type: inline-size;
  position: relative;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  aspect-ratio: 1366 / 768;
}

.rc-el { position: absolute; }

/* No position declaration here on purpose — every tile also carries .rc-el
   (position: absolute), which already establishes the containing block for
   the absolutely-positioned layers inside. Declaring position: relative
   here would override .rc-el at equal specificity and drop the tiles out
   of their absolute placement. */
.rc-tile { container-type: inline-size; }

/* Every collage photo: rounded, with a 3px black border and the soft drop
   shadow the old frames carried. The border sits inside the photo's box
   (border-box), so tile sizes and positions are unchanged; cover crops a
   hair more of each image as a result, which is invisible at this size. */
.rc-photo {
  position: absolute;
  left: 0;
  width: 100%;
  object-fit: cover;
  display: block;
  border: 3px solid #000;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.13);
}
/* The three small photos get a tighter radius, in proportion to their size. */
.rc-photo-small { top: 0; border-radius: 14px; }

/* Square corners: the source's clip path for this shape is
   M0,0L1178.47,0L1178.47,256L0,256Z — a sharp rectangle. */
.rc-yellow-blob { background: #fbf0a3; }

.rc-eyebrow, .rc-headline, .rc-subhead { text-align: center; margin: 0; color: #000; line-height: 1.2; }
/* The eyebrow is set in the headline's own face and weight, matching the
   mobile layout below. nowrap: the bolder face runs a little wider than the
   Inter it replaced, and the line must never break inside its box. */
.rc-eyebrow { font-family: "Space Grotesk", sans-serif; font-weight: 700; letter-spacing: -0.03em; white-space: nowrap; font-size: calc(26.667 / 1366 * 100cqw); }
.rc-headline { font-family: "Space Grotesk", sans-serif; font-weight: 700; letter-spacing: -0.03em; font-size: calc(101.311 / 1366 * 100cqw); }
/* Ms Madi (the site's .script face) carries the expressive line the source
   set in Times italic. No font-style: italic — it's a script that already
   slants, and a synthesised oblique on top looks wrong. One weight only, so
   no bold either. Sized to sit inside the yellow highlight block behind it.
   This matches the mobile fallback below, which uses .script. */
.rc-subhead { font-family: "Ms Madi", cursive; font-weight: 400; font-synthesis: none; font-size: calc(94 / 1366 * 100cqw); }

.rc-cursor-icon { width: 100%; height: 100%; object-fit: contain; display: block; }

/* The "Get Premium" CTA — the source's own button-pill image, not a CSS
   approximation. It's an anchor to #premium: the Premium plan in the
   pricing section, whose inquiry form opens itself on that hash. */
.rc-cta-trigger {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: transform 150ms ease;
}
.rc-cta-trigger:active { transform: scale(0.97); }
.rc-cta-trigger img { width: 100%; height: 100%; object-fit: fill; display: block; }
.rc-cta-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Inter, sans-serif;
  font-weight: 500;
  color: #fff;
  font-size: calc(21.333 / 1366 * 100cqw);
  pointer-events: none;
}

/* The collage assembles on arrival: each photo starts shifted out toward its
   nearest screen edge and scaled up, then travels to the position the Canva
   source defines. Everything above stays the final state — nothing here moves
   where a tile ends up, only where it comes from.

   Driven off .reveal-visible, which the Reveal wrapper already adds when the
   section enters the viewport, so this needs no observer of its own.

   Only transform is animated: it skips layout and paint and runs on the GPU,
   which matters with six photos moving at once. */
.rc-section { overflow-x: clip; }

/* Reveal's own fade-and-lift is cancelled here. Left on, the wrapper lifts the
   whole block while six tiles fly in underneath it — two motions competing to
   say the same thing. Two classes, so this beats .reveal on specificity. */
.reveal.rc-reveal {
  opacity: 1;
  transform: none;
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  .rc-tile-anim {
    transform: translateX(var(--rc-from-x)) scale(var(--rc-from-scale));
    /* Grow away from the middle, so a scaled-up tile stays pinned to the edge
       it came from instead of creeping back toward centre. */
    transform-origin: var(--rc-origin) center;
    transition: transform 900ms cubic-bezier(0.23, 1, 0.32, 1);
    transition-delay: var(--rc-delay);
  }

  .reveal-visible .rc-tile-anim {
    transform: none;
  }
}
`;

// Where a tile travels from. Side is read off the position the collage
// already defines rather than stored again — a tile past the halfway mark
// belongs to the right group. Every tile on a side shifts by the same amount,
// which is what keeps the group's spacing intact on the way in: the collage
// starts wide and loose, not piled up at the edge.
//
// The shift is viewport-relative so it tracks the screen edge, but clamped:
// the stage caps at 1100px and centres, so an unbounded vw would fling tiles
// far past the edge on a wide monitor and barely move them on a small laptop.
const SHIFT = "clamp(120px, 14vw, 320px)";
const STAGGER_MS = 70;

// The cascade sweeps left to right across the composition, rather than
// following the order the two arrays happen to be declared in — that order
// interleaves the sides (big left, right, right, then three small left) and
// reads as random rather than choreographed. Ranking by the horizontal
// position the collage already defines costs no extra data.
const STAGGER_RANK = new Map<string, number>(
  [...WINDOW_TILES, ...POLAROID_TILES]
    .map((t) => t.left)
    .sort((a, b) => parseFloat(a) - parseFloat(b))
    .map((left, i) => [left, i] as const),
);

function fromEdge(left: string): CSSProperties {
  const isLeft = parseFloat(left) < 50;
  return {
    "--rc-from-x": isLeft ? `calc(-1 * ${SHIFT})` : SHIFT,
    "--rc-from-scale": "1.25",
    "--rc-origin": isLeft ? "left" : "right",
    "--rc-delay": `${(STAGGER_RANK.get(left) ?? 0) * STAGGER_MS}ms`,
  } as CSSProperties;
}

export default function RequestCategorySection() {
  return (
    <section className="rc-section px-6 md:px-12 py-16 md:py-20" style={{ background: "#fff5dc" }}>
      <style>{CSS}</style>
      {/* Held back from the bottom edge so the spread-out start state is
          actually seen before it resolves. At -40% the tiles move once the
          collage's top edge reaches mid-screen, with about three-quarters of
          it in view; -22% fired with barely half on screen, so the spread was
          only glimpsed. A fraction of the screen, so the fire point stays at
          much the same place on any window height. */}
      <Reveal className="rc-reveal" rootMargin="0px 0px -40% 0px">
        <div className="mx-auto max-w-5xl">
          {/* Desktop: the full photo-collage design. Hidden below md — at
              phone widths this 1366x768 wide-aspect collage would squash
              into a sliver too short to hold six photos and three lines
              of text legibly, so mobile gets a simplified stack instead. */}
          <div className="rc-stage hidden md:block">
            {WINDOW_TILES.map((t) => (
              <div
                key={t.src}
                className="rc-el rc-tile rc-tile-anim"
                style={{ ...enlarge(t), ...fromEdge(t.left) } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="rc-photo"
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  style={{ top: t.photoTop, height: t.photoHeight, objectPosition: t.objectPosition }}
                />
              </div>
            ))}

            {POLAROID_TILES.map((t) => (
              <div
                key={t.src}
                className="rc-el rc-tile rc-tile-anim"
                style={{ ...enlarge(t), ...fromEdge(t.left) } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="rc-photo rc-photo-small"
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  style={{ height: t.photoHeight }}
                />
              </div>
            ))}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="rc-el rc-cursor-icon"
              src={`${ASSETS}/cursor-icon.png`}
              alt=""
              aria-hidden="true"
              style={{ top: "66.006%", left: "71.398%", width: "2.457%", height: "6.829%" }}
            />

            {/* Centred on the stage, on the headline's own box. The source's box
                sat left of centre to line up with the blue highlight under
                "occasion"; with that gone, the offset only read as a
                misalignment against "Don't Worry!" below. */}
            <div className="rc-el" style={{ top: "10.0%", left: "28.339%", width: "43.328%", height: "4.167%" }}>
              <h3 className="rc-eyebrow">Don&rsquo;t see your occasion?</h3>
            </div>

            <div className="rc-el" style={{ top: "32.663%", left: "28.339%", width: "43.328%", height: "15.72%" }}>
              <p className="rc-headline">Don&rsquo;t Worry!</p>
            </div>

            <div className="rc-el rc-yellow-blob" style={{ top: "53.41%", left: "33.37%", width: "37.078%", height: "14.326%" }} />
            <div className="rc-el" style={{ top: "54.925%", left: "29.235%", width: "44.895%", height: "14.496%" }}>
              <p className="rc-subhead">We&rsquo;ll design it</p>
            </div>

            {/* Jumps to the Premium plan in the pricing section and opens its
                inquiry form (PlanRequestDialog opens its window at #premium). */}
            <a
              className="rc-el rc-cta-trigger"
              href="#premium"
              style={{ top: "79.091%", left: "42.238%", width: "14.522%", height: "6.798%" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${ASSETS}/get-premium-button-bg.png`} alt="" aria-hidden="true" />
              <span className="rc-cta-label">Get Premium</span>
            </a>
          </div>

          {/* Mobile: same copy, no collage, using the site's own type system. */}
          <div className="mx-auto flex max-w-md flex-col items-center text-center md:hidden">
            <h3 className="display text-sm font-bold" style={{ color: "var(--ink)" }}>
              Don&rsquo;t see your occasion?
            </h3>
            <p className="display mt-2 text-4xl font-bold" style={{ color: "var(--ink)" }}>
              Don&rsquo;t Worry!
            </p>
            <p className="script mt-1 text-5xl" style={{ color: "var(--ink)" }}>
              We&rsquo;ll design it
            </p>
            <a
              href="#premium"
              className="mt-6 inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold transition active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Get Premium
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
