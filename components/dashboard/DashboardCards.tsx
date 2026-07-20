import Link from "next/link";
import { LinkPendingOverlay } from "@/components/ui/LinkPendingOverlay";

export type DashboardIconName =
  "product" | "request" | "feed" | "posts" | "inquiries" | "network";

export function DashboardIcon({
  name,
  className = "h-5 w-5",
}: {
  name: DashboardIconName;
  className?: string;
}) {
  const paths: Record<DashboardIconName, React.ReactNode> = {
    product: (
      <>
        <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
        <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
      </>
    ),
    request: (
      <>
        <path d="M5 4h14v16H5z" />
        <path d="M8 8h8M8 12h5M16 16h.01" />
      </>
    ),
    feed: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="3" />
        <path d="M7 9h10M7 13h7M7 17h4" />
      </>
    ),
    posts: (
      <>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M9 10h6M9 14h6M9 18h4M15 3v4h4" />
      </>
    ),
    inquiries: (
      <>
        <path d="M4 5h16v12H8l-4 4V5Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    network: (
      <>
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="7" r="2.5" />
        <path d="M2.5 20c.5-4.3 2.4-6.5 5.5-6.5s5 2.2 5.5 6.5M14 13c3.8-.4 6.1 1.8 6.5 5" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} fill-none stroke-current stroke-[1.8]`}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function DashboardActionCard({
  href,
  icon,
  title,
  body,
  tone = "light",
}: {
  href: string;
  icon: DashboardIconName;
  title: string;
  body: string;
  tone?: "primary" | "dark" | "light";
}) {
  const styles = {
    primary: "bg-primary text-white shadow-[0_14px_35px_rgba(36,109,224,.2)]",
    dark: "bg-[#101923] text-white shadow-[0_14px_35px_rgba(16,25,35,.14)]",
    light: "border border-line bg-white text-ink shadow-(--shadow-card)",
  };
  return (
    <Link
      href={href}
      className={`group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-[1.35rem] p-5 transition duration-300 hover:-translate-y-1 ${styles[tone]}`}
    >
      <LinkPendingOverlay />
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "light" ? "bg-primary-soft text-primary" : "bg-white/12 text-white"}`}
      >
        <DashboardIcon name={icon} />
      </span>
      <span className="mt-5">
        <strong className="block text-base font-extrabold">{title}</strong>
        <span
          className={`mt-1 block text-xs leading-5 ${tone === "light" ? "text-ink-soft" : "text-white/60"}`}
        >
          {body}
        </span>
      </span>
    </Link>
  );
}

export function DashboardMetricCard({
  href,
  icon,
  value,
  label,
}: {
  href: string;
  icon: DashboardIconName;
  value: number;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.25rem] border border-line bg-white p-3.5 shadow-[0_8px_24px_rgba(25,31,40,.045)] transition hover:border-primary/40 hover:shadow-(--shadow-card)"
    >
      <LinkPendingOverlay />
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sub text-ink-soft transition group-hover:bg-primary-soft group-hover:text-primary">
          <DashboardIcon name={icon} className="h-4.5 w-4.5" />
        </span>
        <span className="text-ink-faint transition group-hover:translate-x-0.5">
          →
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-ink-soft">{label}</p>
    </Link>
  );
}
