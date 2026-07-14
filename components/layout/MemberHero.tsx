"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";

// The workspace hero belongs to the dashboard index only. Sub-pages
// (posts, inquiries, security, profile...) each carry their own header, so
// showing this banner there stacks two headers and mislabels the location.
export function MemberHero({
  uid,
  avatarSrc,
  eyebrow,
  title,
  hint,
}: {
  uid: number;
  avatarSrc: string | null;
  eyebrow: string;
  title: string;
  hint: string;
}) {
  const pathname = usePathname();
  if (pathname !== "/dashboard") return null;

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-[#101923] px-5 py-5 text-white shadow-[0_16px_48px_rgba(16,25,35,.14)] sm:px-7 sm:py-6">
      <span
        className="absolute -right-20 -top-28 h-64 w-64 rounded-full border-[44px] border-primary/15"
        aria-hidden="true"
      />
      <div className="relative flex items-center justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#79b4ff]">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-[-.04em] sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 hidden max-w-xl text-xs leading-5 text-white/55 sm:block">
            {hint}
          </p>
        </div>
        <Link
          href={`/u/${uid}`}
          className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/8 p-1.5 pr-3 transition hover:bg-white/12"
        >
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              alt=""
              width={38}
              height={38}
              className="h-9.5 w-9.5 rounded-full object-cover"
            />
          ) : (
            <DefaultAvatar className="h-9.5 w-9.5" />
          )}
          <span className="hidden text-xs font-extrabold sm:block">
            UID:{uid}
          </span>
        </Link>
      </div>
    </div>
  );
}
