import type { Locale } from "@/lib/constants";
import type { MemberBadge } from "@/lib/types";

// Extensible badge component (DESIGN 2.4): admin can add badge types at any
// time, so styling falls back to a neutral scheme for unknown codes.
// Brand rules: Manufacturer = navy (calm authority), Verified = green.
const BADGE_STYLES: Record<string, string> = {
  manufacturer: "bg-navy-soft text-navy",
  certified: "bg-positive-soft text-positive",
  coordinator: "bg-caution-soft text-caution",
};

export function BadgePill({
  code,
  label,
}: {
  code: string;
  label: string;
}) {
  const style = BADGE_STYLES[code] ?? "bg-surface-sub text-ink-soft";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

export function BadgeList({
  badges,
  locale,
}: {
  badges: MemberBadge[];
  locale: Locale;
}) {
  if (!badges.length) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {badges.map(
        (b) =>
          b.badge_types && (
            <BadgePill
              key={b.badge_type_id}
              code={b.badge_types.code}
              label={locale === "ko" ? b.badge_types.name_ko : b.badge_types.name_en}
            />
          )
      )}
    </span>
  );
}
