import Image from "next/image";
import Link from "next/link";

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// The 400 × 500 lead card shared by landing and board collection shelves.
// It introduces the collection before the narrower 313 × 500 listing cards.
export function CollectionLeadCard({
  href,
  image,
  eyebrow,
  title,
  body,
  actionLabel,
}: {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="store-card-interactive group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-[#111827] p-7 text-white focus:outline-none"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 88vw, 25rem"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/68 via-black/24 to-black/72" />
      <div className="relative flex h-full flex-col">
        <div className="flex min-h-6 items-center">
          <p className="truncate text-xs font-bold uppercase leading-6 tracking-[.14em] text-white/72">
            {eyebrow}
          </p>
        </div>
        <h3 className="mt-4 whitespace-nowrap text-2xl font-semibold leading-[1.08] tracking-[-.035em]">
          {title}
        </h3>
        <p className="mt-3 min-h-12 max-w-sm line-clamp-2 text-sm leading-6 text-white/82">
          {body}
        </p>
        <span className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/20 bg-black/28 px-4 text-sm font-semibold backdrop-blur-md transition-colors group-hover:bg-black/45">
          {actionLabel}
          <Arrow />
        </span>
      </div>
    </Link>
  );
}
