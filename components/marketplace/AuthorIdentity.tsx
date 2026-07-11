import Link from "next/link";
import { BadgePill } from "@/components/ui/Badge";

type PublicBadge = {
  code: string;
  name_en: string;
  name_ko: string;
};

export function AuthorIdentity({
  uid,
  badges = [],
  locale,
  linked = false,
  className = "",
}: {
  uid: number;
  badges?: PublicBadge[];
  locale: string;
  linked?: boolean;
  className?: string;
}) {
  const identity = linked ? (
    <Link
      href={`/u/${uid}`}
      className="font-semibold transition hover:text-primary-strong"
    >
      UID:{uid}
    </Link>
  ) : (
    <span>UID:{uid}</span>
  );

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {identity}
      {badges.map((badge) => (
        <BadgePill
          key={badge.code}
          code={badge.code}
          label={locale === "ko" ? badge.name_ko : badge.name_en}
        />
      ))}
    </span>
  );
}
