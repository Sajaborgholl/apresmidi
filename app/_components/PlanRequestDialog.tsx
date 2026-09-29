"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent, RefObject } from "react";
import { CheckCircle, X } from "@phosphor-icons/react";
import { submitPremiumInquiry, type PremiumInquiryState } from "../_actions/premium-inquiry";
import { PLUS_ADDON_GROUPS, REQUEST_PLANS, type InquiryPlan } from "@/lib/plans";
import { COUNTRY_CODES } from "@/lib/countryCodes";

// The request window for the Plus and Premium plans: the card's button, plus
// a native <dialog> opened with showModal(). Native rather than a hand-built
// overlay because the top layer escapes the cards' Reveal and hover
// transforms (which would otherwise trap a fixed-position child), and it
// brings focus containment, an inert page behind and Escape-to-close for
// free. Styling and the open animation live in globals.css (.plan-dialog).
//
// It also opens itself when the URL hash is its plan's anchor (#plus or
// #premium) — that's how the "Get Premium" links in the request-a-category
// section open this window straight from anywhere on the page.

// Matches the exact input/label classes already established in
// app/order/[slug]/_components/CustomizeForm.tsx, for visual consistency
// with the only other form in this app.
const inputClass =
  "w-full rounded-xl border-[1.5px] border-black/15 bg-[var(--cream)] px-3.5 py-2.5 text-[14.5px] text-[var(--ink)] outline-none transition focus:border-[var(--blue-dark)] focus:bg-white";
// inputClass without its w-full, for the country-code select, which has a
// fixed width of its own beside the number.
const selectClass = `w-36 shrink-0 truncate ${inputClass.replace("w-full ", "")}`;
const labelClass = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]/65";
const sectionTitleClass = "display text-[15px] font-bold";
const primaryButtonClass =
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-60";

// Opens the window and puts the cursor straight into the first field,
// rather than on the close button, which the dialog would focus first.
function openDialog(dialog: HTMLDialogElement | null) {
  if (!dialog || dialog.open) return;
  dialog.showModal();
  dialog.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
}

export default function PlanRequestDialog({ plan, tone }: { plan: InquiryPlan; tone: "dark" | "light" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Set by the form once a request goes through, so closing afterwards
  // resets it (a remount by key) while an accidental close before sending
  // keeps whatever was typed.
  const succeededRef = useRef(false);
  const [formKey, setFormKey] = useState(0);
  const info = REQUEST_PLANS[plan];

  // Deep links. Only calls showModal — no state is set here.
  useEffect(() => {
    const openIfTargeted = () => {
      if (window.location.hash === `#${plan}`) openDialog(dialogRef.current);
    };
    openIfTargeted();
    window.addEventListener("hashchange", openIfTargeted);
    return () => window.removeEventListener("hashchange", openIfTargeted);
  }, [plan]);

  function handleClose() {
    // Drop the #plus / #premium hash so a reload doesn't reopen the window,
    // and so the same link fires a hashchange again next time.
    if (window.location.hash === `#${plan}`) {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    if (succeededRef.current) {
      succeededRef.current = false;
      setFormKey((k) => k + 1);
    }
  }

  // A click that lands on the dialog element itself is on the dimmed
  // backdrop — every click inside the window hits one of its children.
  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) event.currentTarget.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openDialog(dialogRef.current)}
        aria-haspopup="dialog"
        className="w-full rounded-full py-3 text-sm font-semibold transition active:scale-[0.97]"
        style={
          tone === "dark"
            ? { background: "var(--cream)", color: "var(--ink)" }
            : { background: "var(--ink)", color: "var(--cream)" }
        }
      >
        Get {info.name}
      </button>

      <dialog
        ref={dialogRef}
        className="plan-dialog"
        aria-labelledby={`${plan}-dialog-title`}
        onClose={handleClose}
        onClick={handleBackdropClick}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-black/[0.07] px-6 pt-6 pb-5 sm:px-8">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wide opacity-55">
              {info.name} plan · Starting at {info.price}
            </p>
            <h2 id={`${plan}-dialog-title`} className="display mt-1 text-2xl font-bold">
              Request {info.name}
            </h2>
            <p className="mt-1.5 max-w-[46ch] text-[14px] opacity-70">{info.intro}</p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="-mr-2 -mt-1 shrink-0 rounded-full p-2 transition hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[var(--blue-dark)]"
          >
            <X size={20} />
          </button>
        </header>

        <RequestForm key={formKey} plan={plan} succeededRef={succeededRef} onDone={() => dialogRef.current?.close()} />
      </dialog>
    </>
  );
}

function RequestForm({
  plan,
  succeededRef,
  onDone,
}: {
  plan: InquiryPlan;
  succeededRef: RefObject<boolean>;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState<PremiumInquiryState, FormData>(submitPremiumInquiry, null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const isPlus = plan === "plus";

  const success = state !== null && "success" in state;
  const error = state !== null && "error" in state ? state.error : null;

  useEffect(() => {
    if (success) succeededRef.current = true;
  }, [success, succeededRef]);

  if (success) {
    return (
      <>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 py-14 text-center sm:px-8">
          <CheckCircle size={44} weight="fill" style={{ color: "var(--blue-dark)" }} />
          <p className="display text-xl font-bold">Request sent</p>
          <p className="max-w-[40ch] text-[14.5px] opacity-70">
            We&apos;ll get back to you within 48 hours
            {submittedEmail ? (
              <>
                {" "}
                at <span className="font-semibold">{submittedEmail}</span>
              </>
            ) : null}
            .
          </p>
        </div>
        <footer className="flex shrink-0 justify-end border-t border-black/[0.07] px-6 py-4 sm:px-8">
          <button
            type="button"
            onClick={onDone}
            className={`${primaryButtonClass} w-full sm:w-auto`}
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            Close
          </button>
        </footer>
      </>
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setSubmittedEmail(String(new FormData(event.currentTarget).get("email") ?? "").trim());
  }

  function countExtras(event: FormEvent<HTMLDivElement>) {
    setSelectedCount(event.currentTarget.querySelectorAll("input:checked").length);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <input type="hidden" name="plan" value={plan} />

      {/* Only this middle part scrolls; the header above and the footer
          below stay put, so the send button is always in reach. */}
      <div className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8">
        <section className="flex flex-col gap-3">
          <h3 className={sectionTitleClass}>Your details</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor={`${plan}-name`} className={labelClass}>
                Name
              </label>
              <input id={`${plan}-name`} name="name" required autoComplete="name" placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label htmlFor={`${plan}-email`} className={labelClass}>
                Email
              </label>
              <input
                id={`${plan}-email`}
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@email.com"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor={`${plan}-phone`} className={labelClass}>
              Phone
            </label>
            {/* Country code and number as separate fields, like the WhatsApp
                field in CustomizeForm.tsx and from the same list. The select
                submits the country's name, not its dial code — several
                countries share one (+1), so the name is what's unique; the
                server action looks the code up. */}
            <div className="flex gap-2">
              <select
                name="phone_country"
                required
                defaultValue=""
                aria-label="Country code"
                autoComplete="tel-country-code"
                className={selectClass}
              >
                <option value="" disabled>
                  Code
                </option>
                {COUNTRY_CODES.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name} ({country.dial})
                  </option>
                ))}
              </select>
              <input
                id={`${plan}-phone`}
                name="phone"
                type="tel"
                required
                autoComplete="tel-national"
                placeholder="Phone number"
                className={`min-w-0 flex-1 ${inputClass}`}
              />
            </div>
          </div>
        </section>

        {isPlus && (
          // A labelled group rather than a <fieldset>: a legend can't sit
          // inside the heading block, and fieldsets don't lay out with gap.
          <div role="group" aria-labelledby={`${plan}-extras-title`} onChange={countExtras} className="flex flex-col gap-4">
            <div>
              <h3 id={`${plan}-extras-title`} className={sectionTitleClass}>
                Choose your extras
              </h3>
              <p className="mt-1 text-[13px] opacity-60">Pick any, or decide with us later.</p>
            </div>
            {PLUS_ADDON_GROUPS.map(({ group, addons }) => (
              <div key={group} role="group" aria-label={group}>
                <p className="text-[11.5px] font-semibold uppercase tracking-wide opacity-55">{group}</p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {addons.map(({ name, description }) => (
                    // A real checkbox inside a bordered row: native keyboard
                    // and screen-reader behaviour, with has-checked styling
                    // the whole row from its state.
                    <label
                      key={name}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] border-black/10 p-3 transition hover:border-black/25 has-checked:border-[var(--blue-dark)] has-checked:bg-[var(--blue-light)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--blue-dark)]"
                    >
                      <input
                        type="checkbox"
                        name="addons"
                        value={name}
                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer"
                        style={{ accentColor: "var(--blue-dark)" }}
                      />
                      <span>
                        <span className="block text-[14px] font-semibold">{name}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug opacity-65">{description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <section className="flex flex-col gap-3">
          <h3 className={sectionTitleClass}>
            Notes <span className="text-[13px] font-normal opacity-55">(optional)</span>
          </h3>
          <textarea
            name="notes"
            aria-label="Notes (optional)"
            rows={3}
            maxLength={1000}
            placeholder={
              isPlus
                ? "Your event, your date, or anything you have in mind"
                : "Tell us about your event and the design you have in mind"
            }
            className={`${inputClass} resize-y`}
          />
        </section>
      </div>

      {error && (
        <p role="alert" className="shrink-0 border-t border-black/[0.07] px-6 py-3 text-[13px] font-medium sm:px-8" style={{ color: "#B23" }}>
          {error}
        </p>
      )}

      <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-black/[0.07] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-center text-[12.5px] opacity-60 sm:text-left">
          {isPlus && (
            <span className="font-semibold" aria-live="polite">
              {selectedCount === 0 ? "No extras yet" : `${selectedCount} extra${selectedCount === 1 ? "" : "s"} selected`}
              {" · "}
            </span>
          )}
          No payment now · We reply within 48 hours
        </p>
        <button
          type="submit"
          disabled={isPending}
          className={`${primaryButtonClass} w-full sm:w-auto`}
          style={{ background: "var(--ink)", color: "var(--cream)" }}
        >
          {isPending ? "Sending…" : "Send request"}
        </button>
      </footer>
    </form>
  );
}
