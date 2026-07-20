import { notFound, redirect } from "next/navigation";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { replyInquiry } from "@/app/actions/inquiries";
import { INQUIRY_STATUS, MESSAGE_REVIEW_STATUS } from "@/lib/constants";
import type { Inquiry, InquiryMessage } from "@/lib/types";
import { PendingButton } from "@/components/ui/PendingButton";
import { InquiryReadMarker } from "@/components/inquiries/InquiryReadMarker";
import { InquiryLive } from "@/components/inquiries/InquiryLive";
import { formatDateTime } from "@/lib/format";

const TIMELINE: string[] = [
  INQUIRY_STATUS.SENT,
  INQUIRY_STATUS.ADMIN_REVIEW,
  INQUIRY_STATUS.FORWARDED,
  INQUIRY_STATUS.ANSWERED,
  INQUIRY_STATUS.ANSWER_REVIEW,
  INQUIRY_STATUS.ANSWER_DELIVERED,
];

// Correspondence thread with a parcel-tracking style progress timeline
// (DESIGN 1.3: waiting as process, not anxiety). Messenger-style bubbles,
// but delivery still runs through review — never instant chat.
export default async function InquiryDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([props.params, props.searchParams]);
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: inquiryRow } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!inquiryRow) notFound();
  const inquiry = inquiryRow as Inquiry;

  // RLS already filters: own messages always, the other side's only when forwarded.
  const { data: messageRows } = await supabase
    .from("inquiry_messages")
    .select("*")
    .eq("inquiry_id", id)
    .order("created_at");
  const messages = (messageRows ?? []) as InquiryMessage[];

  const stepLabels: Record<string, string> = t.inquiry.steps;
  const currentStep = TIMELINE.indexOf(inquiry.status);
  const isParticipant =
    inquiry.sender_id === session.userId ||
    inquiry.recipient_id === session.userId;

  // The latest own message, if rejected, gets a dedicated revise-and-resend
  // form instead of the generic reply composer (PRD 8.3).
  const myMessages = messages.filter((m) => m.sender_id === session.userId);
  const lastMine = myMessages[myMessages.length - 1];
  const rejectedToRevise =
    lastMine && lastMine.review_status === MESSAGE_REVIEW_STATUS.REJECTED
      ? lastMine
      : null;

  // Read receipt: the counterparty's stamped read time (columns arrive with
  // the read-receipt migration; absent means no receipt shown).
  const receipts = inquiryRow as {
    sender_last_read_at?: string | null;
    recipient_last_read_at?: string | null;
  };
  const otherLastReadAt =
    inquiry.sender_id === session.userId
      ? receipts.recipient_last_read_at
      : receipts.sender_last_read_at;
  const lastDeliveredMine = [...myMessages]
    .reverse()
    .find((m) => m.review_status === MESSAGE_REVIEW_STATUS.FORWARDED);
  const dayOf = (iso: string) => iso.slice(0, 10);

  return (
    <div className="space-y-5">
      {isParticipant && <InquiryReadMarker inquiryId={inquiry.id} />}
      {isParticipant && (
        <InquiryLive
          inquiryId={inquiry.id}
          userId={session.userId}
          messageCount={messages.length}
        />
      )}
      <PageHeader
        title={inquiry.subject}
        action={
          <StatusLabel
            status={inquiry.status}
            label={stepLabels[inquiry.status] ?? inquiry.status}
          />
        }
      />

      {/* Progress timeline (6-step cycle, PRD 8.2) */}
      <ol className="flex items-center gap-1">
        {TIMELINE.map((step, i) => (
          <li key={step} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={`h-2 w-full rounded-full ${
                inquiry.status === INQUIRY_STATUS.REJECTED
                  ? "bg-negative-soft"
                  : i <= currentStep
                    ? "bg-primary"
                    : "bg-surface-sub"
              }`}
            />
            <span className="hidden text-center text-[10px] font-semibold text-ink-faint sm:block">
              {stepLabels[step]}
            </span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-ink-faint">{t.inquiry.stepHint}</p>

      {/* Messenger-style thread: my letters right, theirs left, day breaks
          between groups. Review status rides under my bubbles. */}
      <div className="space-y-3">
        {messages.map((message, index) => {
          const mine = message.sender_id === session.userId;
          const rejected =
            message.review_status === MESSAGE_REVIEW_STATUS.REJECTED;
          const previous = messages[index - 1];
          const newDay =
            !previous || dayOf(previous.created_at) !== dayOf(message.created_at);
          const statusText = mine
            ? message.review_status === MESSAGE_REVIEW_STATUS.PENDING
              ? stepLabels.admin_review
              : message.review_status === MESSAGE_REVIEW_STATUS.FORWARDED
                ? stepLabels.forwarded
                : stepLabels.rejected
            : null;
          const showReadReceipt =
            mine &&
            message.id === lastDeliveredMine?.id &&
            !!otherLastReadAt &&
            otherLastReadAt >= message.created_at;
          return (
            <div key={message.id}>
              {newDay && (
                <p className="my-4 text-center text-[11px] font-bold text-ink-faint">
                  <span className="rounded-full bg-surface-sub px-3 py-1">
                    {dayOf(message.created_at)}
                  </span>
                </p>
              )}
              <article
                className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.25rem] px-4 py-3 sm:max-w-[75%] ${
                    mine
                      ? rejected
                        ? "rounded-br-md bg-negative-soft text-ink"
                        : "rounded-br-md bg-primary text-white"
                      : "rounded-bl-md bg-surface-sub text-ink"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                    {message.body}
                  </p>
                  {message.admin_feedback && (
                    <p
                      className={`mt-2.5 rounded-lg px-3 py-2 text-xs ${mine && !rejected ? "bg-white/15 text-white/90" : "bg-primary-soft text-primary-strong"}`}
                    >
                      {t.inquiry.adminFeedback}: {message.admin_feedback}
                    </p>
                  )}
                  {mine && rejected && message.reject_reason && (
                    <p className="mt-2.5 rounded-lg bg-white/60 px-3 py-2 text-xs font-semibold text-negative">
                      {t.post.rejectionReason}: {message.reject_reason}
                    </p>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-ink-faint">
                  {formatDateTime(message.created_at, locale)}
                  {statusText && (
                    <span
                      className={`font-bold ${rejected ? "text-negative" : message.review_status === MESSAGE_REVIEW_STATUS.FORWARDED ? "text-positive" : "text-ink-soft"}`}
                    >
                      · {statusText}
                    </span>
                  )}
                  {showReadReceipt && (
                    <span className="font-bold text-primary">
                      · {t.inquiry.read}
                    </span>
                  )}
                </p>
              </article>
            </div>
          );
        })}
        <div id="thread-end" aria-hidden="true" />
      </div>

      {/* Rejected message: dedicated revise-and-resend entry (PRD 8.3) */}
      {isParticipant && rejectedToRevise && (
        <section className="rounded-card border border-line p-4">
          <p className="text-sm font-bold">{t.inquiry.reviseResendTitle}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            {t.inquiry.reviseResendHint}
          </p>
          <form action={replyInquiry} className="mt-3 space-y-3">
            <input type="hidden" name="inquiryId" value={inquiry.id} />
            <textarea
              name="body"
              rows={6}
              required
              defaultValue={rejectedToRevise.body}
              className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <PendingButton className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong">
              {t.inquiry.resend}
            </PendingButton>
          </form>
        </section>
      )}

      {/* Reply is an explicit compose step, not an instant-send input */}
      {isParticipant && !rejectedToRevise && (
        <section
          aria-label={t.inquiry.writeReply}
          className="sticky bottom-3 rounded-[1.25rem] border border-line bg-white p-3 shadow-[0_10px_35px_rgba(25,31,40,.1)]"
        >
          {query.error && (
            <p className="mb-2 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
              {t.common.error}
            </p>
          )}
          <form action={replyInquiry} className="flex items-end gap-2">
            <input type="hidden" name="inquiryId" value={inquiry.id} />
            <textarea
              name="body"
              rows={2}
              required
              placeholder={t.inquiry.replyPlaceholder}
              className="plain-input min-h-11 w-full flex-1 resize-y rounded-2xl border border-line bg-surface-sub px-4 py-2.5 text-sm leading-6 transition focus:border-primary/50"
            />
            <PendingButton
              pendingLabel=""
              title={t.inquiry.send}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-strong"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span className="sr-only">{t.inquiry.send}</span>
            </PendingButton>
          </form>
          <p className="mt-2 px-1 text-[11px] text-ink-faint">
            {t.inquiry.stepHint}
          </p>
        </section>
      )}
    </div>
  );
}
