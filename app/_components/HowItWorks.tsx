// Sticky-stack "How it Works": each step is a full-width card that pins at
// the top of the viewport as the next one slides up and stacks over it.
// Pure CSS (position: sticky + a staggered `top` per card) — no scroll
// listeners, no JS at all, so this stays a plain Server Component. The
// staggered `top` offsets are what let each earlier card's rounded top
// edge keep peeking out above the one stacked over it.
type Step = {
  title: [string, string];
  body: string;
  tags: string[];
  bg: string;
  fg: string;
  tagBg: string;
};

const STEPS: Step[] = [
  {
    title: ["Pick a", "Template"],
    body: "Browse wedding, birthday, and baptism designs, and pick the one that matches your event.",
    tags: ["Wedding", "Birthday", "Baptism", "Bachelorette"],
    bg: "var(--ink)",
    fg: "var(--cream)",
    tagBg: "rgba(255,255,255,0.14)",
  },
  {
    title: ["Customize", "It"],
    body: "Add your names, date, venue, and photos. Watch the preview update as you type.",
    tags: ["Names & Date", "Venue", "Photos", "Live Preview"],
    bg: "var(--blue)",
    fg: "var(--ink)",
    tagBg: "rgba(31,36,48,0.08)",
  },
  {
    title: ["Share the", "Link"],
    body: "Get a private link for your invite and send it however you reach your guests: text, WhatsApp, email.",
    tags: ["Text", "WhatsApp", "Email", "Private Link"],
    bg: "var(--yellow)",
    fg: "var(--ink)",
    tagBg: "rgba(31,36,48,0.08)",
  },
  {
    title: ["Watch RSVPs", "Come In"],
    body: "Guests tap RSVP right on the page. You see who's coming, no spreadsheet required.",
    tags: ["Accept / Decline", "Guest Count", "Live Dashboard", "No Spreadsheet"],
    bg: "var(--ink)",
    fg: "var(--cream)",
    tagBg: "rgba(255,255,255,0.14)",
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
              className="sticky rounded-[28px] px-7 py-10 md:px-11 md:py-12 mb-8 last:mb-0 min-h-[300px] md:min-h-[340px] flex flex-col justify-center"
              style={{
                top: `${90 + i * 26}px`,
                background: step.bg,
                color: step.fg,
                boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
              }}
            >
              <div className="text-[13px] font-extrabold tracking-wide opacity-55">
                0{i + 1} / 0{STEPS.length}
              </div>
              <h3 className="display mt-2.5 text-4xl font-extrabold leading-[1.02] md:text-5xl">
                <span className="block">{step.title[0]}</span>
                <span className="block opacity-45">{step.title[1]}</span>
              </h3>
              <p className="mt-4 max-w-[46ch] text-[15.5px] leading-relaxed opacity-75">{step.body}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {step.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
                    style={{ background: step.tagBg }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
