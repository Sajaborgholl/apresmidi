import Reveal from "./Reveal";
import CategoryRequestForm from "./CategoryRequestForm";

// A hand-drawn "marker circle" wrapped around a word/phrase — an
// absolutely-positioned SVG behind the text, drawn as a single wobbly
// closed stroke (irregular anchor points rather than a perfect ellipse) so
// it reads as a felt-pen doodle. preserveAspectRatio="none" lets it stretch
// to fit whatever width the wrapped text ends up being, same technique
// used for the full-bleed decorative SVGs in
// app/i/[slug]/_designs/BacheloretteCoastal.tsx (Stripes/DoilyFrame).
function HandCircle({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap px-1">
      <svg
        className="absolute pointer-events-none"
        style={{ top: "-22%", left: "-8%", width: "116%", height: "144%" }}
        viewBox="0 0 200 90"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 24 46 C 18 18, 70 6, 106 8 C 150 10, 190 20, 192 48 C 194 74, 148 86, 100 84 C 54 82, 12 76, 24 46 Z"
          fill="none"
          stroke="var(--blue-dark)"
          strokeWidth={4}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

// A double marker-underline sat directly under a word/phrase — two
// separately-wobbled strokes, close together but not identical (a real
// double-underline is never two perfectly parallel lines), same
// absolutely-positioned-SVG-behind-the-text technique as HandCircle above.
function HandDoubleUnderline({ children }: { children: React.ReactNode }) {
  return (
    <span className="relative inline-block whitespace-nowrap">
      <svg
        className="absolute pointer-events-none"
        style={{ left: "-3%", bottom: "-13px", width: "106%", height: 16 }}
        viewBox="0 0 200 20"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 4 7 C 55 2, 120 11, 196 4"
          fill="none"
          stroke="var(--yellow-dark)"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <path
          d="M 6 14 C 70 10, 125 17, 194 12"
          fill="none"
          stroke="var(--yellow-dark)"
          strokeWidth={3}
          strokeLinecap="round"
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

// Small curved doodle arrow pointing from the sub-copy down toward the CTA
// — same single-stroke ink style as the decorations already used inside
// the template designs (e.g. the shell illustration in
// BacheloretteCoastal.tsx).
function DoodleArrow() {
  return (
    <svg width={54} height={54} viewBox="0 0 54 54" aria-hidden="true" className="mx-auto">
      <path
        d="M 27 4 C 20 18, 34 30, 24 44"
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2.4}
        strokeLinecap="round"
        opacity={0.55}
      />
      <path
        d="M 15 38 L 24 44 L 30 34"
        fill="none"
        stroke="var(--ink)"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.55}
      />
    </svg>
  );
}

const EXAMPLE_CHIPS: { label: string; color: string; rot: number }[] = [
  { label: "Graduation", color: "var(--blue)", rot: -6 },
  { label: "Baby Shower", color: "var(--yellow)", rot: 4 },
  { label: "Retirement Party", color: "var(--blue-light)", rot: -3 },
  { label: "Corporate Event", color: "var(--yellow)", rot: 5 },
  { label: "Housewarming", color: "var(--blue)", rot: -4 },
  { label: "Gender Reveal", color: "var(--blue-light)", rot: 3 },
];

export default function RequestCategorySection() {
  return (
    <section className="notebook-paper px-6 md:px-12 py-16 md:py-20">
      <Reveal>
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="marker text-3xl leading-snug md:text-4xl" style={{ color: "var(--ink)" }}>
            Psst&hellip; don&apos;t see <HandCircle>your occasion</HandCircle>?
          </h2>

          <p className="script mt-5 text-2xl leading-snug md:text-3xl" style={{ color: "var(--ink)" }}>
            Graduation, baby shower, retirement, corporate events — if it deserves an invite,
            <br className="hidden md:block" /> <HandDoubleUnderline>we&apos;ll design it.</HandDoubleUnderline>
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {EXAMPLE_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className="sticky-chip script text-xl"
                style={{ background: chip.color, transform: `rotate(${chip.rot}deg)` }}
              >
                {chip.label}
              </span>
            ))}
          </div>

          <div className="mt-6">
            <DoodleArrow />
          </div>

          <div className="mt-2">
            <CategoryRequestForm />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
