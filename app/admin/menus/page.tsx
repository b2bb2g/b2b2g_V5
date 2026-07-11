import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { createMenu, deleteMenu, moveMenu, toggleMenuFlag, updateMenu } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { BOARD_TYPES } from "@/lib/constants";
import type { Menu } from "@/lib/types";
import { PendingButton } from "@/components/ui/PendingButton";

function MoveButton({
  menuId,
  direction,
  label,
}: {
  menuId: string;
  direction: -1 | 1;
  label: string;
}) {
  return (
    <form action={moveMenu} className="inline">
      <input type="hidden" name="menuId" value={menuId} />
      <input type="hidden" name="direction" value={direction} />
      <PendingButton
        aria-label={label}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-sub text-ink-soft hover:bg-line/70"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {direction === -1 ? <path d="m18 15-6-6-6 6" /> : <path d="m6 9 6 6 6-6" />}
        </svg>
      </PendingButton>
    </form>
  );
}

function FlagToggle({
  menuId,
  flag,
  value,
  onLabel,
  offLabel,
}: {
  menuId: string;
  flag: string;
  value: boolean;
  onLabel: string;
  offLabel: string;
}) {
  return (
    <form action={toggleMenuFlag}>
      <input type="hidden" name="menuId" value={menuId} />
      <input type="hidden" name="flag" value={flag} />
      <input type="hidden" name="value" value={(!value).toString()} />
      <PendingButton
        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${
          value
            ? "bg-positive-soft text-positive"
            : "bg-surface-sub text-ink-faint"
        }`}
      >
        {value ? onLabel : offLabel}
      </PendingButton>
    </form>
  );
}

export default async function MenusAdminPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.searchParams;
  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);
  const { data } = await supabase.from("menus").select("*").order("sort_order");
  const menus = (data ?? []) as Menu[];
  const boardTypeLabels: Record<string, string> = t.admin.boardTypes;

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">{t.admin.menus}</h2>

      {params.error === "has_posts" && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {t.admin.menuHasPosts}
        </p>
      )}

      <div className="space-y-2">
        {menus.map((menu) => (
          <div
            key={menu.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-line px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <MoveButton menuId={menu.id} direction={-1} label={t.admin.moveUp} />
                <MoveButton menuId={menu.id} direction={1} label={t.admin.moveDown} />
              </div>
              <p className="text-sm font-bold">
                {locale === "ko" ? menu.title_ko : menu.title_en}
                <span className="ml-2 text-xs font-normal text-ink-faint">
                  /{menu.slug} · {boardTypeLabels[menu.board_type] ?? menu.board_type}
                </span>
              </p>
            </div>
            <div className="flex gap-1.5">
              <FlagToggle
                menuId={menu.id}
                flag="is_visible"
                value={menu.is_visible}
                onLabel={`${t.admin.visible}: ${t.common.on}`}
                offLabel={`${t.admin.visible}: ${t.common.off}`}
              />
              <FlagToggle
                menuId={menu.id}
                flag="member_write"
                value={menu.member_write}
                onLabel={`${t.admin.memberWrite}: ${t.common.on}`}
                offLabel={`${t.admin.memberWrite}: ${t.common.off}`}
              />
              <FlagToggle
                menuId={menu.id}
                flag="review_required"
                value={menu.review_required}
                onLabel={`${t.admin.reviewRequired}: ${t.common.on}`}
                offLabel={`${t.admin.reviewRequired}: ${t.common.off}`}
              />
              <form action={deleteMenu}>
                <input type="hidden" name="menuId" value={menu.id} />
                <ConfirmSubmit
                  label={t.admin.deleteMenu}
                  confirmTitle={t.admin.deleteMenuConfirmTitle}
                  confirmBody={t.admin.deleteMenuConfirmBody}
                  confirmLabel={t.admin.deleteMenu}
                  cancelLabel={t.common.cancel}
                  destructive
                  className="rounded-lg bg-negative-soft px-2.5 py-1.5 text-[11px] font-semibold text-negative"
                />
              </form>
            </div>
            <details className="w-full">
              <summary className="cursor-pointer text-xs font-semibold text-primary">
                {t.admin.editMenu}
              </summary>
              <form action={updateMenu} className="mt-2 flex flex-wrap gap-2">
                <input type="hidden" name="menuId" value={menu.id} />
                <input
                  name="titleEn"
                  required
                  defaultValue={menu.title_en}
                  placeholder={t.post.titleEn}
                  className="min-w-40 flex-1 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
                />
                <input
                  name="titleKo"
                  defaultValue={menu.title_ko ?? ""}
                  placeholder={t.post.titleKo}
                  className="min-w-40 flex-1 rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
                />
                <PendingButton
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-strong"
                >
                  {t.common.save}
                </PendingButton>
              </form>
            </details>
          </div>
        ))}
      </div>

      <form
        action={createMenu}
        className="space-y-2 rounded-card border border-line p-4"
      >
        <p className="text-sm font-bold">{t.admin.menuName}</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            name="titleEn"
            required
            placeholder={t.post.titleEn}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <input
            name="titleKo"
            placeholder={t.post.titleKo}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <input
            name="slug"
            required
            placeholder={t.admin.menuSlug}
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          />
          <select
            name="boardType"
            className="rounded-xl border border-line px-3 py-2 text-xs outline-none focus:border-primary"
          >
            {Object.values(BOARD_TYPES).map((type) => (
              <option key={type} value={type}>
                {boardTypeLabels[type] ?? type}
              </option>
            ))}
          </select>
        </div>
        <PendingButton
          className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-strong"
        >
          {t.common.save}
        </PendingButton>
      </form>
    </div>
  );
}
