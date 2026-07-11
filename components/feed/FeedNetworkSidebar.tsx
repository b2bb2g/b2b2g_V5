import Image from "next/image";
import Link from "next/link";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { postMediaUrl } from "@/lib/media";
import type { Dictionary } from "@/lib/i18n";
import type { MemberNetworkStats } from "@/lib/data/feed";
import type { Profile } from "@/lib/types";

export function FeedNetworkSidebar({
  profile,
  stats,
  bio,
  t,
}: {
  profile: Profile | null;
  stats: MemberNetworkStats;
  bio: string;
  t: Dictionary;
}) {
  if (!profile) {
    return (
      <aside className="sticky top-24 hidden overflow-hidden rounded-[1.5rem] bg-[#101923] p-6 text-white shadow-(--shadow-card) lg:block">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-[#79b4ff]">
          B2BB2G
        </p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-[-.03em]">
          {t.feed.title}
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/65">
          {t.feed.networkIntro}
        </p>
        <div className="mt-6 grid gap-2">
          <Link
            href="/signup"
            className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-extrabold text-white transition hover:bg-primary-strong"
          >
            {t.feed.joinNetwork}
          </Link>
          <Link
            href="/login?next=/feed"
            className="rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15"
          >
            {t.common.signIn}
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sticky top-24 hidden overflow-hidden rounded-[1.5rem] bg-[#101923] p-6 text-white shadow-(--shadow-card) lg:block">
      <p className="text-xs font-bold uppercase tracking-[.16em] text-[#79b4ff]">
        {t.feed.myNetwork}
      </p>
      <div className="mt-4 flex items-center gap-3">
        {profile.avatar_url ? (
          <Image
            src={postMediaUrl(profile.avatar_url)}
            alt=""
            width={58}
            height={58}
            className="h-14.5 w-14.5 rounded-full border border-white/15 object-cover"
          />
        ) : (
          <DefaultAvatar className="h-14.5 w-14.5 ring-2 ring-white/10" />
        )}
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold">UID:{profile.uid}</h2>
          <p className="mt-0.5 text-xs text-white/50">
            {t.feed.memberSubtitle}
          </p>
        </div>
      </div>
      <p className="mt-5 line-clamp-4 text-sm leading-6 text-white/65">
        {bio || t.profile.publicMemberHint}
      </p>
      <dl className="mt-6 grid grid-cols-3 border-y border-white/10 py-4 text-center">
        {[
          [stats.posts, t.feed.posts],
          [stats.followers, t.feed.followers],
          [stats.following, t.feed.followingCount],
        ].map(([value, label]) => (
          <div key={String(label)}>
            <dt className="text-lg font-extrabold">{value}</dt>
            <dd className="mt-0.5 text-[11px] text-white/45">{label}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid gap-2">
        <Link
          href={`/u/${profile.uid}`}
          className="rounded-xl bg-primary px-4 py-3 text-center text-sm font-extrabold text-white transition hover:bg-primary-strong"
        >
          {t.feed.viewProfile}
        </Link>
        <Link
          href="/dashboard/profile/edit"
          className="rounded-xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-white/15"
        >
          {t.feed.editProfile}
        </Link>
      </div>
    </aside>
  );
}
