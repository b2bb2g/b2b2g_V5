import { saveStaffAssignment, toggleStaffAssignment } from "@/app/actions/admin/operations";
import { PendingButton } from "@/components/ui/PendingButton";
import { requireAdmin, type AdminPermission } from "@/app/actions/admin/core";
import { getT } from "@/lib/i18n/server";

const permissions: AdminPermission[] = [
  "overview", "review", "members", "subscriptions", "catalog", "content",
  "notifications", "security", "settings", "audit",
];

export default async function AdminTeamPage(props: {
  searchParams: Promise<{ toast?: string; error?: string }>;
}) {
  const [{ t }, { supabase, isOwner }, params] = await Promise.all([
    getT(),
    requireAdmin("team"),
    props.searchParams,
  ]);
  const { data } = await supabase
    .from("admin_staff_assignments")
    .select("profile_id, role, permissions, is_active, updated_at, profiles(uid, display_name, company_name)")
    .order("updated_at", { ascending: false });
  const staff = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t.admin.operations}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t.admin.teamAccess}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-faint">{t.admin.teamAccessHint}</p>
      </header>

      {params.toast && <p className="rounded-xl bg-positive-soft px-4 py-3 text-sm font-semibold text-positive">{t.admin.staffSaved}</p>}
      {params.error && <p className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">{params.error === "owner_required" ? t.admin.ownerOnly : t.common.error}</p>}

      <form action={saveStaffAssignment} className="card space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-bold">{t.admin.staffUid}<input name="uid" type="number" required min="100000" max="999999" className="field" placeholder="100027" /></label>
          <label className="space-y-1.5 text-sm font-bold">{t.admin.staffRole}<select name="role" className="field"><option value="manager">{t.admin.staffRoles.manager}</option><option value="reviewer">{t.admin.staffRoles.reviewer}</option><option value="support">{t.admin.staffRoles.support}</option><option value="content">{t.admin.staffRoles.content}</option></select></label>
        </div>
        <fieldset>
          <legend className="text-sm font-bold">{t.admin.staffPermissions}</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {permissions.map((permission) => <label key={permission} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm"><input type="checkbox" name="permissions" value={permission} className="size-4 accent-primary" /><span>{t.admin.permissionLabels[permission]}</span></label>)}
          </div>
        </fieldset>
        <p className="text-xs text-ink-faint">{t.admin.ownerOnly}</p>
        <PendingButton disabled={!isOwner} className="btn-primary btn-md">{t.admin.staffAdd}</PendingButton>
      </form>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.teamAccess}</h3></div>
        {staff.length ? <div className="divide-y divide-line">{staff.map((row) => {
          const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
          return <article key={row.profile_id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div><p className="font-extrabold">UID:{profile?.uid} <span className="font-medium text-ink-faint">· {profile?.company_name ?? profile?.display_name ?? "—"}</span></p><p className="mt-1 text-xs text-ink-faint">{t.admin.staffRoles[row.role as keyof typeof t.admin.staffRoles]} · {(row.permissions as AdminPermission[]).map((permission) => t.admin.permissionLabels[permission]).join(", ")}</p></div>
            <form action={toggleStaffAssignment}><input type="hidden" name="profileId" value={row.profile_id} /><input type="hidden" name="isActive" value={(!row.is_active).toString()} /><PendingButton disabled={!isOwner} className={`rounded-full px-3 py-1.5 text-xs font-bold ${row.is_active ? "bg-positive-soft text-positive" : "bg-surface-sub text-ink-faint"}`}>{row.is_active ? t.admin.staffActive : t.admin.staffDisabled}</PendingButton></form>
          </article>;
        })}</div> : <p className="px-5 py-10 text-center text-sm text-ink-faint">{t.admin.staffEmpty}</p>}
      </section>
    </div>
  );
}
