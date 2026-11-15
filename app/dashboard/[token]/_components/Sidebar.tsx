"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SquaresFour, UsersThree, ChatCircleText, EnvelopeSimpleOpen, Lock, Check, Copy } from "@phosphor-icons/react";
import { CountdownPill } from "./ui";

const NAV = [
  { href: "", label: "Overview", icon: SquaresFour },
  { href: "/guests", label: "Guests", icon: UsersThree },
  { href: "/messages", label: "Messages", icon: ChatCircleText },
  { href: "/invitation", label: "Invitation", icon: EnvelopeSimpleOpen },
] as const;

// A fixed left panel on desktop; on smaller screens a slim top bar plus a
// tab bar along the bottom (where a thumb reaches). A client component only
// so it can read the current path for the active state.
export default function Sidebar({
  token,
  hostNames,
  templateName,
  eventDate,
  guestCount,
  messageCount,
}: {
  token: string;
  hostNames: string;
  templateName: string | null;
  eventDate: string | null;
  guestCount: number;
  messageCount: number;
}) {
  const pathname = usePathname();
  const base = `/dashboard/${token}`;
  const isActive = (href: string) => (href === "" ? pathname === base : pathname.startsWith(base + href));
  const count = (href: string) => (href === "/guests" ? guestCount : href === "/messages" ? messageCount : 0);

  // There's no account behind the dashboard: this link is the only way back
  // in, so it's one tap to copy (to bookmark, or email to yourself).
  const [copied, setCopied] = useState(false);
  async function copyDashboardLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + base);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: nothing useful to show; the address bar has it.
    }
  }

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-[264px] shrink-0 flex-col border-r border-[var(--line)] bg-white lg:flex">
        <div className="px-6 pb-5 pt-6">
          <Link href={base} className="inline-flex items-center gap-2" aria-label="Overview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Après-midi" className="h-7 w-auto" />
          </Link>
        </div>

        <div className="mx-3 rounded-2xl bg-[var(--cream)] px-4 py-3.5">
          <p className="display truncate text-[16px] font-bold">{hostNames}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {templateName && <span className="truncate text-[12px] text-[var(--ink)]/65">{templateName}</span>}
            <CountdownPill eventDate={eventDate} />
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-0.5 px-3" aria-label="Dashboard">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const n = count(href);
            return (
              <Link
                key={label}
                href={base + href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition ${
                  active ? "bg-[var(--ink)] font-semibold text-[var(--cream)]" : "font-medium text-[var(--ink)]/65 hover:bg-black/[0.04] hover:text-[var(--ink)]"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} />
                <span className="flex-1">{label}</span>
                {n > 0 && (
                  <span
                    className={`min-w-[22px] rounded-full px-1.5 py-0.5 text-center text-[12px] font-semibold tabular-nums leading-none ${
                      active ? "bg-white/15 text-[var(--cream)]" : "bg-black/[0.05] text-[var(--ink)]/65"
                    }`}
                  >
                    {n}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-6 py-5">
          <p className="flex gap-1.5 text-[12px] leading-snug text-[var(--ink)]/65">
            <Lock size={12} className="mt-[3px] shrink-0" />
            <span>Anyone with this page&apos;s link can manage your guests. Keep it safe and don&apos;t forward it.</span>
          </p>
          <button
            type="button"
            onClick={copyDashboardLink}
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1.5 text-[12px] font-semibold transition hover:border-black/30 active:scale-[0.97]"
          >
            {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy dashboard link"}
          </button>
        </div>
      </aside>

      {/* ---------- Mobile / tablet: top bar ---------- */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href={base} className="shrink-0" aria-label="Overview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Après-midi" className="h-6 w-auto" />
        </Link>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[13px] font-medium text-[var(--ink)]/65">{hostNames}</span>
          <button
            type="button"
            onClick={copyDashboardLink}
            aria-label="Copy your dashboard link"
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-black/15 px-2.5 py-1 text-[12px] font-semibold transition active:scale-[0.97]"
          >
            {copied ? <Check size={12} weight="bold" /> : <Lock size={12} />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </span>
      </div>

      {/* ---------- Mobile / tablet: bottom tabs ---------- */}
      <nav
        aria-label="Dashboard"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[var(--line)] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          const n = href === "/messages" ? messageCount : 0;
          return (
            <Link
              key={label}
              href={base + href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 py-2.5 text-[12px] transition ${
                active ? "font-semibold text-[var(--ink)]" : "font-medium text-[var(--ink)]/65"
              }`}
            >
              <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${active ? "bg-[var(--blue)]/40" : ""}`}>
                <Icon size={20} weight={active ? "fill" : "regular"} />
              </span>
              {label}
              {n > 0 && (
                <span className="absolute left-1/2 top-1.5 ml-2 min-w-[16px] rounded-full bg-[var(--blue-dark)] px-1 text-center text-[9.5px] font-bold leading-4 text-white">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
