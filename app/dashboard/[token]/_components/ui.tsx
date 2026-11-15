import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { daysUntil } from "../_lib/format";
import InfoTip from "./InfoTip";

// Small building blocks shared by every dashboard section, so buttons,
// cards, badges and headers look identical from page to page. No hooks or
// server-only imports, so client components can use them too (the
// interactive pieces live in ui-client.tsx). Colours come only from the
// tokens in app/globals.css.

// ---------------------------------------------------------------- buttons

// "light" sits on a dark surface; "whatsapp" opens WhatsApp.
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "light" | "whatsapp";
export type ButtonSize = "sm" | "md";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-[var(--ink)] text-[var(--cream)] hover:opacity-90",
  secondary: "border border-black/15 bg-white text-[var(--ink)] hover:border-black/30",
  ghost: "text-[var(--ink)]/70 hover:bg-black/[0.05] hover:text-[var(--ink)]",
  danger: "bg-[var(--danger)] text-white hover:opacity-90",
  light: "bg-[var(--cream)] text-[var(--ink)] hover:bg-white",
  whatsapp: "bg-[var(--whatsapp)] text-white hover:opacity-90",
};
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[34px] px-3 text-[13px]",
  md: "min-h-[42px] px-4 text-[14px]",
};

// The class string, for the odd element that can't be a <Button> (a file
// input's label, a download link).
export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", extra = "") {
  return `inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue-dark)] ${VARIANT[variant]} ${SIZE[size]} ${extra}`;
}

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  // A link instead of a button; `external` opens it in a new tab.
  href?: string;
  external?: boolean;
  download?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export function Button({ variant = "secondary", size = "md", icon, children, className = "", href, external, download, type = "button", ...rest }: ButtonProps) {
  const cls = buttonClass(variant, size, className);
  const inner = (
    <>
      {icon}
      {children}
    </>
  );
  if (href !== undefined) {
    if (external || download !== undefined) {
      return (
        <a href={href} className={cls} download={download} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {inner}
        </a>
      );
    }
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {inner}
    </button>
  );
}

// A round icon-only button; `label` is required since there's no text.
export function IconButton({
  label,
  children,
  className = "",
  ...rest
}: { label: string; children: ReactNode; className?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--ink)]/60 transition hover:bg-black/[0.06] hover:text-[var(--ink)] active:scale-[0.94] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-[var(--blue-dark)] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------- surfaces

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  // false for content that runs edge to edge (a list with its own rows).
  padded?: boolean;
}) {
  const head = title || action;
  return (
    <section className={`rounded-[20px] border border-[var(--line)] bg-white ${className}`}>
      {head && (
        <div className={`flex items-start justify-between gap-3 ${padded ? "px-5 pt-5 sm:px-6 sm:pt-6" : "border-b border-[var(--line)] px-5 py-4 sm:px-6"}`}>
          <div className="min-w-0">
            {title && <h2 className="display text-[16px] font-bold leading-tight">{title}</h2>}
            {description && <p className="mt-1 text-[13px] text-[var(--ink)]/65">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </div>
      )}
      {padded ? <div className={`px-5 pb-5 sm:px-6 sm:pb-6 ${head ? "pt-4" : "pt-5 sm:pt-6"}`}>{children}</div> : children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="display text-[26px] font-bold leading-tight tracking-[-0.01em] md:text-[32px]">{title}</h1>
        {subtitle && <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[14px] text-[var(--ink)]/60">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--cream)] text-[var(--ink)]/45">{icon}</span>
      <p className="display text-[16px] font-bold">{title}</p>
      {children && <div className="max-w-sm text-[14px] leading-relaxed text-[var(--ink)]/65">{children}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ---------------------------------------------------------------- figures

export function StatTile({
  label,
  value,
  suffix,
  hint,
  info,
  children,
}: {
  label: string;
  value: number | string;
  // Small text after the number ("of 30").
  suffix?: string;
  hint?: ReactNode;
  // Only for a figure that genuinely needs explaining.
  info?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-[var(--line)] bg-white p-4 sm:p-5">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink)]/65">
        {label}
        {info && <InfoTip label={`About ${label}`}>{info}</InfoTip>}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="display text-[30px] font-bold leading-none tabular-nums sm:text-[34px]">{value}</span>
        {suffix && <span className="text-[13px] font-medium text-[var(--ink)]/65">{suffix}</span>}
      </p>
      {hint && <p className="mt-1.5 text-[13px] text-[var(--ink)]/65">{hint}</p>}
      {children}
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/[0.07]"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className="h-full rounded-full bg-[var(--blue-dark)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------- badges

// Filled tones are for a guest's reply (what the host cares about);
// "outline" is for the quieter WhatsApp delivery states, so the two never
// look alike side by side.
export type BadgeTone = "neutral" | "coming" | "waiting" | "danger" | "info" | "outline";

// Every tone sets its own border colour (transparent when filled) so all
// badges are the same height.
const TONE: Record<BadgeTone, string> = {
  neutral: "border-transparent bg-black/[0.06] text-[var(--ink)]/70",
  outline: "border-black/[0.14] bg-white text-[var(--ink)]/70",
  coming: "border-transparent bg-[var(--coming-soft)] text-[var(--coming)]",
  waiting: "border-transparent bg-[var(--waiting-soft)] text-[var(--waiting)]",
  danger: "border-transparent bg-[var(--danger-soft)] text-[var(--danger)]",
  info: "border-transparent bg-[var(--blue)]/30 text-[var(--ink)]",
};

export function Badge({ tone = "neutral", icon, title, children }: { tone?: BadgeTone; icon?: ReactNode; title?: string; children: ReactNode }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[12px] font-semibold leading-none ${TONE[tone]}`}>
      {icon}
      {children}
    </span>
  );
}

// A guest's reply, worded the same on every page.
export function ReplyBadge({ reply }: { reply: { attending: boolean; guest_count: number | null } | null }) {
  if (!reply) return <Badge tone="waiting">Waiting</Badge>;
  if (!reply.attending) return <Badge>Not coming</Badge>;
  return <Badge tone="coming">Coming · {reply.guest_count ?? 1}</Badge>;
}

export function Avatar({ name, muted, size = "md" }: { name: string; muted?: boolean; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden="true"
      className={`display flex shrink-0 items-center justify-center rounded-full font-bold ${size === "sm" ? "h-8 w-8 text-[12px]" : "h-9 w-9 text-[13px]"} ${
        muted ? "bg-black/[0.05] text-[var(--ink)]/65" : "bg-[var(--blue)]/40 text-[var(--ink)]"
      }`}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

// "In 12 days" / "Today" / "34 days ago".
export function CountdownPill({ eventDate }: { eventDate: string | null }) {
  const days = daysUntil(eventDate);
  if (days === null) return null;
  const text = days === 0 ? "Today" : days > 0 ? `In ${days} day${days === 1 ? "" : "s"}` : `${-days} day${days === -1 ? "" : "s"} ago`;
  return <Badge tone={days >= 0 ? "info" : "neutral"}>{text}</Badge>;
}
