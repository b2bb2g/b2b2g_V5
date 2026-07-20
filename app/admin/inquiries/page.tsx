import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { postMediaUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewMessage } from "@/app/actions/admin/reviews";
import { MESSAGE_REVIEW_STATUS } from "@/lib/constants";
import type { InquiryMessage } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { ReviewDecisionForm } from "@/components/admin/ReviewDecisionForm";

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
              {(message.media_paths?.length ?? 0) > 0 && (
                <div className="mt-3 flex gap-2">
                  {(message.media_paths ?? []).map((path) => (
                    <a
                      key={path}
                      href={postMediaUrl(path)}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-xl border border-line transition hover:opacity-90"
                    >
                      <Image
                        src={postMediaUrl(path)}
                        alt=""
                        width={140}
                        height={140}
                        className="h-28 w-28 object-cover"
                      />
                    </a>
                  ))}
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
