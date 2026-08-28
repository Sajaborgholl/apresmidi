"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle } from "@phosphor-icons/react";
import { submitCategoryRequest, type CategoryRequestState } from "../_actions/category-request";

// Matches the input/label classes already established in
// app/_components/PremiumInquiryForm.tsx, for visual consistency with the
// only other lead-capture form in this app.
const inputClass =
  "w-full rounded-xl border-[1.5px] border-black/15 bg-white px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] outline-none transition focus:border-[var(--blue-dark)]";
const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]/65";

// Fades + slides in on mount — same technique as PremiumInquiryForm.tsx's
// own FadeIn (a plain mount-triggered CSS transition, no library).
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

export default function CategoryRequestForm() {
  const [expanded, setExpanded] = useState(false);
  const [state, formAction, isPending] = useActionState<CategoryRequestState, FormData>(submitCategoryRequest, null);

  const success = state !== null && "success" in state;
  const error = state !== null && "error" in state ? state.error : null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="rounded-full px-7 py-3 text-sm font-semibold transition active:scale-[0.97]"
        style={{ background: "var(--ink)", color: "var(--cream)" }}
      >
        Get Premium
      </button>
    );
  }

  if (success) {
    return (
      <FadeIn>
        <div
          className="flex items-start gap-2.5 rounded-xl p-4 text-sm max-w-sm"
          style={{ background: "#fff", boxShadow: "0 8px 20px rgba(31,36,48,0.14)" }}
        >
          <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0" style={{ color: "var(--blue-dark)" }} />
          <p>Thanks — we&apos;ll be in touch if we build it!</p>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn>
      <form
        action={formAction}
        className="flex flex-col gap-3 rounded-xl p-5 max-w-sm"
        style={{ background: "#fff", boxShadow: "0 8px 20px rgba(31,36,48,0.14)" }}
      >
        <div>
          <label className={labelClass}>Name</label>
          <input name="name" required placeholder="Your name" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input name="email" type="email" required placeholder="you@email.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>What occasion?</label>
          <input name="category" required placeholder="Graduation, private party..." className={inputClass} />
        </div>
        {error && (
          <p className="text-[13px] font-medium" style={{ color: "#B23" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="mt-1 rounded-full py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60"
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {isPending ? "Sending…" : "Send it →"}
        </button>
      </form>
    </FadeIn>
  );
}
