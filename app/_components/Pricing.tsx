import { CheckCircle } from "@phosphor-icons/react/dist/ssr";
import Reveal from "./Reveal";
import PremiumInquiryForm from "./PremiumInquiryForm";

const STANDARD_FEATURES = [
  "Your chosen template, exactly as designed",
  "Live guest RSVP page",
  "Private RSVP dashboard",
];

const PREMIUM_FEATURES = [
  "Everything in Standard",
  "Fully custom design",
  "New features built around your story",
  "1:1 with our team",
];

export default function Pricing() {
  return (
    <section id="pricing" className="px-6 md:px-12 py-16">
      <Reveal>
        <h2 className="display text-2xl font-bold md:text-3xl">Plans</h2>
        <p className="mt-1.5 text-sm opacity-60">Buy it as-is, or have us build it around you.</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-[1fr_1.15fr] md:items-center">
        <Reveal>
          <div
            className="rounded-[28px] p-8 transition duration-300 hover:-translate-y-1 hover:shadow-xl md:p-9"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            <h3 className="display text-xl font-bold">Standard</h3>
            <p className="display mt-3 text-5xl font-extrabold">$80</p>
            <ul className="mt-6 flex flex-col gap-3">
              {STANDARD_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[14.5px]">
                  <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" style={{ color: "var(--blue-dark)" }} />
                  <span className="opacity-80">{feature}</span>
                </li>
              ))}
            </ul>
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
          <div
            className="relative rounded-[28px] p-8 shadow-2xl transition duration-300 hover:-translate-y-1 md:scale-105 md:p-10"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            <span
              className="absolute -top-3.5 left-8 rounded-full px-4 py-1.5 text-[11.5px] font-bold"
              style={{ background: "var(--yellow)", color: "var(--ink)" }}
            >
              Recommended for weddings
            </span>
            <h3 className="display text-xl font-bold">Premium</h3>
            <p className="display mt-3 text-5xl font-extrabold">$180</p>
            <ul className="mt-6 flex flex-col gap-3">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-[14.5px]">
                  <CheckCircle size={18} weight="fill" className="mt-0.5 shrink-0" style={{ color: "var(--yellow)" }} />
                  <span className="opacity-85">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <PremiumInquiryForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
