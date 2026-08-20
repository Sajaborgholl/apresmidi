import { MapPin, CheckCircle, WhatsappLogo, Images, Lock } from "@phosphor-icons/react/dist/ssr";
import Reveal from "./Reveal";

// Real features only — no seating/reservation system exists (RSVP is
// accept/decline + guest count), guests never share/generate a link
// themselves (only the host shares the one they get), background music
// (music_url) is a dead field never rendered by any template, and no
// template ever collects the guest message field the dashboard can show.
// Alternating tile backgrounds (cycled from the site's existing token
// palette) so no two adjacent tiles share a color, same idea as the
// CARD_COLORS cycling used for the occasion cards on this page.
const TILES = [
  {
    Icon: MapPin,
    label: "Venue on the map",
    copy: "One tap opens Google Maps to the exact venue.",
    bg: "var(--blue-light)",
    iconBg: "#fff",
    iconColor: "var(--ink)",
  },
  {
    Icon: CheckCircle,
    label: "Accept or decline",
    copy: "Guests RSVP right on the page and say how many are coming.",
    bg: "var(--yellow)",
    iconBg: "#fff",
    weight: "fill" as const,
    iconColor: "var(--blue-dark)",
  },
  {
    Icon: WhatsappLogo,
    label: "Confirm on WhatsApp",
    copy: "A one-tap WhatsApp message to the host, pre-filled and ready to send.",
    bg: "#fff",
    iconBg: "#25D366",
    iconColor: "#fff",
    weight: "fill" as const,
  },
  {
    Icon: Images,
    label: "Add your photos",
    copy: "Upload up to three photos and see them in the design instantly.",
    bg: "var(--blue)",
    iconBg: "#fff",
    iconColor: "var(--ink)",
  },
  {
    Icon: Lock,
    label: "One link to share",
    copy: "Send your private link by text, WhatsApp, or email — that's it.",
    bg: "var(--yellow-dark)",
    iconBg: "#fff",
    iconColor: "var(--ink)",
  },
];

export default function FeatureShowcase() {
  return (
    <section className="px-6 md:px-12 py-16">
      <Reveal>
        <h2 className="leading-none">
          <span className="display font-bold block" style={{ fontSize: "clamp(2.5rem,8vw,6rem)" }}>
            Everything&apos;s
          </span>
          <span className="script block" style={{ fontSize: "clamp(3rem,10vw,7rem)", color: "var(--blue-dark)" }}>
            included
          </span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] opacity-60">
          One link. Real RSVPs. A dashboard that updates itself.
        </p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3 md:auto-rows-[190px]">
        <Reveal delay={40} className="md:col-span-2 md:row-span-2">
          <div
            className="flex h-full flex-col overflow-hidden rounded-[28px]"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
          >
            {/* h-48 is load-bearing on mobile: flex-1 alone collapses to zero
                height there since this card's grid cell only gets an explicit
                height from row-span-2/auto-rows at the md breakpoint. */}
            <div className="relative h-48 md:h-auto md:flex-1" style={{ background: "var(--cream)" }}>
              {/* object-contain (not cover): this is a real product screenshot,
                  not a decorative photo — cropping it arbitrarily to fill the
                  tile could cut off whichever stat card happens to land at the
                  edge. The cream backdrop matches the dashboard's own
                  background so there's no visible letterboxing seam. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/showcase-dashboard.png"
                alt="Après-midi RSVP dashboard showing accepted, declined, and total response counts with a live guest list"
                className="absolute inset-0 h-full w-full object-contain"
              />
            </div>
            <div className="p-6">
              <p className="font-semibold">Watch RSVPs roll in</p>
              <p className="mt-1 text-[13.5px] opacity-70">
                A private dashboard that updates itself — accepted, declined, and total responses, live.
              </p>
            </div>
          </div>
        </Reveal>

        {TILES.map((tile, i) => (
          <Reveal key={tile.label} delay={(i + 1) * 70}>
            <div
              className="flex h-full flex-col justify-between rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ background: tile.bg, border: tile.bg === "#fff" ? "1px solid rgba(0,0,0,0.08)" : undefined }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: tile.iconBg }}>
                <tile.Icon size={20} weight={tile.weight ?? "regular"} style={{ color: tile.iconColor }} />
              </div>
              <div className="mt-4">
                <p className="font-semibold">{tile.label}</p>
                <p className="mt-1 text-[13.5px] opacity-70">{tile.copy}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
