"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SquaresFour,
  UsersThree,
  ChatCircleText,
  ShareNetwork,
  CalendarBlank,
  PencilSimple,
  Lock,
} from "@phosphor-icons/react";

const NAV = [
  { href: "", label: "Overview", icon: SquaresFour },
  { href: "/guests", label: "Guests", icon: UsersThree },
  { href: "/messages", label: "Messages", icon: ChatCircleText },
  { href: "/share", label: "Share", icon: ShareNetwork },
  { href: "/event", label: "Event details", icon: CalendarBlank },
  { href: "/edit", label: "Edit invitation", icon: PencilSimple },
] as const;

// Fixed left panel on desktop; on smaller screens the same items become a
// sticky top bar with a horizontally scrolling row of pills. A client
// component only so it can read the current path for the active state.
export default function Sidebar({
  token,
  hostNames,
  templateName,
  messageCount,
}: {
  token: string;
  hostNames: string;
  templateName: string | null;
  messageCount: number;
}) {
  const pathname = usePathname();
  const base = `/dashboard/${token}`;
  const isActive = (href: string) => (href === "" ? pathname === base : pathname.startsWith(base + href));

  return (
    <>
      {/* ---------- Desktop ---------- */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-black/[0.06] bg-white lg:flex">
        <div className="border-b border-black/[0.06] px-6 py-6">
          <Link href="/" className="inline-flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Après-midi" className="h-7 w-auto" />
          </Link>
          <p className="display mt-5 truncate text-[16px] font-bold">{hostNames}</p>
          {templateName && <p className="mt-0.5 truncate text-[12.5px] text-[var(--ink)]/50">{templateName}</p>}
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={base + href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition ${
                  active
                    ? "bg-[var(--blue)]/25 font-semibold text-[var(--ink)]"
                    : "font-medium text-[var(--ink)]/60 hover:bg-black/[0.03] hover:text-[var(--ink)]"
                }`}
              >
                <Icon size={18} weight={active ? "fill" : "regular"} className={active ? "text-[var(--blue-dark)]" : ""} />
                <span className="flex-1">{label}</span>
                {href === "/messages" && messageCount > 0 && (
                  <span className="rounded-full bg-[var(--blue-dark)] px-1.5 py-0.5 text-[10.5px] font-bold leading-none text-white">
                    {messageCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <p className="mt-auto flex items-center gap-1.5 px-6 py-5 text-[11.5px] text-[var(--ink)]/45">
          <Lock size={12} />
          Private link, only you can open this dashboard
        </p>
      </aside>

      {/* ---------- Mobile / tablet ---------- */}
      <div className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 pt-3">
          {/* The logo, not the host names: the Overview's title already says
              whose dashboard this is, and repeating it right above read oddly. */}
          <Link href="/" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="Après-midi" className="h-6 w-auto" />
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-[var(--ink)]/45">
            <Lock size={11} />
            Private
          </span>
        </div>
        <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto px-4 py-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={label}
                href={base + href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] transition ${
                  active ? "bg-[var(--ink)] font-semibold text-[var(--cream)]" : "bg-black/[0.04] font-medium text-[var(--ink)]/65"
                }`}
              >
                <Icon size={15} weight={active ? "fill" : "regular"} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
