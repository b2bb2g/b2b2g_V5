import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { reviewPost } from "@/app/actions/admin";
import { POST_STATUS } from "@/lib/constants";
import type { Post } from "@/lib/types";

export default async function ModerationPage() {
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase
    .from("posts")
    .select("*, profiles(uid, display_name, company_name), menus(title_en, title_ko)")
    .eq("status", POST_STATUS.PENDING)
    .order("created_at");

  const posts = (data ?? []) as unknown as (Post & {
    profiles: { uid: number; display_name: string | null; company_name: string | null } | null;
    menus: { title_en: string; title_ko: string } | null;
  })[];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold">{t.admin.moderation}</h2>
      {posts.length === 0 ? (
        <EmptyState title={t.admin.noPending} />
      ) : (
        posts.map((post) => (
          <div key={post.id} className="rounded-card border border-line p-4">
            <p className="text-xs font-semibold text-ink-faint">
              {post.menus
                ? locale === "ko"
                  ? post.menus.title_ko
                  : post.menus.title_en
                : ""}
              {" · "}
              {post.profiles?.company_name ?? post.profiles?.display_name}
              {" · UID "}
              {post.profiles?.uid}
            </p>
            <p className="mt-1 text-sm font-bold">{post.title_en}</p>
            {post.title_ko && (
              <p className="text-sm text-ink-soft">{post.title_ko}</p>
            )}
            <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
              {post.body_en}
            </p>
            <form action={reviewPost} className="mt-3 space-y-2">
              <input type="hidden" name="postId" value={post.id} />
              <input
                name="reason"
                placeholder={t.admin.rejectReason}
                className="w-full rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  name="decision"
                  value="approve"
                  className="flex-1 rounded-xl bg-positive px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.approve}
                </button>
                <button
                  type="submit"
                  name="decision"
                  value="reject"
                  className="flex-1 rounded-xl bg-negative px-3 py-2.5 text-xs font-bold text-white"
                >
                  {t.admin.reject}
                </button>
              </div>
            </form>
          </div>
        ))
      )}
    </div>
  );
}
