"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import Link from "next/link";
import { WarningCircle } from "@phosphor-icons/react";
import { BUSINESS_WHATSAPP_NUMBER } from "@/lib/contact";

// Shown in place of any page that hits an unexpected error, instead of
// Next's bare "This page couldn't load" screen. Same card as the order
// confirmation page. In production `error.message` is a generic string for
// server errors (Next strips the details), so only the digest is shown — it
// matches the server log entry, which helps when someone messages us.
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      className="flex min-h-dvh items-center justify-center px-6 py-16"
      style={{ fontFamily: "Inter, sans-serif", color: "var(--ink)", background: "var(--cream)" }}
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-8 text-center md:p-10"
        style={{ boxShadow: "0 30px 70px rgba(31,36,48,0.10)" }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ background: "var(--yellow)" }}
        >
          <WarningCircle size={26} weight="fill" style={{ color: "var(--ink)" }} />
        </div>
        <h1 className="display text-2xl font-bold md:text-[26px]">Something went wrong</h1>
        <p className="mt-3 text-[14.5px] opacity-65">
          This page didn&apos;t load properly. Trying again usually fixes it. If it keeps happening, message us and
          we&apos;ll sort it out.
        </p>

        <button
          type="button"
          onClick={() => retry()}
          className="mt-7 w-full rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          Try again
        </button>
        <a
          href={`https://wa.me/${BUSINESS_WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97]"
          style={{ background: "#25D366", color: "#fff" }}
        >
          Message us on WhatsApp
        </a>
        <Link href="/" className="mt-4 inline-block text-sm font-medium underline underline-offset-4 opacity-70">
          Back to the homepage
        </Link>

        {error.digest && <p className="mt-6 text-[11px] opacity-40">Reference: {error.digest}</p>}
      </div>
    </main>
  );
}
