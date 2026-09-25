// Sticky-stack "How it Works": each step is a full-width card that pins at
// the top of the viewport as the next one slides up and stacks over it.
// Pure CSS (position: sticky + a staggered `top` per card) — no scroll
// listeners, no JS at all, so this stays a plain Server Component. The
// staggered `top` offsets are what let each earlier card's rounded top
// edge keep peeking out above the one stacked over it.
// The /dist/ssr entry, like the other Server Components that use Phosphor
// (FeatureShowcase, Pricing, the dashboard page). Importing from the package
// root instead would pull in its client runtime and force this section to
// become a Client Component for nothing but four static glyphs.
//
// The *Icon names are the current ones — the bare SquaresFour / PencilSimple
// aliases the rest of the app still imports are marked @deprecated upstream.
import {
  SquaresFourIcon,
  PencilSimpleIcon,
  LinkSimpleIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

// Taken off an icon rather than imported: the shared Icon type lives at
// dist/lib/types, which the ssr entry does not re-export, and reaching into
// the package's internals for it would break on any repackaging.
type PhosphorIcon = typeof SquaresFourIcon;

type Step = {
  title: [string, string];
  body: string;
  bg: string;
  fg: string;
  // Tint behind the step icon. Per-card because the cards alternate dark and
  // light: a translucent white reads as a badge on ink and vanishes on yellow.
  iconBg: string;
  // The icon draws in currentColor, i.e. fg — the card's own proven text
  // colour — so a step icon cannot reintroduce the contrast problem the faded
  // title line had on the pale cards.
  Icon: PhosphorIcon;
  // Opacity of the big step numeral. Higher on the dark cards: a faint cream
  // on near-black holds its shape, while the same value in ink over the pale
  // blue and yellow turns to mud well before it gets subtle.
  numeralOpacity: number;
  // Opacity of the second title line. Per-card rather than one shared value:
  // the same fade behaves differently depending on which way it runs. Fading
  // cream toward a near-black card keeps plenty of separation, but fading ink
  // toward a pale card walks the text into its own background — 0.45 measures
  // 2.4:1 on --blue and 2.7:1 on --yellow, under the 3:1 WCAG AA floor for
  // large text, against 4.07:1 on the dark cards.
  titleFade: number;
};

const STEPS: Step[] = [
  {
    title: ["Pick a", "Template"],
    body: "Browse wedding, birthday, and bachelorette designs, and pick the one that matches your event.",
    bg: "var(--ink)",
    fg: "var(--cream)",
    iconBg: "rgba(255,255,255,0.14)",
    numeralOpacity: 0.24,
    Icon: SquaresFourIcon,
    titleFade: 0.45,
  },
  {
    title: ["Customize", "It"],
    body: "Add your names, date, venue, and photos. Watch the preview update as you type.",
    bg: "var(--blue)",
    fg: "var(--ink)",
    iconBg: "rgba(31,36,48,0.08)",
    numeralOpacity: 0.3,
    Icon: PencilSimpleIcon,
    titleFade: 0.6,
  },
  {
    title: ["Share the", "Link"],
    body: "Get a private link for your invite and send it however you already reach your guests.",
    bg: "var(--yellow)",
    fg: "var(--ink)",
    iconBg: "rgba(31,36,48,0.08)",
    numeralOpacity: 0.3,
    Icon: LinkSimpleIcon,
    titleFade: 0.6,
  },
  {
    title: ["Watch RSVPs", "Come In"],
    body: "Guests tap RSVP right on the page. You see who's coming, no spreadsheet required.",
    bg: "var(--ink)",
    fg: "var(--cream)",
    iconBg: "rgba(255,255,255,0.14)",
    numeralOpacity: 0.24,
    // The icon the real dashboard uses for guest counts, so the promise here
    // and the product a host actually lands in are marked the same way.
    Icon: UsersThreeIcon,
    titleFade: 0.45,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 md:px-12 pt-16">
      <div className="mx-auto max-w-[1100px]">
        <h2 className="display text-2xl font-bold md:text-3xl">How it Works</h2>
        <p className="mt-1.5 text-sm opacity-60">Four steps, from first browse to first RSVP.</p>

        <div className="relative mt-8">
          {STEPS.map((step, i) => (
            <div
              key={step.title.join(" ")}
              className="hiw-card sticky overflow-hidden rounded-[28px] px-7 py-10 md:px-11 md:py-12 mb-8 last:mb-0 min-h-[300px] md:min-h-[340px] flex flex-col justify-center"
              style={{
                top: `calc(var(--hiw-stack-top) + var(--hiw-stack-step) * ${i})`,
                background: step.bg,
                color: step.fg,
              }}
            >
              {/* The step number as a typographic element rather than an
                  "01 / 04" eyebrow label. Zero-padding and the denominator
                  were both dressing redundant information as design — there
                  are four cards, visibly, and the subhead says so. Set large
                  and faint it reads as a deliberate mark; aria-hidden because
                  the sequence is already carried by the heading order. Sits
                  against the card's own text colour, so it tints correctly on
                  both the dark and the pale cards without its own token. */}
              <span
                aria-hidden="true"
                className="display pointer-events-none absolute -top-2 right-4 select-none font-extrabold leading-none md:right-8"
                style={{ fontSize: "clamp(92px, 13vw, 168px)", opacity: step.numeralOpacity }}
              >
                {i + 1}
              </span>

              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: step.iconBg }}
              >
                <step.Icon size={20} weight="regular" />
              </div>
              <h3 className="display mt-5 text-4xl font-extrabold leading-[1.02] md:text-5xl">
                <span className="block">{step.title[0]}</span>
                <span className="block" style={{ opacity: step.titleFade }}>
                  {step.title[1]}
                </span>
              </h3>
              <p className="mt-4 max-w-[46ch] text-[15.5px] leading-relaxed opacity-75">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
