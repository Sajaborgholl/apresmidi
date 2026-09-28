import Link from "next/link";
import type { ReactNode } from "react";
import { PencilSimple, ShareNetwork } from "@phosphor-icons/react/dist/ssr";
import { daysUntil } from "../_lib/format";
import InfoTip from "./InfoTip";

// Small building blocks shared by every dashboard section, so the cards,
// pills and headers stay visually identical from page to page. No hooks or
// server-only imports, so client components (GuestsTable) can use it too.
// Colors come only from the brand tokens in app/globals.css.

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-black/[0.07] bg-white p-6 ${className}`}>{children}</section>;
}

export function CardHeader({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="display text-[17px] font-bold">{title}</h2>
      {href && (
        <Link href={href} className="text-[13px] font-semibold text-[var(--blue-dark)] transition hover:opacity-70">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function Pill({ accent, children }: { accent?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        accent ? "bg-[var(--blue)]/35 text-[var(--ink)]" : "bg-black/[0.05] text-[var(--ink)]/60"
      }`}
    >
      {children}
    </span>
  );
}

export type Stat = {
  label: string;
  value: number | string;
  // One line under the number saying what it's made of.
  hint?: ReactNode;
  // Only for a figure that genuinely needs explaining (People attending).
  info?: ReactNode;
};

// The headline figures as one plain row on the page background, split by
// hairlines — not a card each. Stacks into rows on a phone.
export function StatRow({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-black/[0.08] border-y border-black/[0.08] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {stats.map((s) => (
        <div key={s.label} className="flex items-baseline justify-between gap-4 py-4 sm:block sm:px-6 sm:py-5 sm:first:pl-0">
          <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)]/55">
            {s.label}
            {s.info && <InfoTip label={`About ${s.label}`}>{s.info}</InfoTip>}
          </p>
          <div className="text-right sm:text-left">
            <p className="display text-[30px] font-bold leading-none tabular-nums sm:mt-2 sm:text-[36px]">{s.value}</p>
            {s.hint && <p className="mt-1.5 text-[12.5px] text-[var(--ink)]/50">{s.hint}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Avatar({ name, muted }: { name: string; muted?: boolean }) {
  return (
    <span
      className={`display flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
        muted ? "bg-black/[0.05] text-[var(--ink)]/45" : "bg-[var(--blue)]/40 text-[var(--ink)]"
      }`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function StatusPill({ attending }: { attending: boolean }) {
  return attending ? <Pill accent>Attending</Pill> : <Pill>Declined</Pill>;
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-black/15 px-6 py-12 text-center">
      <span className="text-[var(--ink)]/35">{icon}</span>
      <p className="display text-[15px] font-bold">{title}</p>
      {children && <div className="max-w-sm text-[13.5px] text-[var(--ink)]/55">{children}</div>}
    </div>
  );
}

// "In 12 days" / "Today" / "34 days ago" — a small pill next to the event
// line, rather than a sentence in the header.
export function CountdownPill({ eventDate }: { eventDate: string | null }) {
  const days = daysUntil(eventDate);
  if (days === null) return null;
  const text = days === 0 ? "Today" : days > 0 ? `In ${days} day${days === 1 ? "" : "s"}` : `${-days} day${days === -1 ? "" : "s"} ago`;
  return <Pill accent={days >= 0}>{text}</Pill>;
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="display text-[26px] font-bold leading-tight md:text-[30px]">{title}</h1>
        {subtitle && <div className="mt-2 flex flex-wrap items-center gap-2 text-[14px] text-[var(--ink)]/60">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

// Only the Overview gets header actions; every other section is one click
// away in the sidebar already.
export function OverviewActions({ token }: { token: string }) {
  return (
    <>
      <Link
        href={`/dashboard/${token}/share`}
        className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-4 py-2.5 text-[13px] font-semibold transition hover:border-black/30 active:scale-[0.97]"
      >
        <ShareNetwork size={15} />
        Share
      </Link>
      <Link
        href={`/dashboard/${token}/edit`}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-semibold transition hover:opacity-90 active:scale-[0.97]"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        <PencilSimple size={15} />
        Edit invitation
      </Link>
    </>
  );
}
