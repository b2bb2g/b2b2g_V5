import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { BadgeList } from "@/components/ui/Badge";

// Profile VIEW (UX convention: read first, edit behind an explicit button).
export default async function ProfileViewPage(props: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t, locale }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);
  const { data: contact } = await supabase
    .from("profile_contacts")
    .select("email, phone, contact_person")
    .eq("profile_id", session.userId)
    .maybeSingle();

  const rows = [
    { label: t.auth.email, value: contact?.email },
    { label: t.profile.displayName, value: session.profile.display_name },
    { label: t.profile.companyName, value: session.profile.company_name },
    { label: t.profile.bio, value: session.profile.bio },
    { label: t.profile.phone, value: contact?.phone },
    { label: t.profile.contactPerson, value: contact?.contact_person },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">{t.profile.title}</h1>
        <Link
          href="/dashboard/profile/edit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-strong"
        >
          {t.common.edit}
        </Link>
      </div>

      {params.saved && (
        <p className="rounded-lg bg-positive-soft px-3 py-2 text-xs font-semibold text-positive">
          {t.profile.saved}
        </p>
      )}

      {session.badges.length > 0 && (
        <div>
          <BadgeList badges={session.badges} locale={locale} />
        </div>
      )}

      <dl className="divide-y divide-line rounded-card border border-line">
        {rows.map((row) => (
          <div key={row.label} className="px-4 py-3">
            <dt className="text-xs font-semibold text-ink-faint">{row.label}</dt>
            <dd
              className={`mt-0.5 whitespace-pre-wrap text-sm ${
                row.value ? "text-ink" : "text-ink-faint"
              }`}
            >
              {row.value || t.common.notProvided}
            </dd>
          </div>
        ))}
      </dl>

      <p className="text-xs leading-relaxed text-ink-faint">
        {t.profile.contactHint}
      </p>
    </div>
  );
}
