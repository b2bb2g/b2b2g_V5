import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewMessage } from "@/app/actions/admin";
import { MESSAGE_REVIEW_STATUS } from "@/lib/constants";
import type { InquiryMessage } from "@/lib/types";

export default async function InquiryModerationPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("inquiry_messages")
    .select("*, inquiries(subject, sender_id, recipient_id), profiles!inquiry_messages_sender_id_fkey(uid, display_name)")
    .eq("review_status", MESSAGE_REVIEW_STATUS.PENDING)
    .order("created_at");

  const messages = (data ?? []) as unknown as (InquiryMessage & {
    inquiries: { subject: string } | null;
    profiles: { uid: number; display_name: string | null } | null;
  })[];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.inquiryModeration}</h2>
      {messages.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        messages.map((message) => (
          <div key={message.id} className="rounded-card border border-line p-4">
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
            <form action={reviewMessage} className="mt-3 space-y-2">
              <input type="hidden" name="messageId" value={message.id} />
              <input
                name="feedback"
                placeholder={t.admin.feedback}
                className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <input
                name="reason"
                placeholder={t.admin.rejectReason}
                className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="decision"
                  value="forward"
                  className="flex-1 rounded-xl bg-positive px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.forward}
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="flex-1 rounded-xl bg-negative px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.reject}
                </button>
              </div>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
