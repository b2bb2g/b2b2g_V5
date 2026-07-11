import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { BadgePill } from "@/components/ui/Badge";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import {
  adminSendPasswordReset,
  saveMemberMemo,
  setMemberStatus,
  withdrawMember,
} from "@/app/actions/admin";
import { MEMBER_STATUS } from "@/lib/constants";

// Admin member detail (D3): full picture of one member in one place.
export default async function AdminMemberDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);

  const { data: profileRow } = await supabase
    .from("profiles")
    .select(
      "*, profile_contacts(email, phone, contact_person), member_admin_memos(memo)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!profileRow) notFound();
  const member = profileRow as unknown as {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    bio: string | null;
    status: string;
    suspend_reason: string | null;
    is_coordinator: boolean;
    referred_by: string | null;
    last_seen_at: string | null;
    created_at: string;
    profile_contacts: { email: string | null; phone: string | null; contact_person: string | null } | null;
    member_admin_memos: { memo: string } | null;
  };

  const [
    { data: badges },
    { data: subscriptions },
    { data: posts },
    { data: logins },
    referrer,
    { data: homepage },
    { count: sentCount },
    { count: receivedCount },
    { count: rejectedPostCount },
    { data: rejectedPosts },
    { count: rejectedMsgCount },
  ] = await Promise.all([
      supabase
        .from("member_badges")
        .select("badge_type_id, badge_types(*)")
        .eq("profile_id", id),
      supabase
        .from("subscriptions")
        .select("id, status, starts_at, expires_at, deposit_note")
        .eq("profile_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("posts")
        .select("id, title_en, status, updated_at")
        .eq("author_id", id)
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("login_events")
        .select("id, user_agent, created_at")
        .eq("profile_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
      member.referred_by
        ? supabase
            .from("profiles")
            .select("id, uid, display_name")
            .eq("id", member.referred_by)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("mini_homepages")
        .select("slug, is_published")
        .eq("profile_id", id)
        .maybeSingle(),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", id),
      supabase
        .from("inquiries")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", id),
      supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", id)
        .eq("status", "rejected"),
      supabase
        .from("posts")
        .select("id, title_en, reject_reason, updated_at")
        .eq("author_id", id)
        .eq("status", "rejected")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("inquiry_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_id", id)
        .eq("review_status", "rejected"),
    ]);

  const statusLabels: Record<string, string> = t.admin.memberStatus;
  const postStatusLabels: Record<string, string> = t.post.status;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">
            {member.display_name}
            {member.company_name && (
              <span className="ml-2 text-sm font-semibold text-ink-soft">
                {member.company_name}
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-xs text-ink-faint">
            {t.admin.uid} {member.uid} · {t.admin.joined}{" "}
            {new Date(member.created_at).toISOString().slice(0, 10)}
          </p>
        </div>
        <StatusLabel
          status={member.status}
          label={statusLabels[member.status] ?? member.status}
        />
      </header>

      <div className="flex flex-wrap gap-1.5">
        {(badges ?? []).map((b) => {
          const badgeType = (b as unknown as { badge_types: { code: string; name_en: string; name_ko: string } | null }).badge_types;
          return (
            badgeType && (
              <BadgePill
                key={badgeType.code}
                code={badgeType.code}
                label={locale === "ko" ? badgeType.name_ko : badgeType.name_en}
              />
            )
          );
        })}
        {member.is_coordinator && (
          <BadgePill code="coordinator" label={t.badges.coordinator} />
        )}
      </div>

      <dl className="card divide-y divide-line">
        <div className="px-4 py-3">
          <dt className="text-xs font-semibold text-ink-faint">{t.admin.email}</dt>
          <dd className="mt-0.5 text-sm">{member.profile_contacts?.email ?? "-"}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs font-semibold text-ink-faint">{t.admin.phone}</dt>
          <dd className="mt-0.5 text-sm">
            {member.profile_contacts?.phone ?? t.common.notProvided}
            {member.profile_contacts?.contact_person &&
              ` · ${member.profile_contacts.contact_person}`}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs font-semibold text-ink-faint">{t.admin.lastSeen}</dt>
          <dd className="mt-0.5 text-sm">
            {member.last_seen_at
              ? new Date(member.last_seen_at).toISOString().slice(0, 16).replace("T", " ")
              : "-"}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-xs font-semibold text-ink-faint">{t.admin.referrer}</dt>
          <dd className="mt-0.5 text-sm">
            {referrer.data ? (
              <Link
                href={`/admin/members/${referrer.data.id}`}
                className="font-semibold text-primary-strong"
              >
                {referrer.data.display_name} ({t.admin.uid} {referrer.data.uid})
              </Link>
            ) : (
              "-"
            )}
          </dd>
        </div>
        {member.suspend_reason && (
          <div className="px-4 py-3">
            <dt className="text-xs font-semibold text-ink-faint">
              {t.admin.suspendReason}
            </dt>
            <dd className="mt-0.5 text-sm text-negative">{member.suspend_reason}</dd>
          </div>
        )}
      </dl>

      {/* Activity + moderation history (PRD 17.2): counts for sanction calls */}
      <section className="card divide-y divide-line">
        <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
          <div>
            <p className="text-xs font-semibold text-ink-faint">{t.admin.inquiriesSent}</p>
            <p className="mt-0.5 text-sm font-bold">{sentCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-faint">{t.admin.inquiriesReceived}</p>
            <p className="mt-0.5 text-sm font-bold">{receivedCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-faint">{t.admin.rejectedPosts}</p>
            <p className="mt-0.5 text-sm font-bold">{rejectedPostCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-ink-faint">{t.admin.rejectedMessages}</p>
            <p className="mt-0.5 text-sm font-bold">{rejectedMsgCount ?? 0}</p>
          </div>
        </div>
        {(rejectedPosts ?? []).length > 0 && (
          <div className="space-y-1.5 px-4 py-3">
            <p className="text-xs font-semibold text-ink-faint">{t.admin.rejectionHistory}</p>
            {(rejectedPosts ?? []).map((post) => (
              <p key={post.id} className="text-xs text-ink-soft">
                <span className="font-semibold">{post.title_en}</span>
                {post.reject_reason && ` — ${post.reject_reason}`}
              </p>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
          <p className="text-xs font-semibold text-ink-faint">{t.admin.miniHomepage}</p>
          {homepage ? (
            <span className="flex items-center gap-2 text-xs">
              <Link
                href={`/c/${homepage.slug}`}
                className="font-semibold text-primary-strong"
              >
                /c/{homepage.slug}
              </Link>
              <StatusLabel
                status={homepage.is_published ? "approved" : "draft"}
                label={homepage.is_published ? t.homepage.published : t.post.status.draft}
              />
              <Link
                href={`/admin/members/${member.id}/homepage`}
                className="font-semibold text-primary-strong underline underline-offset-2"
              >
                {t.common.edit}
              </Link>
            </span>
          ) : (
            <span className="text-xs text-ink-faint">-</span>
          )}
        </div>
      </section>

      {/* Admin memo (admin-only table, PRD 17.2) */}
      <form action={saveMemberMemo} className="card space-y-2 p-4">
        <p className="text-sm font-bold">
          {t.admin.memo}
          <span className="ml-2 text-xs font-normal text-ink-faint">
            {t.admin.memoHint}
          </span>
        </p>
        <input type="hidden" name="profileId" value={member.id} />
        <textarea
          name="memo"
          rows={3}
          defaultValue={member.member_admin_memos?.memo ?? ""}
          className="field"
        />
        <button type="submit" className="btn-secondary btn-sm">
          {t.common.save}
        </button>
      </form>

      {/* Account actions: reset mail, withdrawal (both audited) */}
      <div className="flex flex-wrap gap-2">
        <form action={adminSendPasswordReset}>
          <input type="hidden" name="profileId" value={member.id} />
          <ConfirmSubmit
            label={t.admin.resetPasswordMail}
            confirmTitle={t.common.confirmTitle}
            confirmBody={t.common.doubleConfirm}
            confirmLabel={t.common.confirm}
            cancelLabel={t.common.cancel}
            className="btn-secondary btn-md"
          />
        </form>
        {member.status !== MEMBER_STATUS.WITHDRAWN && (
          <form action={withdrawMember}>
            <input type="hidden" name="profileId" value={member.id} />
            <ConfirmSubmit
              label={t.admin.withdrawMember}
              confirmTitle={t.common.confirmTitle}
              confirmBody={t.profile.withdrawBody}
              confirmLabel={t.admin.withdrawMember}
              cancelLabel={t.common.cancel}
              className="btn-danger btn-md"
              destructive
            />
          </form>
        )}
      </div>

      {/* Status actions with double confirmation */}
      <form action={setMemberStatus} className="card space-y-2 p-4">
        <input type="hidden" name="profileId" value={member.id} />
        {member.status === MEMBER_STATUS.ACTIVE ? (
          <>
            <input
              name="reason"
              placeholder={t.admin.suspendReason}
              className="field"
            />
            <input type="hidden" name="status" value={MEMBER_STATUS.SUSPENDED} />
            <ConfirmSubmit
              label={t.admin.suspend}
              confirmTitle={t.common.confirmTitle}
              confirmBody={t.common.doubleConfirm}
              confirmLabel={t.admin.suspend}
              cancelLabel={t.common.cancel}
              className="btn-danger btn-md w-full"
              destructive
            />
          </>
        ) : (
          <>
            <input type="hidden" name="status" value={MEMBER_STATUS.ACTIVE} />
            <ConfirmSubmit
              label={t.admin.activate}
              confirmTitle={t.common.confirmTitle}
              confirmBody={t.common.doubleConfirm}
              confirmLabel={t.admin.activate}
              cancelLabel={t.common.cancel}
              className="btn-primary btn-md w-full"
            />
          </>
        )}
      </form>

      {/* Subscriptions */}
      {(subscriptions ?? []).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold">{t.admin.subscriptions}</h3>
          {(subscriptions ?? []).map((sub) => (
            <div
              key={sub.id}
              className="card flex items-center justify-between px-4 py-3 text-xs"
            >
              <span className="text-ink-soft">
                {new Date(sub.starts_at).toISOString().slice(0, 10)} ~{" "}
                {new Date(sub.expires_at).toISOString().slice(0, 10)}
                {sub.deposit_note && ` · ${sub.deposit_note}`}
              </span>
              <StatusLabel status={sub.status} label={sub.status} />
            </div>
          ))}
        </section>
      )}

      {/* Login history (PRD 17.2) */}
      {(logins ?? []).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold">{t.admin.loginHistory}</h3>
          {(logins ?? []).map((event) => (
            <div
              key={event.id}
              className="card flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
            >
              <span className="text-ink-soft">
                {new Date(event.created_at).toISOString().slice(0, 16).replace("T", " ")}
              </span>
              <span className="max-w-[60%] truncate text-ink-faint">
                {event.user_agent ?? "-"}
              </span>
            </div>
          ))}
        </section>
      )}

      {/* Recent posts */}
      {(posts ?? []).length > 0 && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold">{t.dashboard.myPostsSummary}</h3>
          {(posts ?? []).map((post) => (
            <div
              key={post.id}
              className="card flex items-center justify-between gap-3 px-4 py-3"
            >
              <p className="truncate text-sm">{post.title_en}</p>
              <StatusLabel
                status={post.status}
                label={postStatusLabels[post.status] ?? post.status}
              />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
