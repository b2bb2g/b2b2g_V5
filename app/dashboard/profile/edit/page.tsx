import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "@/app/actions/profile";
import { ClearableInput } from "@/components/ui/TextField";
import { EditFormFrame } from "@/components/ui/EditFormFrame";

export default async function ProfileEditPage() {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: contact } = await supabase
    .from("profile_contacts")
    .select("email, phone, contact_person")
    .eq("profile_id", session.userId)
    .maybeSingle();

  const labelCls = "text-xs font-semibold text-ink-soft";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-extrabold">
        {t.profile.title}
        <span className="ml-2 text-sm font-semibold text-ink-faint">
          {t.common.edit}
        </span>
      </h1>

      <EditFormFrame
        action={updateProfile}
        cancelHref="/dashboard/profile"
        saveLabel={t.common.save}
        cancelLabel={t.common.cancel}
        discardTitle={t.common.discardTitle}
        discardBody={t.common.discardBody}
        discardConfirm={t.common.discardConfirm}
        keepEditing={t.common.keepEditing}
      >
        <label className="block">
          <span className={labelCls}>{t.auth.email}</span>
          <input
            readOnly
            value={contact?.email ?? ""}
            className="mt-1 w-full rounded-xl border border-line bg-surface-sub/60 px-3 py-2.5 text-sm text-ink-faint"
          />
        </label>
        <label className="block">
          <span className={labelCls}>{t.profile.displayName}</span>
          <div className="mt-1">
            <ClearableInput
              name="displayName"
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
              defaultValue={session.profile.company_name ?? ""}
              clearLabel={t.common.clearInput}
            />
          </div>
        </label>
        <label className="block">
          <span className={labelCls}>{t.profile.bio}</span>
          <textarea
            name="bio"
            rows={4}
            defaultValue={session.profile.bio ?? ""}
            className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>

        <p className="rounded-lg bg-surface-sub/60 px-3 py-2 text-xs leading-relaxed text-ink-faint">
          {t.profile.contactHint}
        </p>
        <label className="block">
          <span className={labelCls}>{t.profile.phone}</span>
          <div className="mt-1">
            <ClearableInput
              name="phone"
              type="tel"
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
      </EditFormFrame>
    </div>
  );
}
