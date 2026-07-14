import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import type { Inquiry } from "@/lib/types";
import { Pagination } from "@/components/ui/Pagination";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 20;

// Ticket-style inquiry list (DESIGN C8): not a chat.
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

  return (
    <div className="space-y-5">
      <PageHeader title={t.inquiry.title} subtitle={t.inquiry.stepHint} />

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
              return (
                <Link
                  key={inquiry.id}
                  href={`/inquiries/${inquiry.id}`}
                  className="group flex items-center gap-3 p-4 transition hover:bg-surface-sub/45 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">
                        {outgoing ? t.inquiry.outbox : t.inquiry.inbox}
                      </span>
                      <StatusLabel
                        status={inquiry.status}
                        label={stepLabels[inquiry.status] ?? inquiry.status}
                      />
                    </div>
                    <p className="mt-1 truncate text-sm font-bold">
                      {inquiry.subject}
                    </p>
                  </div>
                  <time
                    dateTime={inquiry.updated_at}
                    className="hidden shrink-0 text-xs text-ink-faint sm:block"
                  >
                    {formatDate(inquiry.updated_at, locale)}
                  </time>
                  <span className="shrink-0 text-ink-faint transition group-hover:translate-x-1">
                    →
                  </span>
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
