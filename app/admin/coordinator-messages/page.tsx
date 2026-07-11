import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 30;

// Coordinator direct-message channel viewer (PRD 16.5 / 17.7): the only
// unmoderated channel is always readable by admins. Members never see any
// read indicator -- the terms carry the blanket disclosure instead.
export default async function CoordinatorMessagesAdminPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);

  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = await supabase
    .from("coordinator_messages")
    .select(
      `id, body, created_at, sender_id,
       coordinator:profiles!coordinator_messages_coordinator_id_fkey(uid, display_name, company_name),
       member:profiles!coordinator_messages_member_id_fkey(uid, display_name, company_name)`,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  type Party = { uid: number; display_name: string | null; company_name: string | null };
  const rows = (data ?? []) as unknown as {
    id: string;
    body: string;
    created_at: string;
    sender_id: string;
    coordinator: (Party & { id?: string }) | null;
    member: Party | null;
  }[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const nameOf = (p: Party | null) =>
    p ? `${p.company_name ?? p.display_name ?? ""} (UID ${p.uid})` : "";

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">{t.admin.coordinatorMessages}</h2>
      <p className="text-xs text-ink-soft">{t.admin.coordinatorMessagesHint}</p>

      {rows.length === 0 ? (
        <EmptyState title={t.common.emptyList} />
      ) : (
        <div className="space-y-2">
          {rows.map((message) => (
            <article
              key={message.id}
              className="rounded-card border border-line px-4 py-3"
            >
              <p className="text-xs font-semibold text-ink-soft">
                {nameOf(message.coordinator)}
                <span className="mx-1.5 text-ink-faint" aria-hidden="true">
                  {"<->"}
                </span>
                {nameOf(message.member)}
                <span className="ml-2 font-normal text-ink-faint">
                  {new Date(message.created_at)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}
                </span>
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">
                {message.body}
              </p>
            </article>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/admin/coordinator-messages"
        prevLabel={t.home.prev}
        nextLabel={t.home.next}
      />
    </div>
  );
}
