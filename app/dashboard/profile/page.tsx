import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { BadgeList } from "@/components/ui/Badge";
import { CopyChip } from "@/components/ui/CopyChip";
import { postMediaUrl } from "@/lib/media";

// Profile VIEW: avatar + UID identity card first, details below, edit behind
// an explicit button (UX convention).
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

  const profile = session.profile;
  const name = profile.display_name ?? profile.company_name ?? `UID ${profile.uid}`;

  const rows = [
    { label: t.profile.companyName, value: profile.company_name },
    { label: t.profile.bio, value: profile.bio },
    { label: t.auth.email, value: contact?.email },
    { label: t.profile.phone, value: contact?.phone },
    { label: t.profile.contactPerson, value: contact?.contact_person },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {params.saved && (
        <p className="rounded-lg bg-positive-soft px-3 py-2 text-xs font-semibold text-positive">
          {t.profile.saved}
        </p>
      )}

      {/* Identity card: avatar, name, copyable UID, badges */}
      <div className="card flex items-center gap-4 p-5">
        {profile.avatar_url ? (
          <Image
            src={postMediaUrl(profile.avatar_url)}
            alt={name}
            width={72}
            height={72}
            className="h-18 w-18 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-extrabold text-primary-strong">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold">{name}</p>
          <CopyChip
            value={String(profile.uid)}
            display={`${t.profile.memberId} ${profile.uid}`}
            copyLabel={t.common.copy}
            copiedLabel={t.common.copied}
          />
          {session.badges.length > 0 && (
            <div className="mt-1.5">
              <BadgeList badges={session.badges} locale={locale} />
            </div>
          )}
        </div>
        <Link
          href="/dashboard/profile/edit"
          className="btn-primary btn-sm shrink-0"
        >
          {t.common.edit}
        </Link>
      </div>

      <dl className="card divide-y divide-line">
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
