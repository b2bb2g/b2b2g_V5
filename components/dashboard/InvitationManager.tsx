"use client";

import { useActionState, useState } from "react";
import {
  createReferralInvitation,
  revokeReferralInvitation,
  type InvitationActionState,
} from "@/app/actions/invitations";
import { PendingButton } from "@/components/ui/PendingButton";
import { ReferralQr } from "@/components/ui/ReferralQr";

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
}: {
  invitations: Invitation[];
  labels: Labels;
}) {
  const [state, action, pending] = useActionState<InvitationActionState, FormData>(
    createReferralInvitation,
    {},
  );
  const [copied, setCopied] = useState(false);

  return (
    <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[.15em] text-primary">{labels.eyebrow}</p>
      <h2 className="mt-2 text-base font-extrabold">{labels.title}</h2>
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
          <div className="mt-2 flex gap-2">
            <input readOnly value={state.link} className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-xs" />
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(state.link!);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1800);
              }}
              className="rounded-xl bg-ink px-4 text-xs font-bold text-white"
            >
              {copied ? labels.copied : labels.copy}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            {labels.expires}: {new Date(state.expiresAt!).toLocaleString()}
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
                    {labels.expires}: {new Date(invitation.expires_at).toLocaleString()}
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
