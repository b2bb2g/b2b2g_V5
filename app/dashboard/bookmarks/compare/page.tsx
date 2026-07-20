import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspacePageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { SafeImage } from "@/components/ui/SafeImage";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";
import { getFullPost } from "@/lib/data/posts";
import { postMediaUrl } from "@/lib/media";
import { menuTitle } from "@/lib/data/menus";

const UUID = /^[0-9a-f-]{36}$/;

// Side-by-side comparison of saved products: one column per product, one
// row per spec (union across the set). Members only, 2-3 products.
export default async function CompareBookmarksPage(props: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/dashboard/bookmarks");
  const { ids: rawIds } = await props.searchParams;
  const ids = [...new Set((rawIds ?? "").split(",").filter((id) => UUID.test(id)))].slice(0, 3);
  if (ids.length < 2) redirect("/dashboard/bookmarks");

  const [{ t, locale }, menus, ...fulls] = await Promise.all([
    getT(),
    getVisibleMenus(),
    ...ids.map((id) => getFullPost(id)),
  ]);
  const products = fulls.filter(
    (full): full is NonNullable<(typeof fulls)[number]> => Boolean(full),
  );
  if (products.length < 2) notFound();
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));

  // Union of spec names, in first-seen order, keyed by localized label.
  const specRows: string[] = [];
  const specValueByProduct = products.map((full) => {
    const map = new Map<string, string>();
    for (const spec of full.specs) {
      const name =
        locale === "ko" && spec.name_ko ? spec.name_ko : spec.name_en;
      if (!specRows.includes(name)) specRows.push(name);
      map.set(name, spec.value);
    }
    return map;
  });

  return (
    <div className="space-y-5">
      <WorkspacePageHeader
        title={t.dashboard.compareTitle}
        description={t.dashboard.compareHint}
        action={
          <Link href="/dashboard/bookmarks" className="btn-secondary btn-md">
            {t.dashboard.savedProducts}
          </Link>
        }
      />

      <div className="overflow-x-auto rounded-[1.5rem] border border-line bg-white shadow-(--shadow-card)">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 border-b border-line bg-surface-sub/50 px-4 py-3 text-left text-xs font-bold text-ink-faint" />
              {products.map((full) => {
                const menu = menuById.get(full.post.menu_id);
                const href = menu
                  ? `/${menu.slug}/${full.post.id}`
                  : "/dashboard/bookmarks";
                const title =
                  locale === "ko" && full.post.title_ko
                    ? full.post.title_ko
                    : full.post.title_en;
                return (
                  <th
                    key={full.post.id}
                    className="border-b border-line px-4 py-4 text-left align-top"
                  >
                    <Link href={href} className="group block">
                      <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-xl bg-surface-sub">
                        {full.post.rep_image_path ? (
                          <SafeImage
                            src={postMediaUrl(full.post.rep_image_path)}
                            alt=""
                            fill
                            sizes="(max-width: 640px) 40vw, 18rem"
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <MediaPlaceholder />
                        )}
                      </span>
                      <span className="mt-2.5 line-clamp-2 block text-sm font-extrabold leading-snug transition-colors group-hover:text-primary">
                        {title}
                      </span>
                      {menu && (
                        <span className="mt-1 block text-xs font-semibold text-ink-faint">
                          {menuTitle(menu, locale)}
                        </span>
                      )}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-line/70">
            {specRows.length === 0 ? (
              <tr>
                <td
                  colSpan={products.length + 1}
                  className="px-4 py-8 text-center text-sm text-ink-faint"
                >
                  {t.dashboard.compareNoSpecs}
                </td>
              </tr>
            ) : (
              specRows.map((name) => (
                <tr key={name} className="align-top">
                  <th className="bg-surface-sub/40 px-4 py-3 text-left text-xs font-bold text-ink-soft">
                    {name}
                  </th>
                  {specValueByProduct.map((map, index) => (
                    <td
                      key={`${name}-${products[index].post.id}`}
                      className="px-4 py-3 text-sm leading-6"
                    >
                      {map.get(name) ?? (
                        <span className="text-ink-faint">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
