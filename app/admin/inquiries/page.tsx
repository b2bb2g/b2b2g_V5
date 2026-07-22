import { getT } from "@/lib/i18n/server";
import { signInquiryMedia } from "@/lib/inquiry-media";
import { AttachmentThumbs } from "@/components/ui/AttachmentThumbs";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewMessage } from "@/app/actions/admin/reviews";
import { MESSAGE_REVIEW_STATUS } from "@/lib/constants";
import type { InquiryMessage } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { ReviewDecisionForm } from "@/components/admin/ReviewDecisionForm";
import { ReviewHotkeys } from "@/components/admin/ReviewHotkeys";

const PAGE_SIZE = 20;

export default async function InquiryModerationPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ t }, supabase, params] = await Promise.all([
    getT(),
    createClient(),
    props.searchParams,
  ]);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("inquiry_messages")
    .select("*, inquiries(subject, sender_id, recipient_id), profiles!inquiry_messages_sender_id_fkey(uid, display_name)", { count: "exact" })
    .eq("review_status", MESSAGE_REVIEW_STATUS.PENDING)
    .order("created_at")
    .range(from, from + PAGE_SIZE - 1);

  const messages = (data ?? []) as unknown as (InquiryMessage & {
    inquiries: { subject: string } | null;
    profiles: { uid: number; display_name: string | null } | null;
  })[];

  // Inquiry images are in a private bucket; sign per message (admin RLS lets the
  // reviewer see them). Never emit a public URL for private correspondence.
  const signedByMessage = new Map<string, string[]>();
  await Promise.all(
    messages.map(async (message) => {
      if (message.media_paths?.length) {
        signedByMessage.set(
          message.id,
          await signInquiryMedia(supabase, message.media_paths),
        );
      }
    }),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-base font-bold">{t.admin.inquiryModeration}</h2>
          {(count ?? 0) > 0 && (
            <span className="rounded-full bg-caution-soft px-2.5 py-0.5 text-xs font-bold text-caution">
              {count} {t.admin.awaitingReview}
            </span>
          )}
        </div>
        <ReviewHotkeys hint={t.admin.hotkeyHint} />
      </div>
      {messages.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              data-review-card
              tabIndex={-1}
              className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-(--shadow-card) focus:outline-none focus:ring-2 focus:ring-primary/60 focus:ring-offset-2"
            >
              <p className="text-xs font-semibold text-ink-faint">
                {message.inquiries?.subject}
                {" · "}
                {message.profiles?.display_name}
                {" · UID "}
                {message.profiles?.uid}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {message.body}
              </p>
              {(signedByMessage.get(message.id)?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <AttachmentThumbs
                    images={signedByMessage.get(message.id) ?? []}
                    size="sm"
                    closeLabel={t.common.close}
                    previousLabel={t.home.prev}
                    nextLabel={t.home.next}
                  />
                </div>
              )}
              <ReviewDecisionForm
                action={reviewMessage}
                idField="messageId"
                idValue={message.id}
                approveValue="forward"
                approveLabel={t.admin.forward}
                rejectValue="reject"
                rejectLabel={t.admin.reject}
                confirmRejectLabel={t.admin.confirmReturn}
                reasonPlaceholder={t.admin.rejectReason}
                cancelLabel={t.common.cancel}
                feedbackPlaceholder={t.admin.feedback}
              />
            </article>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/inquiries" prevLabel={t.home.prev} nextLabel={t.home.next} />
    </div>
  );
}
