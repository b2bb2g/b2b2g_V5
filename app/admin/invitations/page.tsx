import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { revokeReferralInvitation } from "@/app/actions/invitations";
import { PendingButton } from "@/components/ui/PendingButton";

export default async function AdminInvitationsPage() {
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: invitations } = await supabase
    .from("referral_invitations")
    .select("id, inviter_id, status, expires_at, created_at, used_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const profileIds = [...new Set((invitations ?? []).map((item) => item.inviter_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, uid").in("id", profileIds)
    : { data: [] as Array<{ id: string; uid: number }> };
  const uidMap = new Map((profiles ?? []).map((profile) => [profile.id, profile.uid]));
  const format = (value: string) => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-xl font-extrabold">{t.admin.invitations}</h2>
        <p className="mt-1 text-sm text-ink-soft">{t.admin.invitationsHint}</p>
      </header>
      <div className="overflow-hidden rounded-[1.25rem] border border-line bg-white shadow-(--shadow-card)">
        {(invitations ?? []).length === 0 ? (
          <p className="p-6 text-sm text-ink-faint">{t.admin.noInvitations}</p>
        ) : (
          <ul className="divide-y divide-line">
            {(invitations ?? []).map((invitation) => (
              <li key={invitation.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="text-sm font-extrabold">UID:{uidMap.get(invitation.inviter_id) ?? "—"}</p>
                  <p className="mt-1 text-xs text-ink-faint">{t.admin.created}: {format(invitation.created_at)} · {t.admin.expires}: {format(invitation.expires_at)}</p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${invitation.status === "active" ? "bg-positive-soft text-positive" : invitation.status === "reserved" ? "bg-warning-soft text-warning" : "bg-surface-sub text-ink-faint"}`}>
                  {t.admin.invitationStatus[invitation.status as keyof typeof t.admin.invitationStatus] ?? invitation.status}
                </span>
                {["active", "reserved"].includes(invitation.status) && (
                  <form action={revokeReferralInvitation}>
                    <input type="hidden" name="invitationId" value={invitation.id} />
                    <PendingButton className="rounded-lg px-3 py-2 text-xs font-bold text-negative hover:bg-negative-soft">{t.dashboard.revokeInvitation}</PendingButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
