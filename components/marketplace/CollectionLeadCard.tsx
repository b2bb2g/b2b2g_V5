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
// A purely visual collection cover: the section heading beside it already
// carries the eyebrow / title / description, so the card only shows the image
// and a call-to-action -- no repeated copy.
export function CollectionLeadCard({
  href,
  image,
  actionLabel,
}: {
  href: string;
  image: string;
  actionLabel: string;
}) {
  return (
    <Link
      href={href}
      className="store-card-interactive group relative flex h-full flex-col justify-end overflow-hidden rounded-[1.5rem] bg-[#111827] p-7 text-white focus:outline-none"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="(max-width: 640px) 88vw, 25rem"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
      <span className="relative inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/25 bg-black/35 px-5 text-sm font-bold backdrop-blur-md transition-colors group-hover:bg-black/55">
        {actionLabel}
        <Arrow />
      </span>
    </Link>
  );
}
