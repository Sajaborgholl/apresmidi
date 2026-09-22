import type { CSSProperties } from "react";
import Reveal from "./Reveal";

// Ported from template-dont-see-your-occasion-prototype.html — see that
// file for the full derivation. Source is a Canva slide, 1366x768; every
// number below is that slide's own value converted to a % of .rc-stage (or
// of the tile it sits in), so the whole collage scales as one unit.
//
// Two gotchas that are baked into the numbers here, both of which produced
// visible bugs before they were caught:
//
//  1. Font sizes are SCALE-CORRECTED. The source nests each caption's <p>
//     inside a transform: scale() wrapper, so the <p>'s own font-size is
//     not what renders. "slay.png" reads 25.9772px but sits in a
//     scale(0.277725) wrapper (verified: 196.286 x 0.277725 = 54.515 = the
//     caption box's real outer width), so it renders at 7.21px in tile
//     space. Taking the <p> value raw made it 2.7x too big.
//
//  2. Captions scale off THEIR OWN TILE, not the canvas — each tile is its
//     own container-query context. The three "slay.png" captions really do
//     render at three different sizes in the source (9.55 / 7.82 / 10.02
//     design px) because their tiles differ, but all three are 3.6355% of
//     their own tile's width.
//
// Typography is deliberately NOT a match for the source here. The site is
// held to three faces — Space Grotesk, Inter, Caveat — so the source's own
// fonts are mapped onto that palette by role rather than by appearance:
//   - "Helvetica World" headline      -> Space Grotesk 700 (site display face)
//   - "Helvetica World" captions      -> Inter (site body face)
//   - "Times New Roman MT Condensed"  -> Caveat (site expressive face)
//   - "HK Grotesk Pro" button label   -> Inter 500 (matches site buttons)
//   - eyebrow                         -> Inter 400
// Consequence: text widths no longer match the source's, so the geometry
// below (which is still source-exact) and the type no longer line up as
// tightly as they did — most visibly where the blue badge sits under the
// eyebrow. Everything else — positions, photo boxes, assets — is unchanged.

const ASSETS = "/homepage/request-category";

// "slay.png" tiles — grey file-window cards. Three layers, exactly as the
// source stacks them: a grey backing card, the photo at its own inset, and
// a grey bar redrawn over the photo's top edge. Collapsing the last two
// into "start the photo where the bar ends" changes the photo's aspect box
// and makes object-fit: cover crop a different slice of the image.
const WINDOW_TILES = [
  {
    src: `${ASSETS}/photo-thanksgiving.jpg`,
    alt: "Friends eating together at a Thanksgiving party",
    top: "18.782%", left: "6.563%", width: "19.229%", height: "40.883%",
    radius: "3.8075cqw", cardHeight: "99.6678%",
    photoTop: "5.3248%", photoHeight: "94.6752%",
    // Not centred in the source: translate(-105.411) of a 179.708 overflow.
    objectPosition: "58.657% center",
    barTop: "4.1932%", barHeight: "2.9244%", captionTop: "1.4462%",
  },
  {
    src: `${ASSETS}/photo-selfie-2.jpg`,
    alt: "Friends taking a selfie",
    top: "18.782%", left: "72.618%", width: "15.756%", height: "33.397%",
    radius: "4.6460cqw", cardHeight: "100%",
    photoTop: "5.0093%", photoHeight: "94.9907%",
    objectPosition: "center",
    barTop: "4.2072%", barHeight: "2.9342%", captionTop: "1.4511%",
  },
  {
    src: `${ASSETS}/photo-beach-wedding.jpg`,
    alt: "Couple embracing at a beach wedding",
    top: "43.117%", left: "74.795%", width: "20.18%", height: "42.766%",
    radius: "3.6278cqw", cardHeight: "100%",
    photoTop: "5.0093%", photoHeight: "94.9907%",
    objectPosition: "center",
    barTop: "4.2072%", barHeight: "2.9342%", captionTop: "1.4511%",
  },
];

// "Details.jpg" tiles — a grey-framed photo with the filename underneath.
// Frame thickness is the source's SVG stroke clipped to the photo rect, so
// half of it shows: stroke/2 over the photo's width. Two tiles use stroke
// 21.3006 (9.2487%), the pool one 20.9591 (9.0990%).
const POLAROID_TILES = [
  {
    src: `${ASSETS}/photo-selfie.jpg`,
    alt: "Friends taking a selfie outdoors",
    top: "52.17%", left: "21.436%", width: "8.714%", height: "22.705%",
    frame: "9.2487cqw", photoHeight: "84.6483%", captionTop: "89.8670%",
  },
  {
    src: `${ASSETS}/photo-graduation.jpg`,
    alt: "Graduation caps thrown in the air",
    top: "72.834%", left: "12.72%", width: "8.714%", height: "22.705%",
    frame: "9.2487cqw", photoHeight: "84.6483%", captionTop: "89.8670%",
  },
  {
    src: `${ASSETS}/photo-pool.jpg`,
    alt: "Friends at a pool party",
    top: "64.505%", left: "5.622%", width: "8.855%", height: "23.152%",
    frame: "9.0990cqw", photoHeight: "84.3654%", captionTop: "89.5670%",
  },
];

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

.rc-window-card {
  position: absolute;
  inset: 0 0 auto 0;
  background: #dad8db;
  border-radius: var(--r);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.13);
}
.rc-window-photo {
  position: absolute;
  left: 0;
  width: 100%;
  object-fit: cover;
  display: block;
  border-radius: var(--r);
}
/* Same grey as the card, over the photo's top edge — this is what squares
   off the photo's rounded top corners in the source. */
.rc-window-bar { position: absolute; left: 0; width: 100%; background: #dad8db; }

.rc-window-caption {
  position: absolute;
  left: 3.1992%;
  width: 27.4735%;
  text-align: center;
  font-family: Inter, sans-serif;
  font-weight: 700;
  font-size: 3.6355cqw;
  line-height: 1.27;
  letter-spacing: -0.015em;
  color: #000;
  text-shadow: 0 0.04em 0.05em rgba(0, 0, 0, 0.08);
  white-space: nowrap;
}

.rc-polaroid-photo {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  object-fit: cover;
  display: block;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.13);
}
/* The frame is an overlay sharing the photo's exact box, drawn as an inset
   box-shadow spread. It can't be a border on the <img> (that shrinks the
   content box, so cover crops a different slice: 0.8064 vs the source's
   0.8059 aspect), and it can't be a border/outline on the overlay either
   (browsers quantise those to a 0.5px grid — 7.841px paints as 7.5px).
   box-shadow spread is painted at sub-pixel precision. */
.rc-polaroid-frame {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  box-shadow: inset 0 0 0 var(--frame) #d9d9d9;
  pointer-events: none;
}
.rc-polaroid-caption {
  position: absolute;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-size: 12.727cqw;
  line-height: 1.35;
  letter-spacing: 0.025em;
  color: #000;
  white-space: nowrap;
}

/* Square corners: the source's clip path for this shape is
   M0,0L1178.47,0L1178.47,256L0,256Z — a sharp rectangle. */
.rc-yellow-blob { background: #fbf0a3; }

/* The blue highlight is the real cropped asset, not a CSS recreation — a
   CSS version of this compound shape (translucent rect + two solid
   end-bars) kept not-quite-matching, so this uses the literal pixels. */
.rc-blue-badge { width: 100%; height: 100%; object-fit: fill; display: block; }

.rc-eyebrow, .rc-headline, .rc-subhead { text-align: center; margin: 0; color: #000; line-height: 1.2; }
.rc-eyebrow { font-family: Inter, sans-serif; font-weight: 400; letter-spacing: -0.03em; font-size: calc(26.667 / 1366 * 100cqw); }
.rc-headline { font-family: "Space Grotesk", sans-serif; font-weight: 700; letter-spacing: -0.03em; font-size: calc(101.311 / 1366 * 100cqw); }
/* Caveat carries the expressive line the source set in Times italic. No
   font-style: italic — Caveat has no true italic and a synthesised oblique
   on a handwriting face looks wrong; it already slants. This also matches
   the mobile fallback below, which was always .script/Caveat. */
.rc-subhead { font-family: Caveat, cursive; font-weight: 700; font-size: calc(93.333 / 1366 * 100cqw); }

.rc-cursor-icon, .rc-arrow-icon { width: 100%; height: 100%; object-fit: contain; display: block; }

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

@media (prefers-reduced-motion: reduce) {
  .rc-cta-trigger { transition: none; }
}
`;

export default function RequestCategorySection() {
  return (
    <section className="px-6 md:px-12 py-16 md:py-20" style={{ background: "#fff5dc" }}>
      <style>{CSS}</style>
      <Reveal>
        <div className="mx-auto max-w-5xl">
          {/* Desktop: the full photo-collage design. Hidden below md — at
              phone widths this 1366x768 wide-aspect collage would squash
              into a sliver too short to hold six photos and three lines
              of text legibly, so mobile gets a simplified stack instead. */}
          <div className="rc-stage hidden md:block">
            {WINDOW_TILES.map((t) => (
              <div
                key={t.src}
                className="rc-el rc-tile"
                style={{ top: t.top, left: t.left, width: t.width, height: t.height, "--r": t.radius } as CSSProperties}
              >
                <div className="rc-window-card" style={{ height: t.cardHeight }} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="rc-window-photo"
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  style={{ top: t.photoTop, height: t.photoHeight, objectPosition: t.objectPosition }}
                />
                <div className="rc-window-bar" style={{ top: t.barTop, height: t.barHeight }} />
                <span className="rc-window-caption" style={{ top: t.captionTop }}>slay.png</span>
              </div>
            ))}

            {POLAROID_TILES.map((t) => (
              <div
                key={t.src}
                className="rc-el rc-tile"
                style={{ top: t.top, left: t.left, width: t.width, height: t.height, "--frame": t.frame } as CSSProperties}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="rc-polaroid-photo"
                  src={t.src}
                  alt={t.alt}
                  loading="lazy"
                  style={{ height: t.photoHeight }}
                />
                <div className="rc-polaroid-frame" style={{ height: t.photoHeight }} />
                <span className="rc-polaroid-caption" style={{ top: t.captionTop }}>Details.jpg</span>
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="rc-el rc-arrow-icon"
              src={`${ASSETS}/arrow.svg`}
              alt=""
              aria-hidden="true"
              style={{ top: "70.048%", left: "48.156%", width: "3.687%", height: "5.574%", transform: "rotate(49.881deg)" }}
            />

            {/* blue highlight, sits behind the eyebrow text (under "occasion") */}
            <div className="rc-el" style={{ top: "10.16%", left: "48.68%", width: "9.339%", height: "4.88%" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rc-blue-badge" src={`${ASSETS}/occasion-highlight-badge.png`} alt="" aria-hidden="true" />
            </div>
            <div className="rc-el" style={{ top: "10.0%", left: "33.372%", width: "27.87%", height: "4.167%" }}>
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
                inquiry form (PremiumInquiryForm auto-expands at #premium). */}
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
            <p className="script mt-1 text-3xl" style={{ color: "var(--ink)" }}>
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
