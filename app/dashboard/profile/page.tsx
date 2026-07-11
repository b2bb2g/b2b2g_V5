import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { BadgeList } from "@/components/ui/Badge";
import { CopyChip } from "@/components/ui/CopyChip";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { postMediaUrl } from "@/lib/media";
import { withdrawSelf } from "@/app/actions/profile";

export default async function ProfileViewPage() {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: contact } = await supabase
    .from("profile_contacts")
    .select("email, phone, contact_person")
    .eq("profile_id", session.userId)
    .maybeSingle();

  const profile = session.profile;
  const bio =
    locale === "ko"
      ? profile.bio_ko || profile.bio || profile.bio_en
      : profile.bio_en || profile.bio || profile.bio_ko;
  const checklist = [
    { label: t.profile.profilePhoto, complete: !!profile.avatar_url },
    { label: t.profile.introduction, complete: !!bio },
    { label: t.profile.companyInfo, complete: !!profile.company_name },
    {
      label: t.profile.contactInfo,
      complete: !!(contact?.email || contact?.phone || contact?.contact_person),
    },
  ];
  const completion = Math.round(
    (checklist.filter((item) => item.complete).length / checklist.length) * 100,
  );
  const rows = [
    { label: t.profile.companyName, value: profile.company_name, span: false },
    { label: t.auth.email, value: contact?.email, span: false },
    { label: t.profile.phone, value: contact?.phone, span: false },
    {
      label: t.profile.contactPerson,
      value: contact?.contact_person,
      span: false,
    },
    {
      label: locale === "ko" ? t.profile.bioKo : t.profile.bioEn,
      value: bio,
      span: true,
    },
  ];

  return (
    <div className="space-y-4">
      <WorkspacePageHeader
        eyebrow={t.dashboard.commandCenter}
        title={t.profile.title}
        description={t.profile.overviewHint}
        action={
          <Link href="/dashboard/profile/edit" className="btn-primary btn-md">
            {t.common.edit}
          </Link>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-[1.35rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6">
          <div className="flex items-start gap-4">
            {profile.avatar_url ? (
              <Image
                src={postMediaUrl(profile.avatar_url)}
                alt=""
                width={78}
                height={78}
                className="h-20 w-20 shrink-0 rounded-full border border-line object-cover"
              />
            ) : (
              <DefaultAvatar className="h-20 w-20" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[.15em] text-primary">
                {t.profile.publicMember}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-extrabold tracking-[-.035em]">
                  UID:{profile.uid}
                </h2>
                <CopyChip
                  value={String(profile.uid)}
                  display=""
                  copyLabel={t.common.copy}
                  copiedLabel={t.common.copied}
                />
              </div>
              {session.badges.length > 0 && (
                <div className="mt-2">
                  <BadgeList badges={session.badges} locale={locale} />
                </div>
              )}
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink-soft">
                {bio || t.profile.publicMemberHint}
              </p>
              <Link
                href={`/u/${profile.uid}`}
                className="mt-4 inline-flex items-center text-sm font-bold text-primary"
              >
                {t.profile.publicPreview} →
              </Link>
            </div>
          </div>
        </div>

        <aside className="rounded-[1.35rem] border border-line bg-white p-5 shadow-(--shadow-card)">
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-sm font-extrabold">
              {t.profile.completionChecklist}
            </h2>
            <strong className="text-2xl font-extrabold">{completion}%</strong>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sub">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${completion}%` }}
            />
          </div>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-semibold text-ink-soft">
                  {item.label}
                </span>
                <span
                  className={item.complete ? "text-positive" : "text-caution"}
                >
                  {item.complete
                    ? `✓ ${t.profile.complete}`
                    : t.profile.missing}
                </span>
              </li>
            ))}
          </ul>
          {completion < 100 && (
            <Link
              href="/dashboard/profile/edit"
              className="btn-secondary btn-sm mt-5 w-full"
            >
              {t.dashboard.completeProfile}
            </Link>
          )}
        </aside>
      </section>

      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`rounded-[1.15rem] border border-line bg-white px-4 py-3.5 shadow-[0_6px_20px_rgba(25,31,40,.035)] ${row.span ? "sm:col-span-2" : ""}`}
          >
            <dt className="text-xs font-semibold text-ink-faint">
              {row.label}
            </dt>
            <dd
              className={`mt-1 whitespace-pre-wrap text-sm leading-6 ${row.value ? "text-ink" : "text-ink-faint"}`}
            >
              {row.value || t.common.notProvided}
            </dd>
          </div>
        ))}
      </dl>

      <p className="rounded-xl bg-primary-soft/55 px-4 py-3 text-xs leading-5 text-ink-soft">
        {t.profile.contactHint}
      </p>

      <details className="rounded-[1.15rem] border border-negative/15 bg-white">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-bold text-ink-soft">
          {t.profile.dangerZone}
          <span className="text-ink-faint">＋</span>
        </summary>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-negative/10 px-4 py-4">
          <div>
            <p className="text-sm font-bold text-negative">
              {t.profile.withdrawTitle}
            </p>
            <p className="mt-1 max-w-xl text-xs leading-5 text-ink-faint">
              {t.profile.withdrawBody}
            </p>
          </div>
          <form action={withdrawSelf}>
            <ConfirmSubmit
              label={t.profile.withdrawAction}
              confirmTitle={t.common.confirmTitle}
              confirmBody={t.profile.withdrawBody}
              confirmLabel={t.profile.withdrawAction}
              cancelLabel={t.common.cancel}
              className="btn-danger btn-md"
              destructive
            />
          </form>
        </div>
      </details>
    </div>
  );
}
