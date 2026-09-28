"use client";

import { useRouter, usePathname } from "next/navigation";
import { CheckCircle, X } from "@phosphor-icons/react";

// Shown on the Overview after updateInvite redirects back with ?saved=1.
// Dismissing drops the query param so a refresh doesn't bring it back.
export default function SavedBanner() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-black/[0.06] bg-[var(--blue-light)] px-4 py-3 text-[13.5px]">
      <CheckCircle size={18} weight="fill" className="shrink-0 text-[var(--blue-dark)]" />
      <p className="flex-1">
        <strong className="font-semibold">Changes saved.</strong> Guests see the updated invitation right away.
      </p>
      <button
        type="button"
        onClick={() => router.replace(pathname, { scroll: false })}
        aria-label="Dismiss"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition hover:bg-black/[0.06] active:scale-90"
      >
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}
