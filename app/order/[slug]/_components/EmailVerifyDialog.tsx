"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { EnvelopeSimple, X } from "@phosphor-icons/react";
import { sendEmailCode, verifyEmailCode } from "../emailActions";
import { MAX_LENGTH } from "@/lib/validation";

// Asked at "Continue to payment" (CustomizePanel.tsx), before the order is
// created: the host's email, typed twice, then the 6-digit code we email
// them. Their private dashboard link goes to this address and is their only
// way back in, so it has to be right. On success `onVerified` gets the
// email and the verification id that createOrder checks.
export default function EmailVerifyDialog({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  onVerified: (email: string, verificationId: string) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [error, setError] = useState("");
  // Seconds until "Resend code" works again.
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const mismatch = confirmEmail.trim() !== "" && confirmEmail.trim().toLowerCase() !== email.trim().toLowerCase();

  function requestCode() {
    setError("");
    startTransition(async () => {
      const r = await sendEmailCode(email.trim());
      if ("error" in r) return setError(r.error);
      setVerificationId(r.verificationId);
      setCode("");
      setStep("code");
      setCooldown(30);
    });
  }

  function verify() {
    if (!verificationId) return;
    setError("");
    startTransition(async () => {
      const r = await verifyEmailCode(verificationId, email.trim(), code);
      if ("error" in r) return setError(r.error);
      onVerified(email.trim(), verificationId);
    });
  }

  const field =
    "w-full rounded-xl border-[1.5px] border-black/15 bg-[var(--cream)] px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition focus:border-[var(--blue-dark)] focus:bg-white";
  const label = "mb-1.5 block text-[12.5px] font-semibold text-[var(--ink)]/65";
  const primary =
    "w-full rounded-full py-3.5 text-sm font-semibold transition hover:opacity-90 active:scale-[0.97] disabled:opacity-50";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="email-verify-title"
      className="m-auto w-[min(92vw,420px)] rounded-[24px] bg-white p-0 text-[var(--ink)] shadow-[0_30px_70px_rgba(31,36,48,0.25)] backdrop:bg-black/40"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      {open && (
        <div className="p-7">
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "var(--blue)" }}>
              <EnvelopeSimple size={22} weight="fill" />
            </span>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 opacity-60 transition hover:bg-black/5 hover:opacity-100">
              <X size={18} />
            </button>
          </div>

          {step === "email" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!mismatch) requestCode();
              }}
            >
              <h2 id="email-verify-title" className="display mt-4 text-[22px] font-bold">
                Your email
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed opacity-65">
                We&apos;ll send your private dashboard link here. It&apos;s your only way back in, so we&apos;ll check it with a
                quick code.
              </p>
              <label className={`${label} mt-5`} htmlFor="ev-email">
                Email
              </label>
              <input
                id="ev-email"
                type="email"
                required
                autoComplete="email"
                maxLength={MAX_LENGTH.email}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={field}
              />
              <label className={`${label} mt-4`} htmlFor="ev-email-confirm">
                Confirm your email
              </label>
              <input
                id="ev-email-confirm"
                type="email"
                required
                autoComplete="off"
                maxLength={MAX_LENGTH.email}
                placeholder="you@email.com"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                aria-invalid={mismatch}
                className={field}
              />
              {mismatch && <p className="mt-1.5 text-[12px] font-medium text-[#B45454]">The two emails don&apos;t match.</p>}
              {error && (
                <p role="alert" className="mt-3 text-[13px] font-medium text-[#B45454]">
                  {error}
                </p>
              )}
              <button type="submit" disabled={pending || mismatch} className={`${primary} mt-6`} style={{ background: "var(--ink)", color: "var(--cream)" }}>
                {pending ? "Sending…" : "Send me a code"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verify();
              }}
            >
              <h2 id="email-verify-title" className="display mt-4 text-[22px] font-bold">
                Check your email
              </h2>
              <p className="mt-1.5 text-[13.5px] leading-relaxed opacity-65">
                We sent a 6-digit code to <strong className="font-semibold opacity-100">{email.trim()}</strong>. It can take a
                minute; check your spam folder too.
              </p>
              <label className={`${label} mt-5`} htmlFor="ev-code">
                Code
              </label>
              <input
                id="ev-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${field} text-center text-[22px] font-semibold tracking-[0.4em]`}
                autoFocus
              />
              {error && (
                <p role="alert" className="mt-3 text-[13px] font-medium text-[#B45454]">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending || code.length !== 6}
                className={`${primary} mt-6`}
                style={{ background: "var(--ink)", color: "var(--cream)" }}
              >
                {pending ? "Checking…" : "Verify and continue"}
              </button>
              <div className="mt-4 flex items-center justify-between text-[13px]">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  className="font-semibold underline underline-offset-2 opacity-70 hover:opacity-100"
                >
                  Change email
                </button>
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={pending || cooldown > 0}
                  className="font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 disabled:no-underline disabled:opacity-40"
                >
                  {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </dialog>
  );
}
