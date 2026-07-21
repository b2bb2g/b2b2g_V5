"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
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
  label: string | null;
  status: string;
  link: string | null;
  expiresAt: string;
  createdAt: string;
  usedAt: string | null;
  usedUid: number | null;
};

type Labels = {
  eyebrow: string;
  title: string;
  description: string;
  infoLabel: string;
  infoOneUse: string;
  infoExpires: string;
  infoRecopy: string;
  recipient: string;
  recipientPlaceholder: string;
  create: string;
  generated: string;
  copy: string;
  copied: string;
  qr: string;
  expires: string;
  noLabel: string;
  statusWaiting: string;
  statusSigningUp: string;
  statusJoined: string;
  statusExpired: string;
  statusRevoked: string;
  revoke: string;
  empty: string;
  tabActive: string;
  tabHistory: string;
  historyEmpty: string;
  activeLimit: string;
  error: string;
};

// Tap-anywhere-to-copy row. w-full + truncate keep it from ever overflowing;
// the long address collapses into a clear confirmation once copied.
function CopyLink({
  link,
  copyLabel,
  copiedLabel,
}: {
  link: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
        } catch {
          // Clipboard can be blocked; the visible link is still selectable.
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      aria-label={`${copyLabel}: ${link}`}
      className={`flex w-full items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 text-left transition ${
        copied ? "border-positive/40" : "border-line hover:border-primary/50"
      }`}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
          copied ? "bg-positive-soft text-positive" : "bg-primary-soft text-primary"
        }`}
      >
        {copied ? <CheckIcon /> : <LinkIcon />}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-xs font-semibold ${
          copied ? "text-positive" : "text-ink"
        }`}
      >
        {copied ? copiedLabel : link.replace(/^https?:\/\//, "")}
      </span>
      {!copied && (
        <span className="shrink-0 text-xs font-bold text-primary">
          {copyLabel}
        </span>
      )}
    </button>
  );
}

function statusMeta(status: string, labels: Labels) {
  switch (status) {
    case "reserved":
      return { text: labels.statusSigningUp, cls: "bg-caution-soft text-caution" };
    case "used":
      return { text: labels.statusJoined, cls: "bg-positive-soft text-positive" };
    case "expired":
      return { text: labels.statusExpired, cls: "bg-surface-sub text-ink-faint" };
    case "revoked":
      return { text: labels.statusRevoked, cls: "bg-surface-sub text-ink-faint" };
    default:
      return { text: labels.statusWaiting, cls: "bg-primary-soft text-primary" };
  }
}

function InvitationRow({
  invitation,
  labels,
  locale,
  highlight,
}: {
  invitation: Invitation;
  labels: Labels;
  locale: Locale;
  highlight: boolean;
}) {
  const meta = statusMeta(invitation.status, labels);
  const actionable = invitation.status === "active" || invitation.status === "reserved";
  return (
    <li
      className={`rounded-xl border p-3 transition ${
        highlight
          ? "border-primary/50 bg-primary-soft/40 ring-2 ring-primary/25"
          : "border-line bg-surface-sub/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-bold ${
              invitation.label ? "text-ink" : "text-ink-faint"
            }`}
          >
            {invitation.label || labels.noLabel}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">
            {invitation.status === "used" ? (
              <>
                {invitation.usedUid ? `UID:${invitation.usedUid} · ` : ""}
                <LocalDateTime
                  value={invitation.usedAt ?? invitation.createdAt}
                  locale={locale}
                />
              </>
            ) : (
              <>
                {labels.expires}:{" "}
                <LocalDateTime value={invitation.expiresAt} locale={locale} />
              </>
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.cls}`}
        >
          {meta.text}
        </span>
      </div>

      {actionable && invitation.link && (
        <>
          <div className="mt-2.5 flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <CopyLink
                link={invitation.link}
                copyLabel={labels.copy}
                copiedLabel={labels.copied}
              />
            </div>
            <form action={revokeReferralInvitation}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <PendingButton
                aria-label={labels.revoke}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-faint transition hover:bg-negative-soft hover:text-negative"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </PendingButton>
            </form>
          </div>
          <ReferralQr value={invitation.link} label={labels.qr} />
        </>
      )}
    </li>
  );
}

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
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);
  // Popover placement, computed from the "!" button's on-screen position when
  // it opens: horizontally clamped to keep a margin from both viewport edges
  // (so it never hugs the left edge on phones), and flipped above the button
  // when there isn't room below.
  const [pop, setPop] = useState<{
    left: number;
    width: number;
    placement: "top" | "bottom";
  }>({ left: 0, width: 272, placement: "bottom" });

  // Split the list so live links you still manage stay separate from the
  // pile of finished ones (joined / expired / cancelled).
  const [tab, setTab] = useState<"active" | "history">("active");
  const activeList = invitations.filter(
    (i) => i.status === "active" || i.status === "reserved",
  );
  const historyList = invitations.filter(
    (i) => i.status !== "active" && i.status !== "reserved",
  );
  const shown = tab === "active" ? activeList : historyList;

  function openInfo(event: ReactMouseEvent<HTMLButtonElement>) {
    if (infoOpen) {
      setInfoOpen(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const margin = 12;
    const width = Math.min(272, window.innerWidth - margin * 2);
    const target = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, margin),
      window.innerWidth - width - margin,
    );
    const spaceBelow = window.innerHeight - rect.bottom;
    setPop({
      left: target - rect.left,
      width,
      placement: spaceBelow < 210 && rect.top > 210 ? "top" : "bottom",
    });
    setInfoOpen(true);
  }

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
            onClick={openInfo}
            aria-expanded={infoOpen}
            aria-label={labels.infoLabel}
            className={`flex h-5 w-5 items-center justify-center rounded-full transition-colors ${
              infoOpen ? "text-primary" : "text-ink-faint hover:text-primary"
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
              style={{ left: pop.left, width: pop.width, animationDuration: "0.18s" }}
              className={`animate-fade-up absolute z-30 rounded-2xl border border-line bg-white p-4 text-left shadow-(--shadow-float) ${
                pop.placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
              }`}
            >
              <p className="text-xs font-extrabold text-ink">{labels.infoLabel}</p>
              <ul className="mt-2.5 space-y-2 text-[12px] leading-5 text-ink-soft">
                {[labels.infoOneUse, labels.infoExpires, labels.infoRecopy].map(
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
          <span className="text-xs font-bold text-ink-soft">{labels.recipient}</span>
          <input
            type="text"
            name="label"
            maxLength={80}
            autoComplete="off"
            placeholder={labels.recipientPlaceholder}
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
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-positive-soft px-3 py-2 text-xs font-bold text-positive">
          <CheckIcon />
          {labels.generated}
        </p>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <div className="flex gap-1 rounded-xl bg-surface-sub p-1">
          {(
            [
              ["active", labels.tabActive, activeList.length],
              ["history", labels.tabHistory, historyList.length],
            ] as const
          ).map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                tab === key
                  ? "bg-white text-ink shadow-sm"
                  : "text-ink-faint hover:text-ink-soft"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                    tab === key
                      ? "bg-primary-soft text-primary"
                      : "bg-line text-ink-faint"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="px-1 py-4 text-xs text-ink-faint">
            {tab === "active" ? labels.empty : labels.historyEmpty}
          </p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {shown.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                labels={labels}
                locale={locale}
                highlight={Boolean(state.link) && invitation.link === state.link}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
