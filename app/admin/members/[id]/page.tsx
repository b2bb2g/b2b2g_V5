import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { StatusLabel } from "@/components/ui/StatusLabel";
import { BadgePill } from "@/components/ui/Badge";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { PendingButton } from "@/components/ui/PendingButton";
import {
  adminSendPasswordReset,
  saveMemberMemo,
  setCoordinatorMessageOverride,
  setCoordinatorRole,
  setMemberStatus,
  withdrawMember,
} from "@/app/actions/admin";
import { requireAdmin } from "@/app/actions/admin/core";
import { MEMBER_STATUS, STORAGE_BUCKETS } from "@/lib/constants";

// Admin member detail (D3): full picture of one member in one place.
export default async function AdminMemberDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; toast?: string }>;
}) {
  const [{ id }, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const [{ t, locale }, access] = await Promise.all([
    getT(),
    requireAdmin("members"),
  ]);
  const { supabase, isOwner, permissions } = access;
  const canReviewBadges = isOwner || permissions.includes("review");

  // referred_by is no longer directly selectable by authenticated (column
  // lockdown); a members-admin reads the full row (incl. referred_by) via the
  // definer RPC, and the contact/memo/private rows come from their own tables.
  const { data: profileRow } = await supabase
    .rpc("get_profile_full", { p_id: id })
    .maybeSingle();
  if (!profileRow) notFound();
  const [{ data: memberPrivate }, { data: contact }, { data: memo }] =
    await Promise.all([
      // Sensitive columns live in the owner/admin-only profile_private table.
      supabase
        .from("profile_private")
        .select("suspend_reason, coordinator_msg_override, last_seen_at")
        .eq("profile_id", id)
        .maybeSingle<{
          suspend_reason: string | null;
          coordinator_msg_override: "allow" | "deny" | null;
          last_seen_at: string | null;
        }>(),
      supabase
        .from("profile_contacts")
        .select("email, phone, contact_person")
        .eq("profile_id", id)
        .maybeSingle<{
          email: string | null;
          phone: string | null;
          contact_person: string | null;
        }>(),
      supabase
        .from("member_admin_memos")
        .select("memo")
        .eq("profile_id", id)
        .maybeSingle<{ memo: string }>(),
    ]);
  const member = {
    ...(profileRow as unknown as {
      id: string;
      uid: number;
      display_name: string | null;
      company_name: string | null;
      bio: string | null;
      status: string;
      is_coordinator: boolean;
      referred_by: string | null;
      created_at: string;
    }),
    profile_contacts: contact ?? null,
    member_admin_memos: memo ?? null,
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
    { data: badgeApplications },
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
      canReviewBadges
        ? supabase
            .from("badge_applications")
            .select(
              "id, status, document_paths, created_at, badge_types(name_en, name_ko)"
            )
            .eq("profile_id", id)
            .order("created_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

  // Chronological activity feed: the per-category sections answer "what",
  // this answers "when" across all of it at once.
  const [{ data: timelineInquiries }, { data: timelineFeedPosts }] =
    await Promise.all([
      supabase
        .from("inquiries")
        .select("id, subject, created_at, sender_id")
        .or(`sender_id.eq.${id},recipient_id.eq.${id}`)
        .order("created_at", { ascending: false })
        .limit(6),
      supabase
        .from("member_feed_posts")
        .select("id, body, created_at")
        .eq("author_id", id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const badgeApplicationDocs = await Promise.all(
    (badgeApplications ?? []).map(async (application) => ({
      ...application,
      docs: await Promise.all(
        ((application.document_paths ?? []) as string[]).map(async (path) => {
          const { data: signed } = await supabase.storage
            .from(STORAGE_BUCKETS.BADGE_DOCS)
            .createSignedUrl(path, 600);
          return {
            name:
              path.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "") ?? path,
            url: signed?.signedUrl ?? null,
          };
        })
      ),
    }))
  );

  const statusLabels: Record<string, string> = t.admin.memberStatus;
  const postStatusLabels: Record<string, string> = t.post.status;

  return (
    <div className="space-y-5">
      {searchParams.error === "suspend_reason_required" && (
        <p
          role="alert"
          className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative"
        >
          {t.admin.suspendReasonRequired}
        </p>
      )}
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
            {memberPrivate?.last_seen_at
              ? new Date(memberPrivate.last_seen_at).toISOString().slice(0, 16).replace("T", " ")
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
        {memberPrivate?.suspend_reason && (
          <div className="px-4 py-3">
            <dt className="text-xs font-semibold text-ink-faint">
              {t.admin.suspendReason}
            </dt>
            <dd className="mt-0.5 text-sm text-negative">{memberPrivate.suspend_reason}</dd>
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

      {canReviewBadges && badgeApplicationDocs.length > 0 && (
        <section className="card overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-sm font-bold">
              {t.admin.memberBadgeApplications}
            </h3>
            <p className="mt-1 text-xs text-ink-faint">
              {t.admin.memberBadgeApplicationsHint}
            </p>
          </div>
          <div className="divide-y divide-line">
            {badgeApplicationDocs.map((application) => {
              const badgeType = Array.isArray(application.badge_types)
                ? application.badge_types[0]
                : application.badge_types;
              return (
                <article key={application.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {locale === "ko"
                        ? badgeType?.name_ko
                        : badgeType?.name_en}
                    </p>
                    <StatusLabel
                      status={application.status}
                      label={application.status}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {application.docs.map(
                      (doc) =>
                        doc.url && (
                          <a
                            key={doc.url}
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-surface-sub px-3 py-2 text-xs font-semibold text-primary-strong"
                          >
                            {doc.name}
                          </a>
                        )
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

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
        <PendingButton className="btn-secondary btn-sm">
          {t.common.save}
        </PendingButton>
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

      {/* Member permissions: grant/revoke the coordinator role from the
          member record itself (mirrors the referral-tree control). */}
      <form action={setCoordinatorRole} className="card space-y-3 p-4">
        <div>
          <p className="text-sm font-bold">{t.admin.coordinatorRole}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {t.admin.coordinatorRoleHint}
          </p>
        </div>
        <input type="hidden" name="profileId" value={member.id} />
        <input
          type="hidden"
          name="enable"
          value={(!member.is_coordinator).toString()}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-ink-soft">
            {member.is_coordinator
              ? t.admin.coordinatorActive
              : t.admin.coordinatorInactive}
          </p>
          <ConfirmSubmit
            label={
              member.is_coordinator
                ? t.admin.revokeCoordinator
                : t.admin.grantCoordinator
            }
            confirmTitle={t.common.confirmTitle}
            confirmBody={t.common.doubleConfirm}
            confirmLabel={t.common.confirm}
            cancelLabel={t.common.cancel}
            className={
              member.is_coordinator ? "btn-danger btn-md" : "btn-secondary btn-md"
            }
            destructive={member.is_coordinator}
          />
        </div>
      </form>

      {member.is_coordinator && (
        <form
          action={setCoordinatorMessageOverride}
          className="card space-y-3 p-4"
        >
          <div>
            <p className="text-sm font-bold">
              {t.admin.coordinatorMessageOverride}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              {t.admin.coordinatorMessageOverrideHint}
            </p>
          </div>
          <input type="hidden" name="profileId" value={member.id} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              name="override"
              defaultValue={memberPrivate?.coordinator_msg_override ?? "inherit"}
              className="field flex-1"
            >
              <option value="inherit">{t.admin.policyInherit}</option>
              <option value="allow">{t.admin.policyAllow}</option>
              <option value="deny">{t.admin.policyDeny}</option>
            </select>
            <PendingButton className="btn-secondary btn-md">
              {t.common.save}
            </PendingButton>
          </div>
        </form>
      )}

      {/* Status actions with double confirmation */}
      <form action={setMemberStatus} className="card space-y-2 p-4">
        <input type="hidden" name="profileId" value={member.id} />
        {member.status === MEMBER_STATUS.ACTIVE ? (
          <>
            <input
              name="reason"
              required
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

      {/* Merged chronological activity */}
      {(() => {
        const events: { at: string; kind: string; detail: string }[] = [
          ...(posts ?? []).map((post) => ({
            at: post.updated_at,
            kind: t.admin.tlPost,
            detail: `${post.title_en} · ${postStatusLabels[post.status] ?? post.status}`,
          })),
          ...(timelineInquiries ?? []).map((inquiry) => ({
            at: inquiry.created_at,
            kind:
              inquiry.sender_id === member.id
                ? t.admin.tlInquirySent
                : t.admin.tlInquiryReceived,
            detail: inquiry.subject,
          })),
          ...(timelineFeedPosts ?? []).map((feedPost) => ({
            at: feedPost.created_at,
            kind: t.admin.tlFeed,
            detail: feedPost.body.slice(0, 60),
          })),
          ...(badgeApplicationDocs ?? []).map((application) => ({
            at: application.created_at as string,
            kind: t.admin.tlBadge,
            detail: `${(application.badge_types as { name_en?: string } | null)?.name_en ?? ""} · ${application.status}`,
          })),
          ...(logins ?? []).map((event) => ({
            at: event.created_at,
            kind: t.admin.tlLogin,
            detail: (event.user_agent ?? "").slice(0, 60),
          })),
        ]
          .filter((event) => event.at)
          .sort((a, b) => b.at.localeCompare(a.at))
          .slice(0, 15);
        if (!events.length) return null;
        return (
          <section className="space-y-2">
            <h3 className="text-sm font-bold">{t.admin.timeline}</h3>
            <div className="card px-4 py-3">
              <ol className="space-y-0">
                {events.map((event, index) => (
                  <li
                    key={`${event.at}-${index}`}
                    className="relative flex gap-3 border-l-2 border-line pb-4 pl-4 last:pb-0"
                  >
                    <span
                      className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-ink">
                        {event.kind}
                        <span className="ml-2 font-semibold text-ink-faint">
                          {event.at.slice(0, 16).replace("T", " ")}
                        </span>
                      </p>
                      {event.detail && (
                        <p className="mt-0.5 truncate text-xs text-ink-soft">
                          {event.detail}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
