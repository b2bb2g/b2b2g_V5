"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useFormStatus } from "react-dom";
import {
  createReferralInvitation,
  revokeReferralInvitation,
  updateReferralInvitationLabel,
  type InvitationActionState,
} from "@/app/actions/invitations";
import { LocalDateTime } from "@/components/ui/LocalDateTime";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
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
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    </svg>
  );
}

const emptySubscribe = () => () => {};
// False on the server and the first client render, true after mount — used to
// gate client-only affordances (native share) without a hydration mismatch.
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

type Invitation = {
  id: string;
  label: string | null;
  status: string;
  link: string | null;
  expiresAt: string;
  expiresInDays: number;
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
  recipientHint: string;
  create: string;
  generated: string;
  copy: string;
  copied: string;
  share: string;
  shareTitle: string;
  qr: string;
  edit: string;
  save: string;
  cancel: string;
  expiresInDays: string;
  expiresToday: string;
  expiresTomorrow: string;
  noLabel: string;
  statusWaiting: string;
  statusSigningUp: string;
  statusJoined: string;
  statusExpired: string;
  statusRevoked: string;
  revoke: string;
  revokeConfirmTitle: string;
  revokeConfirmBody: string;
  revokeConfirmYes: string;
  empty: string;
  tabActive: string;
  tabHistory: string;
  historyEmpty: string;
  activeLimit: string;
  error: string;
};

// Tap-anywhere-to-copy row; w-full + truncate keep it from ever overflowing.
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
        <span className="shrink-0 text-xs font-bold text-primary">{copyLabel}</span>
      )}
    </button>
  );
}

// Native share (KakaoTalk / Messages / …). Only rendered where the Web Share
// API exists (mobile); on desktop the Copy affordance is enough.
function ShareLink({
  link,
  title,
  label,
}: {
  link: string;
  title: string;
  label: string;
}) {
  const mounted = useMounted();
  const canShare =
    mounted &&
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function";
  if (!canShare) return null;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        navigator.share({ title, url: link }).catch(() => {});
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-strong"
    >
      <ShareIcon />
    </button>
  );
}

// Save button that closes the editor once the server action settles.
function LabelSaveButton({
  onSettled,
  label,
}: {
  onSettled: () => void;
  label: string;
}) {
  const { pending } = useFormStatus();
  const was = useRef(false);
  useEffect(() => {
    if (was.current && !pending) onSettled();
    was.current = pending;
  }, [pending, onSettled]);
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white disabled:opacity-60"
    >
      {pending ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        <CheckIcon />
      )}
    </button>
  );
}

// Inline view -> edit of the recipient memo (active/reserved rows only).
function LabelEditor({
  invitation,
  labels,
}: {
  invitation: Invitation;
  labels: Labels;
}) {
  const [editing, setEditing] = useState(false);
  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-1">
        <p
          className={`truncate text-sm font-bold ${
            invitation.label ? "text-ink" : "text-ink-faint"
          }`}
        >
          {invitation.label || labels.noLabel}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={labels.edit}
          className="shrink-0 rounded-md p-1 text-ink-faint transition hover:text-primary"
        >
          <PencilIcon />
        </button>
      </div>
    );
  }
  return (
    <form
      action={updateReferralInvitationLabel}
      className="flex min-w-0 items-center gap-1.5"
    >
      <input type="hidden" name="invitationId" value={invitation.id} />
      <input
        name="label"
        defaultValue={invitation.label ?? ""}
        maxLength={80}
        autoFocus
        autoComplete="off"
        placeholder={labels.recipientPlaceholder}
        className="min-w-0 flex-1 rounded-lg border border-primary/45 px-2.5 py-1.5 text-sm outline-none focus:border-primary"
      />
      <LabelSaveButton onSettled={() => setEditing(false)} label={labels.save} />
      <button
        type="button"
        onClick={() => setEditing(false)}
        aria-label={labels.cancel}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-faint transition hover:bg-surface-sub hover:text-ink"
      >
        <XIcon />
      </button>
    </form>
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

function expiryText(days: number, labels: Labels) {
  if (days <= 0) return labels.expiresToday;
  if (days === 1) return labels.expiresTomorrow;
  return labels.expiresInDays.replace("{n}", String(days));
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
  const actionable =
    invitation.status === "active" || invitation.status === "reserved";
  const urgent = actionable && invitation.expiresInDays <= 2;
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
          {actionable ? (
            <LabelEditor invitation={invitation} labels={labels} />
          ) : (
            <p
              className={`truncate text-sm font-bold ${
                invitation.label ? "text-ink" : "text-ink-faint"
              }`}
            >
              {invitation.label || labels.noLabel}
            </p>
          )}
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">
            {invitation.status === "used" ? (
              <>
                {invitation.usedUid ? `UID:${invitation.usedUid} · ` : ""}
                <LocalDateTime
                  value={invitation.usedAt ?? invitation.createdAt}
                  locale={locale}
                />
              </>
            ) : actionable ? (
              <span className={urgent ? "font-semibold text-caution" : undefined}>
                {expiryText(invitation.expiresInDays, labels)}
              </span>
            ) : (
              <LocalDateTime value={invitation.expiresAt} locale={locale} />
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
            <ShareLink
              link={invitation.link}
              title={labels.shareTitle}
              label={labels.share}
            />
            <form action={revokeReferralInvitation}>
              <input type="hidden" name="invitationId" value={invitation.id} />
              <ConfirmSubmit
                label={
                  <>
                    <TrashIcon />
                    <span className="sr-only">{labels.revoke}</span>
                  </>
                }
                className="flex h-10 w-10 items-center justify-center rounded-xl text-ink-faint transition hover:bg-negative-soft hover:text-negative"
                confirmTitle={labels.revokeConfirmTitle}
                confirmBody={labels.revokeConfirmBody}
                confirmLabel={labels.revokeConfirmYes}
                cancelLabel={labels.cancel}
                destructive
              />
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
  const [pop, setPop] = useState<{
    left: number;
    width: number;
    placement: "top" | "bottom";
  }>({ left: 0, width: 272, placement: "bottom" });

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

      <form action={action} className="mt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="min-w-0 flex-1">
            <span className="text-xs font-bold text-ink-soft">{labels.recipient}</span>
            <input
              key={state.link ?? "new"}
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
        </div>
        <p className="mt-2 text-[11px] text-ink-faint">{labels.recipientHint}</p>
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
