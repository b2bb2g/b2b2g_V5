import Link from "next/link";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { notFound, redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { sendCoordinatorMessage } from "@/app/actions/coordinator";
import { StatusLabel } from "@/components/ui/StatusLabel";
import type { Inquiry } from "@/lib/types";
import { PendingButton } from "@/components/ui/PendingButton";

// One referred member: direct message thread (unreviewed channel, PRD 16.5)
// plus their inquiry list when the admin switch allows full-text access.
export default async function CoordinatorMemberPage(props: {
  params: Promise<{ memberId: string }>;
}) {
  const { memberId } = await props.params;
  const session = await getSession();
  if (!session.userId) redirect("/login");
  if (!session.profile?.is_coordinator) redirect("/dashboard");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);

  // referred_by is no longer directly selectable by authenticated (column
  // lockdown); the definer RPC returns the row only to the owner, a members-admin
  // or the referrer, so a coordinator gets it only for a member they referred.
  const { data: member } = await supabase
    .rpc("get_profile_full", { p_id: memberId })
    .maybeSingle();
  const memberRow = member as unknown as {
    id: string;
    uid: number;
    display_name: string | null;
    company_name: string | null;
    referred_by: string | null;
  } | null;
  if (!memberRow || memberRow.referred_by !== session.userId) notFound();

  const [{ data: messages }, { data: inquiries }, { data: contact }] =
    await Promise.all([
      supabase
        .from("coordinator_messages")
        .select("*")
        .eq("coordinator_id", session.userId)
        .eq("member_id", memberId)
        .order("created_at"),
      supabase
        .from("inquiries")
        .select("*")
        .or(`sender_id.eq.${memberId},recipient_id.eq.${memberId}`)
        .order("updated_at", { ascending: false })
        .limit(20),
      // Email via the sanctioned coordinator RLS exception on profile_contacts
      // (is_direct_referrer_coordinator, a definer check — unaffected by lockdown).
      supabase
        .from("profile_contacts")
        .select("email")
        .eq("profile_id", memberId)
        .maybeSingle(),
    ]);
  const memberEmail =
    (contact as { email: string | null } | null)?.email ?? "";

  const stepLabels: Record<string, string> = t.inquiry.steps;
  const backTo = `/dashboard/coordinator/${memberId}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={memberRow.display_name ?? `UID ${memberRow.uid}`}
        subtitle={`UID ${memberRow.uid} · ${memberEmail}${
          memberRow.company_name ? ` · ${memberRow.company_name}` : ""
        }`}
      />

      <section className="space-y-2">
        <h2 className="text-sm font-bold">{t.coordinator.directMessages}</h2>
        <p className="text-xs text-ink-faint">{t.coordinator.messageHint}</p>
        {(messages ?? []).length === 0 ? (
          <p className="rounded-card border border-line px-4 py-6 text-center text-xs text-ink-faint">
            {t.coordinator.noMessages}
          </p>
        ) : (
          <div className="space-y-2">
            {(messages ?? []).map((message) => (
              <div
                key={message.id}
                className={`rounded-card border border-line p-3 ${
                  message.sender_id === session.userId
                    ? "bg-primary-soft/30"
                    : ""
                }`}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.body}
                </p>
                <p className="mt-1 text-[11px] text-ink-faint">
                  {new Date(message.created_at)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}
                </p>
              </div>
            ))}
          </div>
        )}
        <form action={sendCoordinatorMessage} className="space-y-2">
          <input type="hidden" name="coordinatorId" value={session.userId} />
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="backTo" value={backTo} />
          <textarea
            name="body"
            rows={3}
            required
            className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
          <PendingButton className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-strong">
            {t.coordinator.send}
          </PendingButton>
        </form>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">{t.coordinator.viewInquiries}</h2>
        {((inquiries ?? []) as Inquiry[]).length === 0 ? (
          <p className="rounded-card border border-line px-4 py-6 text-center text-xs text-ink-faint">
            {t.coordinator.noInquiries}
          </p>
        ) : (
          <div className="space-y-2">
            {((inquiries ?? []) as Inquiry[]).map((inquiry) => (
              <Link
                key={inquiry.id}
                href={`/inquiries/${inquiry.id}`}
                className="flex items-center justify-between gap-3 rounded-card border border-line px-4 py-3 hover:border-primary"
              >
                <p className="truncate text-sm font-semibold">
                  {inquiry.subject}
                </p>
                <StatusLabel
                  status={inquiry.status}
                  label={stepLabels[inquiry.status] ?? inquiry.status}
                />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
