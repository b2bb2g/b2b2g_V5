import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/profile";
import { ClearableInput } from "@/components/ui/TextField";
import { EditFormFrame } from "@/components/ui/EditFormFrame";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

const labelCls = "text-xs font-semibold text-ink-soft";

// Edit sections mirror the view page's cards so members always know which
// block they are changing.
function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.35rem] border border-line bg-white p-5 shadow-(--shadow-card) sm:p-6">
      <h2 className="text-sm font-extrabold">{title}</h2>
      {hint && (
        <p className="mt-1 text-xs leading-5 text-ink-faint">{hint}</p>
      )}
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export default async function ProfileEditPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t }, params, supabase] = await Promise.all([
    getT(),
    props.searchParams,
    createClient(),
  ]);
  const { data: contact } = await supabase
    .from("profile_contacts")
    .select("email, phone, contact_person")
    .eq("profile_id", session.userId)
    .maybeSingle();

  return (
    <div className="space-y-5">
      <WorkspacePageHeader
        eyebrow={t.common.edit}
        title={t.profile.title}
        description={t.profile.overviewHint}
      />

      {params.error === "save" && (
        <p
          role="alert"
          className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative"
        >
          {t.common.error}
        </p>
      )}

      <EditFormFrame
        action={updateProfile}
        cancelHref="/dashboard/profile"
        saveLabel={t.common.save}
        cancelLabel={t.common.cancel}
        discardTitle={t.common.discardTitle}
        discardBody={t.common.discardBody}
        discardConfirm={t.common.discardConfirm}
        keepEditing={t.common.keepEditing}
        stickyActions
      >
        <SectionCard title={t.profile.profilePhoto}>
          <AvatarUploader
            userId={session.userId}
            name={
              session.profile.display_name ??
              session.profile.company_name ??
              `UID ${session.profile.uid}`
            }
            initialPath={session.profile.avatar_url}
            changeLabel={t.profile.changePhoto}
            removeLabel={t.profile.removePhoto}
          />
        </SectionCard>

        <SectionCard title={t.post.sectionBasics}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{t.profile.displayName}</span>
              <div className="mt-1">
                <ClearableInput
                  name="displayName"
                  autoComplete="name"
                  defaultValue={session.profile.display_name ?? ""}
                  clearLabel={t.common.clearInput}
                />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>{t.profile.companyName}</span>
              <div className="mt-1">
                <ClearableInput
                  name="companyName"
                  autoComplete="organization"
                  defaultValue={session.profile.company_name ?? ""}
                  clearLabel={t.common.clearInput}
                />
              </div>
            </label>
          </div>
        </SectionCard>

        <SectionCard title={t.profile.introduction} hint={t.profile.publicMemberHint}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{t.profile.bioEn}</span>
              <textarea
                name="bioEn"
                rows={5}
                defaultValue={session.profile.bio_en ?? session.profile.bio ?? ""}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="block">
              <span className={labelCls}>{t.profile.bioKo}</span>
              <textarea
                name="bioKo"
                rows={5}
                defaultValue={session.profile.bio_ko ?? ""}
                className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title={t.profile.contactInfo} hint={t.profile.contactHint}>
          <label className="block">
            <span className={labelCls}>{t.auth.email}</span>
            <input
              readOnly
              value={contact?.email ?? ""}
              className="mt-1 w-full rounded-xl border border-line bg-surface-sub/60 px-3 py-2.5 text-sm text-ink-faint"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>{t.profile.phone}</span>
              <div className="mt-1">
                <ClearableInput
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  defaultValue={contact?.phone ?? ""}
                  clearLabel={t.common.clearInput}
                />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>{t.profile.contactPerson}</span>
              <div className="mt-1">
                <ClearableInput
                  name="contactPerson"
                  defaultValue={contact?.contact_person ?? ""}
                  clearLabel={t.common.clearInput}
                />
              </div>
            </label>
          </div>
        </SectionCard>
      </EditFormFrame>
    </div>
  );
}
