"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { DotsThree, X } from "@phosphor-icons/react";
import { Button, IconButton } from "./ui";

// The dashboard's interactive building blocks (ui.tsx holds the static
// ones): a side panel, a "⋯" menu, filter tabs and toasts.

// ---------------------------------------------------------------- Sheet

// A side panel on wider screens, a bottom sheet on a phone (styles:
// .dash-sheet in globals.css). A native modal <dialog>, so the browser
// handles focus trapping, Esc and the rest of the page going inert.
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  // Pinned under the scrolling content (the main action).
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dash-sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      // A click on the backdrop lands on the <dialog> itself, never on its
      // content (which fills it).
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="flex h-full max-h-[inherit] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h2 id={titleId} className="display text-[18px] font-bold leading-tight">
                {title}
              </h2>
              {description && <p className="mt-1 text-[13px] text-[var(--ink)]/65">{description}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <X size={18} />
            </IconButton>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--line)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

// ---------------------------------------------------------------- Confirm

export type ConfirmOptions = { title: string; text?: ReactNode; confirmLabel: string; danger?: boolean };

// An in-app "Are you sure?" (in place of the browser's grey confirm box):
// `await confirm({...})` resolves true on the main button, false on Cancel,
// Esc or a click outside. Render `element` once somewhere in the component.
export function useConfirm() {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);
  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    []
  );
  function close(ok: boolean) {
    request?.resolve(ok);
    setRequest(null);
  }
  const element = request ? (
    <Sheet
      open
      onClose={() => close(false)}
      title={request.title}
      footer={
        <>
          <Button onClick={() => close(false)}>Cancel</Button>
          <Button variant={request.danger ? "danger" : "primary"} onClick={() => close(true)}>
            {request.confirmLabel}
          </Button>
        </>
      }
    >
      {request.text ? <p className="text-[14px] leading-relaxed text-[var(--ink)]/70">{request.text}</p> : <span />}
    </Sheet>
  ) : null;
  return { confirm, element };
}

export type Confirm = ReturnType<typeof useConfirm>["confirm"];

// ---------------------------------------------------------------- Menu

export type MenuItem =
  | { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; href?: undefined }
  | { label: string; icon?: ReactNode; href: string; danger?: boolean; onSelect?: undefined };

// A "⋯" button with a small list of actions. Arrow keys move between items,
// Esc or a click elsewhere closes it.
export function Menu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    list.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function onKey(e: KeyboardEvent) {
    const els = [...(list.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      wrap.current?.querySelector<HTMLElement>("button")?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      els[(i + 1) % els.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      els[(i - 1 + els.length) % els.length]?.focus();
    }
  }

  const itemClass = (danger?: boolean) =>
    `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium outline-none transition hover:bg-black/[0.05] focus-visible:bg-black/[0.05] ${
      danger ? "text-[var(--danger)]" : "text-[var(--ink)]"
    }`;

  return (
    <div ref={wrap} className="relative" onKeyDown={onKey}>
      <IconButton label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <DotsThree size={20} weight="bold" />
      </IconButton>
      {open && (
        <div
          ref={list}
          role="menu"
          aria-label={label}
          className="dash-pop absolute right-0 top-full z-30 mt-1 w-52 rounded-2xl border border-[var(--line)] bg-white p-1.5 shadow-[0_12px_40px_rgba(28,24,19,0.14)]"
        >
          {items.map((it) =>
            it.href !== undefined ? (
              <a
                key={it.label}
                role="menuitem"
                href={it.href}
                target="_blank"
                rel="noopener noreferrer"
                className={itemClass(it.danger)}
                onClick={() => setOpen(false)}
              >
                {it.icon}
                {it.label}
              </a>
            ) : (
              <button
                key={it.label}
                role="menuitem"
                type="button"
                className={itemClass(it.danger)}
                onClick={() => {
                  setOpen(false);
                  it.onSelect();
                }}
              >
                {it.icon}
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- Segmented

// Filter tabs with counts. Scrolls sideways on a narrow screen rather than
// wrapping.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-full bg-black/[0.045] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] transition ${
              active ? "bg-white font-semibold text-[var(--ink)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "font-medium text-[var(--ink)]/65 hover:text-[var(--ink)]"
            }`}
          >
            {o.label}
            {o.count !== undefined && <span className={`tabular-nums ${active ? "text-[var(--ink)]/65" : "opacity-80"}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Toast

export type Toast = { id: number; text: string; error?: boolean };

// One short message at a time, bottom-centre: what just happened ("Rami was
// added"). Errors stay a little longer.
export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, error = false) => {
    if (timer.current) clearTimeout(timer.current);
    const t = { id: Date.now(), text, error };
    setToast(t);
    timer.current = setTimeout(() => setToast((cur) => (cur?.id === t.id ? null : cur)), error ? 8000 : 4500);
  }, []);
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, show, dismiss };
}

// `raised` lifts it above a bar already pinned to the bottom (the guest
// selection bar).
export function ToastView({ toast, onDismiss, raised }: { toast: Toast | null; onDismiss: () => void; raised?: boolean }) {
  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed inset-x-0 z-50 flex justify-center px-4 transition-[bottom] ${
        raised ? "bottom-[calc(140px+env(safe-area-inset-bottom))] lg:bottom-[88px]" : "bottom-[calc(84px+env(safe-area-inset-bottom))] lg:bottom-8"
      }`}
    >
      {toast && (
        <div
          key={toast.id}
          role={toast.error ? "alert" : "status"}
          className={`dash-rise pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl px-4 py-3 text-[14px] font-medium shadow-[0_12px_40px_rgba(28,24,19,0.25)] ${
            toast.error ? "bg-[var(--danger)] text-white" : "bg-[var(--ink)] text-[var(--cream)]"
          }`}
        >
          <span className="flex-1">{toast.text}</span>
          <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-mr-1 shrink-0 rounded-full p-0.5 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
