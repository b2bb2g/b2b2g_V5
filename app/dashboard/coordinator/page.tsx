import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";

// Coordinator home (DESIGN C9): direct referrals only — grandchildren are
// never visible (PRD 16.4). Email access is the sanctioned RLS exception.
export default async function CoordinatorPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (!session.profile?.is_coordinator) redirect("/dashboard");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("profiles")
    .select("id, uid, display_name, company_name, created_at, profile_contacts(email)")
    .eq("referred_by", session.userId)
    .order("created_at", { ascending: false });

  const referrals = (data ?? []) as unknown as {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    created_at: string;
    profile_contacts: { email: string | null } | null;
  }[];

  return (
    <div className="space-y-4">
      <PageHeader title={t.coordinator.title} subtitle={t.coordinator.referralsTitle} />

      {referrals.length === 0 ? (
        <EmptyState title={t.coordinator.empty} />
      ) : (
        <div className="space-y-2">
          {referrals.map((member) => (
            <Link
              key={member.id}
              href={`/dashboard/coordinator/${member.id}`}
              className="block rounded-card border border-line p-4 hover:border-primary"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {member.display_name}
                    {member.company_name && (
                      <span className="ml-1 font-normal text-ink-soft">
                        · {member.company_name}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-ink-faint">
                    UID {member.uid} · {member.profile_contacts?.email}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-ink-faint">
                  {new Date(member.created_at).toISOString().slice(0, 10)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
