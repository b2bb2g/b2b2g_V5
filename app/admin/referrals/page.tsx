import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { setCoordinatorRole } from "@/app/actions/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { BadgePill } from "@/components/ui/Badge";
import type { Dictionary } from "@/lib/i18n";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";

type Node = {
  id: string;
  uid: number;
  display_name: string | null;
  company_name: string | null;
  is_coordinator: boolean;
  referred_by: string | null;
  children: Node[];
};

// D4: full referral tree with coordinator grant/revoke (PRD 16.3, 17.8).
function TreeNode({ node, depth, t }: { node: Node; depth: number; t: Dictionary }) {
  return (
    <div style={depth ? { marginLeft: depth * 20 } : undefined}>
      <div className="card mb-2 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {depth > 0 && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-ink-faint" aria-hidden="true">
              <path d="M4 4v8a4 4 0 0 0 4 4h12" />
              <path d="m15 11 5 5-5 5" />
            </svg>
          )}
          <Link
            href={`/admin/members/${node.id}`}
            className="truncate text-sm font-semibold text-primary-strong hover:underline"
          >
            {node.display_name ?? `UID ${node.uid}`}
          </Link>
          <span className="text-xs text-ink-faint">UID {node.uid}</span>
          {node.is_coordinator && (
            <BadgePill code="coordinator" label={t.badges.coordinator} />
          )}
        </div>
        <form action={setCoordinatorRole}>
          <input type="hidden" name="profileId" value={node.id} />
          <input type="hidden" name="enable" value={(!node.is_coordinator).toString()} />
          <ConfirmSubmit
            label={node.is_coordinator ? t.admin.revokeCoordinator : t.admin.grantCoordinator}
            confirmTitle={t.common.confirmTitle}
            confirmBody={t.common.doubleConfirm}
            confirmLabel={t.common.confirm}
            cancelLabel={t.common.cancel}
            className={node.is_coordinator ? "btn-danger btn-sm" : "btn-secondary btn-sm"}
          />
        </form>
      </div>
      {node.children.map((child) => (
        <TreeNode key={child.id} node={child} depth={depth + 1} t={t} />
      ))}
    </div>
  );
}

export default async function ReferralsAdminPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  // referred_by is no longer directly selectable by authenticated (column
  // lockdown); the admin-only definer RPC returns the full referral graph.
  const { data } = await supabase.rpc("admin_referral_graph");

  const rows = ((data ?? []) as Omit<Node, "children">[]).map((row) => ({
    ...row,
    children: [] as Node[],
  }));
  const byId = new Map(rows.map((row) => [row.id, row]));
  const roots: Node[] = [];
  for (const row of rows) {
    const parent = row.referred_by ? byId.get(row.referred_by) : null;
    if (parent) parent.children.push(row);
    else roots.push(row);
  }
  // Show only trees that have relationships, plus standalone coordinators.
  const meaningful = roots.filter(
    (root) => root.children.length > 0 || root.is_coordinator
  );

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.referrals}</h2>
      {meaningful.length === 0 ? (
        <EmptyState title={t.admin.noReferrals} />
      ) : (
        <div>
          {meaningful.map((root) => (
            <TreeNode key={root.id} node={root} depth={0} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
