import { notFound, redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { replyInquiry } from "@/app/actions/inquiries";
import { INQUIRY_STATUS, MESSAGE_REVIEW_STATUS } from "@/lib/constants";
import type { Inquiry, InquiryMessage } from "@/lib/types";

const TIMELINE: string[] = [
  INQUIRY_STATUS.SENT,
  INQUIRY_STATUS.ADMIN_REVIEW,
  INQUIRY_STATUS.FORWARDED,
  INQUIRY_STATUS.ANSWERED,
  INQUIRY_STATUS.ANSWER_REVIEW,
  INQUIRY_STATUS.ANSWER_DELIVERED,
];

// Correspondence thread with a parcel-tracking style progress timeline
// (DESIGN 1.3: waiting as process, not anxiety). Not a chat UI.
export default async function InquiryDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const [{ id }, query] = await Promise.all([props.params, props.searchParams]);
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
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
    inquiry.sender_id === session.userId || inquiry.recipient_id === session.userId;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-lg font-extrabold leading-snug">{inquiry.subject}</h1>
        <div className="mt-2">
          <StatusLabel
            status={inquiry.status}
            label={stepLabels[inquiry.status] ?? inquiry.status}
          />
        </div>
      </header>

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

      {query.sent && (
        <p className="rounded-lg bg-positive-soft px-3 py-2 text-xs font-semibold text-positive">
          {t.inquiry.sent}
        </p>
      )}

      {/* Correspondence log: card per letter, not bubbles */}
      <div className="space-y-3">
        {messages.map((message) => {
          const mine = message.sender_id === session.userId;
          return (
            <article
              key={message.id}
              className="rounded-card border border-line p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-ink-soft">
                  {mine ? t.inquiry.outbox : t.inquiry.inbox}
                  <span className="ml-2 font-normal text-ink-faint">
                    {new Date(message.created_at).toISOString().slice(0, 16).replace("T", " ")}
                  </span>
                </p>
                {mine && (
                  <StatusLabel
                    status={
                      message.review_status === MESSAGE_REVIEW_STATUS.PENDING
                        ? "admin_review"
                        : message.review_status === MESSAGE_REVIEW_STATUS.FORWARDED
                          ? "forwarded"
                          : "rejected"
                    }
                    label={
                      message.review_status === MESSAGE_REVIEW_STATUS.PENDING
                        ? stepLabels.admin_review
                        : message.review_status === MESSAGE_REVIEW_STATUS.FORWARDED
                          ? stepLabels.forwarded
                          : stepLabels.rejected
                    }
                  />
                )}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {message.body}
              </p>
              {message.admin_feedback && (
                <p className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-xs text-primary-strong">
                  {t.inquiry.adminFeedback}: {message.admin_feedback}
                </p>
              )}
              {mine &&
                message.review_status === MESSAGE_REVIEW_STATUS.REJECTED &&
                message.reject_reason && (
                  <p className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs text-negative">
                    {t.post.rejectionReason}: {message.reject_reason}
                  </p>
                )}
            </article>
          );
        })}
      </div>

      {/* Reply is an explicit compose step, not an instant-send input */}
      {isParticipant && (
        <details className="rounded-card border border-line p-4">
          <summary className="cursor-pointer text-sm font-bold text-primary">
            {t.inquiry.writeReply}
          </summary>
          {query.error && (
            <p className="mt-3 rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
              {t.common.error}
            </p>
          )}
          <form action={replyInquiry} className="mt-3 space-y-3">
            <input type="hidden" name="inquiryId" value={inquiry.id} />
            <textarea
              name="body"
              rows={6}
              required
              className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong"
            >
              {t.inquiry.send}
            </button>
          </form>
        </details>
      )}
    </div>
  );
}
