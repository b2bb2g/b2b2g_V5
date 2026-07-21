import Link from "next/link";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/format";

// Coordinator home (DESIGN C9): direct referrals only — grandchildren are
// never visible (PRD 16.4). Email access is the sanctioned RLS exception.
export default async function CoordinatorPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (!session.profile?.is_coordinator) redirect("/dashboard");

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  // referred_by is no longer directly filterable by authenticated (column
  // lockdown); the definer RPC returns this coordinator's own direct referrals
  // with the sanctioned email inline, scoped to referred_by = auth.uid().
  const { data } = await supabase.rpc("get_my_referred_members");

  const referrals = (data ?? []) as unknown as {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    created_at: string;
    email: string | null;
  }[];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t.coordinator.title}
        subtitle={t.coordinator.referralsTitle}
      />

      {referrals.length === 0 ? (
        <EmptyState title={t.coordinator.empty} />
      ) : (
        <div className="overflow-hidden rounded-[1.5rem] border border-line/70 bg-white shadow-(--shadow-card)">
          <div className="divide-y divide-line">
            {referrals.map((member) => (
              <Link
                key={member.id}
                href={`/dashboard/coordinator/${member.id}`}
                className="group flex items-center gap-3 p-4 transition hover:bg-surface-sub/45 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {member.display_name}
                    {member.company_name && (
                      <span className="ml-1 font-normal text-ink-soft">
                        · {member.company_name}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-faint">
                    UID {member.uid} · {member.email}
                  </p>
                </div>
                <time
                  dateTime={member.created_at}
                  className="hidden shrink-0 text-xs text-ink-faint sm:block"
                >
                  {formatDate(member.created_at, locale)}
                </time>
                <span className="shrink-0 text-ink-faint transition group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
