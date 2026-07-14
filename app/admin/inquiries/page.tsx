import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewMessage } from "@/app/actions/admin/reviews";
import { MESSAGE_REVIEW_STATUS } from "@/lib/constants";
import type { InquiryMessage } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { MessageReviewForm } from "@/components/admin/MessageReviewForm";

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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-base font-bold">{t.admin.inquiryModeration}</h2>
        {(count ?? 0) > 0 && (
          <span className="rounded-full bg-caution-soft px-2.5 py-0.5 text-xs font-bold text-caution">
            {count} {t.admin.awaitingReview}
          </span>
        )}
      </div>
      {messages.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        <div className="space-y-3">
          {messages.map((message) => (
            <article
              key={message.id}
              className="rounded-[1.25rem] border border-line bg-surface p-5 shadow-(--shadow-card)"
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
              <MessageReviewForm
                messageId={message.id}
                action={reviewMessage}
                labels={{
                  feedback: t.admin.feedback,
                  forward: t.admin.forward,
                  return: t.admin.reject,
                  reason: t.admin.rejectReason,
                  cancel: t.common.cancel,
                  confirmReturn: t.admin.confirmReturn,
                }}
              />
            </article>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))} basePath="/admin/inquiries" prevLabel={t.home.prev} nextLabel={t.home.next} />
    </div>
  );
}
