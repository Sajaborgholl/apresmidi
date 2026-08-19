"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { submitPremiumInquiry, type PremiumInquiryState } from "../_actions/premium-inquiry";

// Matches the exact input/label classes already established in
// app/order/[slug]/_components/CustomizeForm.tsx, for visual consistency
// with the only other form in this app.
const inputClass =
  "w-full rounded-xl border-[1.5px] border-black/15 bg-[var(--cream)] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] outline-none transition focus:border-[var(--blue-dark)] focus:bg-white";
const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]/65";

// Fades + slides in on mount — same technique as app/_components/Reveal.tsx
// (a plain mount-triggered CSS transition, no library). Used instead of the
// classic "grid-template-rows 0fr→1fr" expand trick, which turned out not
// to resolve to the content's height in this spot; conditional mount +
// fade is simpler and already proven to work elsewhere in this app.
function FadeIn({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-8px)" }}
    >
      {children}
    </div>
  );
}

export default function PremiumInquiryForm() {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState<PremiumInquiryState, FormData>(submitPremiumInquiry, null);

  const success = state !== null && "success" in state;
  const error = state !== null && "error" in state ? state.error : null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full rounded-full py-3 text-sm font-semibold transition active:scale-[0.97]"
        style={{ background: "var(--cream)", color: "var(--ink)" }}
      >
        Get Premium
      </button>
    );
  }

  if (success) {
    return (
      <FadeIn>
        <div className="flex items-start gap-2.5 rounded-xl bg-white/10 p-4 text-sm">
          <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0" style={{ color: "var(--yellow)" }} />
          <p>Thanks. We&apos;ll be in touch within 48 hours.</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <form action={formAction} className="flex flex-col gap-3">
        <div>
          <label className={labelClass} style={{ color: "rgba(251,248,241,0.65)" }}>
            Name
          </label>
          <input name="name" required placeholder="Your name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "rgba(251,248,241,0.65)" }}>
            Email
          </label>
          <input name="email" type="email" required placeholder="you@email.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass} style={{ color: "rgba(251,248,241,0.65)" }}>
            Phone
          </label>
          <input name="phone" type="tel" required placeholder="+961 00 000 000" className={inputClass} />
        </div>
        {error && (
          <p className="text-[13px] font-medium" style={{ color: "#E8A0A0" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="mt-1 w-full rounded-full py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60"
          style={{ background: "var(--cream)", color: "var(--ink)" }}
        >
          {isPending ? "Sending…" : "Submit"}
        </button>
      </form>
    </FadeIn>
  );
}
