import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getVisibleMenus } from "@/lib/data/menus";

// Board chooser: the entry point for "register a product / write a post"
// actions on the dashboard. Shows only boards the member may write in.
export default async function WriteSelectPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login?next=/write/select");

  const [{ t }, menus] = await Promise.all([getT(), getVisibleMenus()]);
  const writable = menus.filter(
    (menu) => menu.member_write || session.profile?.is_admin
  );

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-extrabold">{t.post.chooseBoard}</h1>
      <div className="grid grid-cols-2 gap-3">
        {writable.map((menu) => (
          <Link
            key={menu.id}
            href={`/write?menu=${menu.slug}`}
            className="rounded-card border border-line p-4 hover:border-primary hover:bg-primary-soft/40"
          >
            <p className="text-sm font-bold">{menu.title_en}</p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {(t.admin.boardTypes as Record<string, string>)[menu.board_type] ??
                menu.board_type}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
