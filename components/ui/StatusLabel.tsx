// Unified status label system (DESIGN 2.5): one color language everywhere.
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-surface-sub text-ink-faint",
  pending: "bg-caution-soft text-caution",
  approved: "bg-positive-soft text-positive",
  rejected: "bg-negative-soft text-negative",
  closed: "bg-surface-sub text-ink-soft",
  sent: "bg-surface-sub text-ink-soft",
  admin_review: "bg-caution-soft text-caution",
  forwarded: "bg-primary-soft text-primary-strong",
  answered: "bg-surface-sub text-ink-soft",
  answer_review: "bg-caution-soft text-caution",
  answer_delivered: "bg-positive-soft text-positive",
  active: "bg-positive-soft text-positive",
  suspended: "bg-negative-soft text-negative",
  withdrawn: "bg-surface-sub text-ink-faint",
};

export function StatusLabel({ status, label }: { status: string; label: string }) {
  const style = STATUS_STYLES[status] ?? "bg-surface-sub text-ink-soft";
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}
