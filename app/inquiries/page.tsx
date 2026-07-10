import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Inquiry } from "@/lib/types";

// Ticket-style inquiry list (DESIGN C8): not a chat.
export default async function InquiriesPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("inquiries")
    .select("*")
    .or(`sender_id.eq.${session.userId},recipient_id.eq.${session.userId}`)
    .order("updated_at", { ascending: false });

  const inquiries = (data ?? []) as Inquiry[];
  const stepLabels: Record<string, string> = t.inquiry.steps;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">{t.inquiry.title}</h1>
      <p className="text-xs text-ink-faint">{t.inquiry.stepHint}</p>

      {inquiries.length === 0 ? (
        <EmptyState title={t.inquiry.noInquiries} hint={t.common.emptyListHint} />
      ) : (
        <div className="space-y-2.5">
          {inquiries.map((inquiry) => {
            const outgoing = inquiry.sender_id === session.userId;
            return (
              <Link
                key={inquiry.id}
                href={`/inquiries/${inquiry.id}`}
                className="block rounded-card border border-line p-4 hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-faint">
                      {outgoing ? t.inquiry.outbox : t.inquiry.inbox}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-bold">
                      {inquiry.subject}
                    </p>
                  </div>
                  <StatusLabel
                    status={inquiry.status}
                    label={stepLabels[inquiry.status] ?? inquiry.status}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-faint">
                  {new Date(inquiry.updated_at).toISOString().slice(0, 10)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
