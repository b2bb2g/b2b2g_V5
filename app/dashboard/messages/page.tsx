import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { sendCoordinatorMessage } from "@/app/actions/coordinator";
import { EmptyState } from "@/components/ui/EmptyState";

// Member side of the coordinator direct channel (PRD 16.5). Only exists when
// the member joined through a coordinator's referral link.
export default async function MemberMessagesPage() {
  const session = await getSession();
  if (!session.userId || !session.profile) redirect("/login");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);

  const referrerId = session.profile.referred_by;
  let coordinator: { id: string; display_name: string | null; is_coordinator: boolean } | null =
    null;
  if (referrerId) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, is_coordinator")
      .eq("id", referrerId)
      .maybeSingle();
    coordinator = data;
  }

  if (!coordinator?.is_coordinator) {
    return (
      <div className="space-y-4">
        <PageHeader title={t.coordinator.directMessages} />
        <EmptyState title={t.coordinator.noMessages} />
      </div>
    );
  }

  const { data: messages } = await supabase
    .from("coordinator_messages")
    .select("*")
    .eq("coordinator_id", coordinator.id)
    .eq("member_id", session.userId)
    .order("created_at");

  return (
    <div className="space-y-4">
      <PageHeader
        title={t.coordinator.directMessages}
        subtitle={`${coordinator.display_name} · ${t.coordinator.messageHint}`}
      />

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
                message.sender_id === session.userId ? "bg-primary-soft/30" : ""
              }`}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {message.body}
              </p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {new Date(message.created_at).toISOString().slice(0, 16).replace("T", " ")}
              </p>
            </div>
          ))}
        </div>
      )}

      <form action={sendCoordinatorMessage} className="space-y-2">
        <input type="hidden" name="coordinatorId" value={coordinator.id} />
        <input type="hidden" name="memberId" value={session.userId} />
        <input type="hidden" name="backTo" value="/dashboard/messages" />
        <textarea
          name="body"
          rows={3}
          required
          className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-strong"
        >
          {t.coordinator.send}
        </button>
      </form>
    </div>
  );
}
