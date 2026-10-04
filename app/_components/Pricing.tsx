import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Reveal from "./Reveal";
import PlanRequestDialog from "./PlanRequestDialog";
import { PLUS_ADDON_GROUPS, REQUEST_PLANS, STANDARD_PLAN } from "@/lib/plans";

// Three plans. Only Standard is self-serve: its price (STANDARD_PLAN in
// lib/plans.ts, also shown on every template page) must match
// STANDARD_PRICE_USD in app/order/[slug]/actions.ts, which is what Whish
// actually charges. Plus and Premium are "starting at" prices collected as a
// request (PlanRequestDialog, a centred window) and quoted by hand, so nothing charges $180 or
// $280 automatically.
const PREMIUM_FEATURES = [
  "Everything in Plus",
  "Fully custom design",
  "New features built around your story",
  "1:1 with our team",
];

// The white cards (Standard and Premium). Plus is the dark one in between.
const lightCardClass = "rounded-[28px] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl md:p-9";
const lightCardStyle = { background: "#fff", border: "1px solid rgba(0,0,0,0.08)" };

// Exported for the template detail page, which shows the Standard list too.
export function FeatureList({ features, check, opacity }: { features: string[]; check: string; opacity: string }) {
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5 text-[14.5px]">
          <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" style={{ color: check }} />
          <span className={opacity}>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Pricing() {
  return (
    <section id="pricing" className="px-6 md:px-12 py-16">
      <Reveal>
        <h2 className="display text-2xl font-bold md:text-3xl">Plans</h2>
      </Reveal>

      {/* Stacked until lg: three columns at md would squeeze each card to
          about 200px. The Plus card's scale-up is lg-only for the same
          reason — scaled while stacked, it would overhang the page gutter. */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-center lg:gap-6">
        <Reveal>
          <div className={lightCardClass} style={lightCardStyle}>
            <h3 className="display text-xl font-bold">{STANDARD_PLAN.name}</h3>
            <p className="display mt-3 text-5xl font-extrabold">{STANDARD_PLAN.price}</p>
            <FeatureList features={STANDARD_PLAN.features} check="var(--blue-dark)" opacity="opacity-80" />
            <a
              href="#occasions"
              className="mt-8 inline-flex w-full items-center justify-center rounded-full py-3 text-sm font-semibold transition active:scale-[0.97]"
              style={{ background: "var(--ink)", color: "var(--cream)" }}
            >
              Browse Templates
            </a>
          </div>
        </Reveal>

        <Reveal delay={100}>
          {/* id="plus" is this card's anchor; landing on #plus also opens
              its request window, the same way #premium does below. */}
          <div
            id="plus"
            className="relative scroll-mt-24 rounded-[28px] p-8 shadow-2xl transition duration-300 hover:-translate-y-1 md:p-10 lg:scale-105"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            <span
              className="absolute -top-3.5 left-8 rounded-full px-4 py-1.5 text-[11.5px] font-bold"
              style={{ background: "var(--yellow)", color: "var(--ink)" }}
            >
              Recommended for weddings
            </span>
            <h3 className="display text-xl font-bold">Plus</h3>
            <p className="mt-3 text-[13px] font-medium uppercase tracking-wide opacity-60">Starting at</p>
            <p className="display mt-1 text-5xl font-extrabold">{REQUEST_PLANS.plus.price}</p>
            <FeatureList features={["Everything in Standard", "Add any of these extras:"]} check="var(--yellow)" opacity="opacity-85" />
            {/* One line per group, never one row per add-on — eleven rows
                made this card far taller than its neighbours. The full list,
                with a line on each, is in the request window. */}
            <ul className="mt-3 flex flex-col gap-3">
              {PLUS_ADDON_GROUPS.map(({ group, addons }) => (
                <li key={group} className="flex items-start gap-2.5 text-[14.5px]">
                  <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" style={{ color: "var(--yellow)" }} />
                  <span className="opacity-85">
                    <span className="font-semibold">{group}:</span> {addons.map((a) => a.name).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-[12.5px] opacity-60">Your final price depends on the extras you pick.</p>
            <div className="mt-6">
              <PlanRequestDialog plan="plus" tone="dark" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={200}>
          {/* id="premium" is the deep-link target for the "Get Premium"
              button in RequestCategorySection — landing on it also opens
              the Premium request window. scroll-mt matches the offset
              already used by the occasion anchors in app/page.tsx. */}
          <div id="premium" className={`scroll-mt-24 ${lightCardClass}`} style={lightCardStyle}>
            <h3 className="display text-xl font-bold">Premium</h3>
            <p className="mt-3 text-[13px] font-medium uppercase tracking-wide opacity-60">Starting at</p>
            <p className="display mt-1 text-5xl font-extrabold">{REQUEST_PLANS.premium.price}</p>
            <FeatureList features={PREMIUM_FEATURES} check="var(--blue-dark)" opacity="opacity-80" />
            <div className="mt-8">
              <PlanRequestDialog plan="premium" tone="light" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
