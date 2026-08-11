"use client";

import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";

// A labeled link row with a copy-to-clipboard button. `isPrivate` adds a
// small "don't share" note — used for the dashboard link, which (unlike
// the guest link) must not be forwarded to anyone but the owner. Shared
// between the order confirmation page and the owner dashboard.
export default function CopyLinkButton({
  label,
  url,
  isPrivate,
}: {
  label: string;
  url: string;
  isPrivate?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-black/10 p-4 text-left">
      <p className="text-[12.5px] font-semibold text-[var(--ink)]/65">
        {label}
        {isPrivate && <span style={{ color: "var(--blue-dark)" }}> · private, don&apos;t share</span>}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span className="flex-1 truncate text-[13.5px]">{url}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="shrink-0 rounded-full p-2 transition active:scale-90"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}
