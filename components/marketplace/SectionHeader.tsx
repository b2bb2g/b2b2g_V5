import Link from "next/link";

export function SectionHeader({ title, href, viewAll }: { title: string; href: string; viewAll: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">{title}</h2>
      <Link href={href} className="group flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-strong">
        {viewAll}<span className="transition-transform group-hover:translate-x-0.5" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
