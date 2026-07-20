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
// A collection cover: image + its own one-line description + call-to-action.
// It deliberately omits the eyebrow/title the neighbouring section heading
// already shows, so the copy here complements the heading instead of repeating
// it.
export function CollectionLeadCard({
  href,
  image,
  body,
  actionLabel,
}: {
  href: string;
  image: string;
  body?: string;
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/12" />
      <div className="relative">
        {body && (
          <p className="max-w-[26ch] text-[15px] font-semibold leading-6 text-white/90">
            {body}
          </p>
        )}
        <span className="mt-4 inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-white/25 bg-black/35 px-5 text-sm font-bold backdrop-blur-md transition-colors group-hover:bg-black/55">
          {actionLabel}
          <Arrow />
        </span>
      </div>
    </Link>
  );
}
