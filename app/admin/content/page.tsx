import Link from "next/link";
import Image from "next/image";
import { getT } from "@/lib/i18n/server";
import { POST_STATUS } from "@/lib/constants";
import { requireAdmin } from "@/app/actions/admin/core";
import { uploadSiteAsset } from "@/app/actions/admin/operations";
import { PendingButton } from "@/components/ui/PendingButton";

export default async function AdminContentPage(props: { searchParams: Promise<{ error?: string; toast?: string }> }) {
  const params = await props.searchParams;
  const [{ t, locale }, { supabase }] = await Promise.all([getT(), requireAdmin("content")]);
  const [{ data: menus }, { data: recentPosts }, { data: ogSetting }] = await Promise.all([
    supabase
      .from("menus")
      .select("id, slug, title_en, title_ko, board_type, is_visible, member_write")
      .order("sort_order"),
    supabase
      .from("posts")
      .select("id, menu_id, title_en, title_ko, status, updated_at, menus(slug)")
      .order("updated_at", { ascending: false })
      .limit(12),
    supabase.from("site_settings").select("value").eq("key", "site_og_image").maybeSingle(),
  ]);
  const boardIds = (menus ?? []).map((menu) => menu.id);
  const [{ data: publishedRows }, { data: draftRows }] = await Promise.all([
    boardIds.length
      ? supabase.from("posts").select("menu_id").in("menu_id", boardIds).eq("status", POST_STATUS.APPROVED)
      : Promise.resolve({ data: [] }),
    boardIds.length
      ? supabase.from("posts").select("menu_id").in("menu_id", boardIds).in("status", [POST_STATUS.DRAFT, POST_STATUS.PENDING])
      : Promise.resolve({ data: [] }),
  ]);
  const counts = (rows: { menu_id: string }[] | null) =>
    (rows ?? []).reduce<Record<string, number>>((result, row) => {
      result[row.menu_id] = (result[row.menu_id] ?? 0) + 1;
      return result;
    }, {});
  const published = counts(publishedRows);
  const drafts = counts(draftRows);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">{t.admin.operations}</p>
        <h2 className="mt-2 text-2xl font-extrabold">{t.admin.contentOps}</h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-faint">{t.admin.contentOpsHint}</p>
      </header>
      {params.error === "invalid_asset" && <p className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">{t.admin.invalidSiteAsset}</p>}

      <section className="card grid gap-5 p-5 md:grid-cols-[14rem_1fr] md:items-center">
        <div className="relative aspect-[1.91/1] overflow-hidden rounded-2xl bg-surface-sub">{typeof ogSetting?.value === "string" && ogSetting.value ? <Image src={ogSetting.value} alt="" fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs font-bold text-ink-faint">OG</div>}</div>
        <form action={uploadSiteAsset} className="space-y-3"><div><h3 className="font-extrabold">{t.admin.siteAssetTitle}</h3><p className="mt-1 text-xs text-ink-faint">{t.admin.siteAssetHint}</p></div><input type="hidden" name="key" value="site_og_image" /><input type="file" name="file" required accept="image/jpeg,image/png,image/webp,image/avif" className="field w-full px-3 py-2 text-sm" /><PendingButton className="btn-primary btn-sm">{t.admin.uploadAsset}</PendingButton></form>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(menus ?? []).map((menu) => {
          const title = locale === "ko" ? menu.title_ko : menu.title_en;
          return (
            <article key={menu.id} className="card flex min-h-44 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{menu.board_type}</p>
                  <h3 className="mt-2 text-lg font-extrabold">{title}</h3>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${menu.is_visible ? "bg-positive-soft text-positive" : "bg-surface-sub text-ink-faint"}`}>
                  {menu.is_visible ? t.common.on : t.common.off}
                </span>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-ink-faint">{t.admin.publishedCount}</dt><dd className="mt-1 text-xl font-extrabold">{published[menu.id] ?? 0}</dd></div>
                <div><dt className="text-xs text-ink-faint">{t.admin.draftCount}</dt><dd className="mt-1 text-xl font-extrabold">{drafts[menu.id] ?? 0}</dd></div>
              </dl>
              <div className="mt-auto flex gap-2 pt-5">
                <Link href={`/write?menu=${menu.slug}`} className="btn-primary btn-sm flex-1">{t.admin.quickPublish}</Link>
                <Link href={`/${menu.slug}`} className="btn-secondary btn-sm flex-1">{t.admin.manageBoard}</Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-line px-5 py-4"><h3 className="font-extrabold">{t.admin.latestContent}</h3></div>
        <div className="divide-y divide-line">
          {(recentPosts ?? []).map((post) => {
            const menu = Array.isArray(post.menus) ? post.menus[0] : post.menus;
            return (
              <Link key={post.id} href={`/${menu?.slug ?? "notices"}/${post.id}`} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-sub">
                <span className="min-w-0"><strong className="block truncate text-sm">{locale === "ko" ? post.title_ko || post.title_en : post.title_en}</strong><small className="mt-1 block text-ink-faint">{new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(post.updated_at))}</small></span>
                <span className="rounded-full bg-surface-sub px-2.5 py-1 text-xs font-bold text-ink-soft">{post.status}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
