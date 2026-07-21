"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createReferralInvitation,
  revokeReferralInvitation,
  type InvitationActionState,
} from "@/app/actions/invitations";
import { PendingButton } from "@/components/ui/PendingButton";
import { LocalDateTime } from "@/components/ui/LocalDateTime";
import type { Locale } from "@/lib/constants";
import { ReferralQr } from "@/components/ui/ReferralQr";

function LinkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

type Invitation = {
  id: string;
  status: string;
  expires_at: string;
  created_at: string;
};

type Labels = {
  eyebrow: string;
  title: string;
  description: string;
  infoLabel: string;
  infoOneUse: string;
  infoExpires: string;
  infoCopyOnce: string;
  emailLabel: string;
  emailOptional: string;
  create: string;
  generated: string;
  copy: string;
  copied: string;
  qr: string;
  expires: string;
  active: string;
  reserved: string;
  revoke: string;
  empty: string;
  activeLimit: string;
  error: string;
};

export function InvitationManager({
  invitations,
  labels,
  locale,
}: {
  invitations: Invitation[];
  labels: Labels;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState<InvitationActionState, FormData>(
    createReferralInvitation,
    {},
  );
  const [copied, setCopied] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  // Close the info popover on Escape or a click outside it.
  useEffect(() => {
    if (!infoOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    const onClick = (event: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(event.target as Node)) {
        setInfoOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onClick);
    };
  }, [infoOpen]);

  return (
    <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-primary">{labels.eyebrow}</p>
      <div className="mt-2 flex items-center gap-2">
        <h2 className="text-base font-extrabold">{labels.title}</h2>
        <div ref={infoRef} className="relative flex">
          <button
            type="button"
            onClick={() => setInfoOpen((v) => !v)}
            aria-expanded={infoOpen}
            aria-label={labels.infoLabel}
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              infoOpen
                ? "text-primary"
                : "text-ink-faint hover:text-primary"
            }`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>
          {infoOpen && (
            <div
              role="dialog"
              aria-label={labels.infoLabel}
              className="animate-fade-up absolute left-1/2 top-8 z-30 w-[min(17rem,calc(100vw-2.5rem))] max-w-[17rem] -translate-x-1/2 rounded-2xl border border-line bg-white p-4 text-left shadow-(--shadow-float)"
              style={{ animationDuration: "0.18s" }}
            >
              <p className="text-xs font-extrabold text-ink">{labels.infoLabel}</p>
              <ul className="mt-2.5 space-y-2 text-[12px] leading-5 text-ink-soft">
                {[labels.infoOneUse, labels.infoExpires, labels.infoCopyOnce].map(
                  (line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span>{line}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs leading-5 text-ink-faint">{labels.description}</p>

      <form action={action} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1">
          <span className="text-xs font-bold text-ink-soft">{labels.emailLabel}</span>
          <input
            type="email"
            name="email"
            placeholder={labels.emailOptional}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className="btn-primary btn-md shrink-0 disabled:opacity-60"
        >
          {pending ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : labels.create}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="mt-3 rounded-xl bg-negative-soft px-3 py-2 text-xs font-bold text-negative">
          {state.error === "active_limit" ? labels.activeLimit : labels.error}
        </p>
      )}

      {state.link && (
        <div className="mt-4 rounded-2xl border border-primary/20 bg-primary-soft/45 p-4">
          <p className="text-xs font-extrabold text-primary">{labels.generated}</p>

          {/* One tap anywhere on the row copies; the row itself is the
              affordance, so it never overflows (w-full + truncate) and the
              long address collapses into a clear confirmation once copied. */}
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.link!);
              } catch {
                // Clipboard can be blocked; the visible link is still selectable.
              }
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
            aria-label={`${labels.copy}: ${state.link}`}
            className={`mt-2 flex w-full items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-left transition ${
              copied
                ? "border-positive/40"
                : "border-line hover:border-primary/50"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                copied
                  ? "bg-positive-soft text-positive"
                  : "bg-primary-soft text-primary"
              }`}
            >
              {copied ? <CheckIcon /> : <LinkIcon />}
            </span>
            <span
              className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                copied ? "text-positive" : "text-ink"
              }`}
            >
              {copied
                ? labels.copied
                : state.link.replace(/^https?:\/\//, "")}
            </span>
            {!copied && (
              <span className="shrink-0 text-xs font-bold text-primary">
                {labels.copy}
              </span>
            )}
          </button>

          <p className="mt-2 text-[11px] text-ink-faint">
            {labels.expires}:{" "}
            <LocalDateTime value={state.expiresAt!} locale={locale} />
          </p>
          <ReferralQr value={state.link} label={labels.qr} />
        </div>
      )}

      <div className="mt-5 border-t border-line pt-4">
        {invitations.length === 0 ? (
          <p className="text-xs text-ink-faint">{labels.empty}</p>
        ) : (
          <ul className="space-y-2">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-sub px-3 py-2.5">
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-ink-soft">
                    {invitation.status === "reserved" ? labels.reserved : labels.active}
                  </span>
                  <p className="mt-0.5 truncate text-[11px] text-ink-faint">
                    {labels.expires}: <LocalDateTime value={invitation.expires_at} locale={locale} />
                  </p>
                </div>
                <form action={revokeReferralInvitation}>
                  <input type="hidden" name="invitationId" value={invitation.id} />
                  <PendingButton className="rounded-lg px-3 py-2 text-xs font-bold text-negative hover:bg-negative-soft">
                    {labels.revoke}
                  </PendingButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
