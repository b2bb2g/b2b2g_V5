import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { InvitationManager } from "@/components/dashboard/InvitationManager";

// Dedicated page for referral-invitation management. Moved out of the dashboard
// body so a long history (tabs + pagination) no longer stretches the overview.
export default async function InvitationsPage() {
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const [activeInvitations, invitationHistory] = await Promise.all([
    // Owner-scoped reader: raw token (active/reserved only, for re-copy), the
    // recipient memo and the accepted member's UID.
    supabase.rpc("get_my_referral_invitations"),
    // First page of the paginated history (joined / expired / revoked).
    supabase.rpc("get_my_referral_invitation_history", {
      p_limit: 6,
      p_offset: 0,
    }),
  ]);

  return (
    <div className="min-w-0">
      <InvitationManager
        locale={locale}
        invitations={(
          (activeInvitations.data ?? []) as Array<{
            id: string;
            label: string | null;
            status: string;
            token: string | null;
            expires_at: string;
            expires_in_days: number;
            created_at: string;
            used_at: string | null;
            used_uid: number | null;
          }>
        )
          .filter((row) => row.status === "active" || row.status === "reserved")
          .map((row) => ({
            id: row.id,
            label: row.label,
            status: row.status,
            // Token is present only for active/reserved links; build the
            // shareable short link so the raw token stays server-derived.
            link: row.token
              ? `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/i/${row.token}`
              : null,
            expiresAt: row.expires_at,
            // Computed in the RPC (SQL now()) so the relative "expires in N
            // days" needs no client clock and can't drift on hydration.
            expiresInDays: row.expires_in_days,
            createdAt: row.created_at,
            usedAt: row.used_at,
            usedUid: row.used_uid,
          }))}
        historyInitial={(
          (invitationHistory.data ?? []) as Array<{
            id: string;
            label: string | null;
            status: string;
            expires_at: string;
            created_at: string;
            used_at: string | null;
            used_uid: number | null;
          }>
        ).map((row) => ({
          id: row.id,
          label: row.label,
          status: row.status,
          link: null,
          expiresAt: row.expires_at,
          expiresInDays: 0,
          createdAt: row.created_at,
          usedAt: row.used_at,
          usedUid: row.used_uid,
        }))}
        historyTotal={Number(
          (invitationHistory.data?.[0] as { total_count?: number } | undefined)
            ?.total_count ?? 0,
        )}
        labels={{
          eyebrow: t.dashboard.growthTools,
          title: t.dashboard.referralLink,
          description: t.dashboard.referralHint,
          infoLabel: t.dashboard.referralInfoLabel,
          infoOneUse: t.dashboard.referralInfoOneUse,
          infoExpires: t.dashboard.referralInfoExpires,
          infoRecopy: t.dashboard.referralInfoRecopy,
          recipient: t.dashboard.invitationRecipient,
          recipientPlaceholder: t.dashboard.invitationRecipientPlaceholder,
          recipientHint: t.dashboard.invitationRecipientHint,
          create: t.dashboard.createInvitation,
          generated: t.dashboard.invitationGenerated,
          copy: t.common.copy,
          copied: t.common.copied,
          share: t.dashboard.invitationShare,
          shareTitle: t.dashboard.invitationShareTitle,
          qr: t.dashboard.qr,
          edit: t.common.edit,
          save: t.common.save,
          cancel: t.common.cancel,
          expiresInDays: t.dashboard.invitationExpiresInDays,
          expiresToday: t.dashboard.invitationExpiresToday,
          expiresTomorrow: t.dashboard.invitationExpiresTomorrow,
          noLabel: t.dashboard.invitationNoLabel,
          statusWaiting: t.dashboard.invitationStatusWaiting,
          statusSigningUp: t.dashboard.invitationStatusSigningUp,
          statusJoined: t.dashboard.invitationStatusJoined,
          statusExpired: t.dashboard.invitationStatusExpired,
          statusRevoked: t.dashboard.invitationStatusRevoked,
          revoke: t.dashboard.revokeInvitation,
          revokeConfirmTitle: t.dashboard.invitationRevokeConfirmTitle,
          revokeConfirmBody: t.dashboard.invitationRevokeConfirmBody,
          revokeConfirmYes: t.dashboard.invitationRevokeConfirmYes,
          empty: t.dashboard.noActiveInvitations,
          tabActive: t.dashboard.invitationTabActive,
          tabHistory: t.dashboard.invitationTabHistory,
          historyEmpty: t.dashboard.invitationHistoryEmpty,
          historyPrev: t.dashboard.invitationHistoryPrev,
          historyNext: t.dashboard.invitationHistoryNext,
          activeLimit: t.dashboard.invitationLimitReached,
          error: t.dashboard.invitationCreateFailed,
        }}
      />
    </div>
  );
}
