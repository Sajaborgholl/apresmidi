# Build prompt: scroll-driven feature section

Replaces the homepage’s "Everything’s included" section (`app/_components/FeatureShowcase.tsx`).
Modelled on three reference screenshots for layout, proportions and interaction only.

## Goal

Build a scroll-driven feature section for the Après-midi homepage, replacing "Everything's
included". Match the **layout, proportions and interaction** of the three reference screenshots
exactly. Do **not** reuse any of the reference's copy, imagery or branding. All text, colours
and fonts below are Après-midi's own.

## Layout — desktop (≥1024px)

Two columns, the full width of the page:

- **Colour panel**: `flex: 1` (about 84% of the width). Contains five subsections stacked
  vertically.
- **Title list**: right column, `width: clamp(220px, 16.5vw, 340px)`, `position: sticky; top:
  0; height: 100vh`, background `var(--cream)` (the page background, so it reads as part of the
  page rather than a second panel).

Each subsection is `min-height: 100vh`, content vertically centred, in two parts:

- **Image card** (left). Inset about 2.5% of the panel width from the panel's left edge. Width
  about 40% of the panel, `aspect-ratio: 10 / 13` (portrait), `border-radius: 28px` (the
  radius used across the site), `object-fit: cover`.
- **Text** (right of the image, gap `clamp(2rem, 3.5vw, 4rem)`), vertically centred on the image:
  - **Headline**: plain words in **Space Grotesk 500**, then emphasis words on their own line
    in **Caveat 600** at `1.25em`, the same script-to-display ratio as "Everything's included".
    `font-size: clamp(2.25rem, 4.2vw, 5.25rem)`, `line-height: 1.02`.
  - **Description**: **Inter 400**, `font-size: clamp(1rem, 1.5vw, 1.625rem)`,
    `line-height: 1.6`, `max-width: 36ch`, `margin-top: clamp(1.25rem, 3vw, 4rem)`.
  - No buttons.
  - All text is `currentColor`, inherited from the panel's tint.

## Colours and blending

**Brand colours only.** Every resting colour is a token from `app/globals.css` `:root`; nothing
outside the brand kit.

| # | Feature | Background | Text | Contrast |
|---|---|---|---|---|
| 1 | Watch RSVPs roll in | `#D7EDEB` `--blue-light` | `#2C251D` `--ink` | 12.38:1 |
| 2 | Venue on the map | `#B4C4E5` `--blue` | `#2C251D` `--ink` | 8.61:1 |
| 3 | Accept or decline | `#FFF5DC` `--yellow` | `#2C251D` `--ink` | 13.92:1 |
| 4 | Add your photos | `#FBF0A3` `--yellow-dark` | `#2C251D` `--ink` | 13.02:1 |
| 5 | Share it anywhere | `#B4C4E5` `--blue` | `#2C251D` `--ink` | 8.61:1 |

Why this palette, rather than the reference's deep backgrounds with tinted text:

- **Every readable pairing in the brand kit involves `--ink`.** The kit has one dark colour, so
  a deep-background look would mean ink on every section, and the background would never change.
- **Dark and light sections can't sit side by side.** At the crossover of a blend, background
  and text swap places and contrast falls to 1.05:1; the text vanishes mid-scroll.
- **`--cream` is not used as a background.** It is the page and title-list colour, so a cream
  section would read as no panel at all.
- **`--blue-dark` is not used as a background.** Nothing in the kit is readable on it; ink is the
  best at 4.31:1, under the 4.5:1 body text needs.
- **One colour repeats** (`--blue`) because only four pastels qualify for five sections. The
  repeat is never adjacent.

**Blending.** The panel's background **and** text colour both interpolate between adjacent
subsections according to scroll position:

- Take the viewport centre's continuous position across the subsection centres: `i + frac`.
- Colour = mix of colour `i` and colour `i + 1` at `smoothstep(frac)`. The smoothstep holds
  each colour nearly solid around its own subsection and does the blending in the handoff.
- **Interpolate in OKLCH, not sRGB.** An sRGB mix between opposed hues collapses toward grey:
  halfway from `--blue` to `--yellow` it gives `#DADDE1` at chroma 0.006, against a soft mint
  `#C0E6DC` at 0.042 in OKLCH.
- The in-between colours are, by nature, mixes rather than brand tokens; only the resting colour
  of each section is exact. Every handoff was checked end to end: text contrast never drops
  below 8.61:1.

## Title list

- Five titles, the short labels from the Copy table, in **Inter 500**,
  `font-size: clamp(0.95rem, 1.05vw, 1.3rem)`. A 1px divider below each,
  `rgba(44, 37, 29, 0.1)`. First title about 16vh from the top, about 12vh between titles.
- **Progressive**: title *n* turns **lit** (`var(--ink)`) once the viewport centre reaches
  subsection *n*, and **stays lit** after it's passed. Unlit titles are ink at 25% opacity.
  `transition: color 300ms ease`.
- **Clickable**: each title is a link to its subsection's anchor (`#feature-<slug>`) and scrolls
  it into view. Smooth scroll, or instant under `prefers-reduced-motion: reduce`.
- Semantics: `<nav aria-label="Features">`, with `aria-current="step"` on the furthest lit title.

## Copy

Real features only. Keep the constraint in `FeatureShowcase.tsx`'s header comment: no seating
or reservations, no guest-generated links, no background music, no guest messages. The product
does none of those.

| # | Title list label | Headline (plain / *Caveat emphasis*) | Description |
|---|---|---|---|
| 1 | Watch RSVPs roll in | Watch every RSVP / *roll in* | Private to you — accepted, declined, and total responses, live. |
| 2 | Venue on the map | One tap to / *the venue* | One tap opens Google Maps to the exact venue. |
| 3 | Accept or decline | Guests reply / *right on the page* | Guests RSVP right on the page and say how many are coming. |
| 4 | Add your photos | Make it yours with / *your photos* | Upload up to six photos and see them in the design instantly. |
| 5 | Share it anywhere | One private link, / *sent anywhere* | Send your private link by text, WhatsApp, or email — that's it. |

Descriptions are the existing section's copy, unchanged.

## Images

Placeholders for now. Each subsection's data has an `image: string | null` field:

- `null` renders a placeholder in the card's exact shape: fill of the text tint at 12% over
  the panel, a 1.5px dashed border in the tint at 30%, and a centred label `Image — <label>`
  in Inter 500 at 60% of the tint.
- A string renders an `<img>` with `object-fit: cover`, so real images drop in with no layout
  change. Any UI overlay chips (like the reference's badges and pickers) are part of the image
  itself, not built in HTML.

## Below 1024px

- The title list is hidden.
- Each subsection stacks: image at full width (`aspect-ratio: 4 / 5`, radius 28px), then the
  text; horizontal padding matches the page (`px-6`); height is its content plus about 4rem
  top and bottom rather than a full viewport.
- Colour blending runs exactly as on desktop.

## Engineering

- **One Client Component**, `app/_components/FeatureScroll.tsx`. The five subsections are a data
  array in the file, like the existing `TILES` in `FeatureShowcase.tsx`.
- **Scroll engine**: one passive scroll listener, throttled with `requestAnimationFrame`, and a
  `ResizeObserver` that caches subsection offsets — the pattern already used in
  `app/_components/EnvelopeScrollHero.tsx`. Write `panel.style.backgroundColor` and
  `panel.style.color` directly: `color` inherits natively, so there is no CSS-variable fan-out
  recalculating the subtree every frame. Update the lit-title state only when its index
  actually changes.
- **Progressive enhancement**: server-render every subsection with its own solid background and
  text colour, so it looks right before hydration and without JS. Once the engine starts,
  subsections go transparent and the panel paints the blended colour.
- **Sticky** works inside the page's `overflow-x-clip` wrapper; `overflow-x: clip` was tested
  in this project and does not break `position: sticky`.
- **Reduced motion**: the colour blend stays, since it's a colour change tied to position rather
  than movement; only the title-list smooth scroll becomes instant.
