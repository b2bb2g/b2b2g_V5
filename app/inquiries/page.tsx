import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import type { Inquiry } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";
import { postMediaUrl } from "@/lib/media";
import { NOTIFICATION_STATE } from "@/lib/constants";
import { markAllInquiriesRead } from "@/app/actions/inquiries";
import { PendingButton } from "@/components/ui/PendingButton";

const PAGE_SIZE = 20;

// Conversation-style inquiry list: counterpart identity, latest visible
// message preview, unread dot. Delivery still runs through review.
export default async function InquiriesPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t, locale }, supabase, params] = await Promise.all([
    getT(),
    createClient(),
    props.searchParams,
  ]);
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("inquiries")
    .select("*", { count: "exact" })
    .or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`)
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const inquiries = (data ?? []) as Inquiry[];
  const stepLabels: Record<string, string> = t.inquiry.steps;
  const inquiryIds = inquiries.map((inquiry) => inquiry.id);
  const counterpartIds = [
    ...new Set(
      inquiries.map((inquiry) =>
        inquiry.sender_id === session.userId
          ? inquiry.recipient_id
          : inquiry.sender_id,
      ),
    ),
  ];

  // Unread dots, counterpart identities, and the latest visible message per
  // thread (RLS keeps unreviewed counterpart messages out of the preview).
  const [{ data: unreadRows }, { data: counterpartRows }, { data: messageRows }] =
    await Promise.all([
      supabase
        .from("notifications")
        .select("payload")
        .eq("profile_id", session.userId)
        .eq("state", NOTIFICATION_STATE.UNREAD)
        .in("type", ["message_delivered", "message_rejected"]),
      counterpartIds.length
        ? supabase
            .from("profiles")
            .select("id, uid, avatar_url")
            .in("id", counterpartIds)
        : Promise.resolve({
            data: [] as { id: string; uid: number; avatar_url: string | null }[],
          }),
      inquiryIds.length
        ? supabase
            .from("inquiry_messages")
            .select("inquiry_id, body, created_at")
            .in("inquiry_id", inquiryIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({
            data: [] as { inquiry_id: string; body: string; created_at: string }[],
          }),
    ]);
  const unreadInquiryIds = new Set(
    (unreadRows ?? [])
      .map((row) => (row.payload as { inquiry_id?: string }).inquiry_id)
      .filter(Boolean),
  );
  const counterparts = new Map(
    (counterpartRows ?? []).map((row) => [row.id, row]),
  );
  const previews = new Map<string, string>();
  for (const message of messageRows ?? []) {
    if (!previews.has(message.inquiry_id)) {
      previews.set(message.inquiry_id, message.body);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.inquiry.title}
        subtitle={t.inquiry.stepHint}
        action={
          unreadInquiryIds.size > 0 ? (
            <form action={markAllInquiriesRead}>
              <PendingButton className="rounded-lg px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft/60">
                {t.notifications.markAllRead}
              </PendingButton>
            </form>
          ) : undefined
        }
      />

      {inquiries.length === 0 ? (
        <EmptyState
          title={t.inquiry.noInquiries}
          hint={t.common.emptyListHint}
        />
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-line/70 bg-white shadow-(--shadow-card)">
          <div className="divide-y divide-line">
            {inquiries.map((inquiry) => {
              const outgoing = inquiry.sender_id === session.userId;
              const unread = unreadInquiryIds.has(inquiry.id);
              const counterpart = counterparts.get(
                outgoing ? inquiry.recipient_id : inquiry.sender_id,
              );
              const preview = previews.get(inquiry.id);
              return (
                <Link
                  key={inquiry.id}
                  href={`/inquiries/${inquiry.id}`}
                  className="group flex items-center gap-3 p-4 transition hover:bg-surface-sub/45 sm:px-5"
                >
                  {counterpart?.avatar_url ? (
                    <Image
                      src={postMediaUrl(counterpart.avatar_url)}
                      alt=""
                      width={44}
                      height={44}
                      className="h-11 w-11 shrink-0 rounded-full border border-line object-cover"
                    />
                  ) : (
                    <DefaultAvatar className="h-11 w-11 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-sm ${unread ? "font-extrabold text-ink" : "font-bold"}`}
                      >
                        {counterpart ? `UID:${counterpart.uid}` : inquiry.subject}
                      </span>
                      <StatusLabel
                        status={inquiry.status}
                        label={stepLabels[inquiry.status] ?? inquiry.status}
                      />
                      {unread && (
                        <span className="sr-only">{t.notifications.title}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs font-semibold text-ink-soft">
                      {inquiry.subject}
                    </p>
                    {preview && (
                      <p
                        className={`mt-0.5 truncate text-xs ${unread ? "font-bold text-ink" : "text-ink-faint"}`}
                      >
                        {preview}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <time
                      dateTime={inquiry.updated_at}
                      className="text-[11px] text-ink-faint"
                    >
                      {formatDate(inquiry.updated_at, locale)}
                    </time>
                    <span
                      className={`h-2 w-2 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`}
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))}
        basePath="/inquiries"
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
