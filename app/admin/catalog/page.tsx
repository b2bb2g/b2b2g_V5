import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import {
  saveCategory,
  saveSpecField,
  toggleCategoryActive,
  toggleSpecFieldActive,
} from "@/app/actions/admin/catalog";
import type { SpecFieldDef } from "@/lib/types";
import { PendingButton } from "@/components/ui/PendingButton";

// D10: category tree and the recommended spec field pool (PRD 6.6, 17.6).
export default async function CatalogAdminPage() {
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const [{ data: categories }, { data: fields }, { data: menus }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("spec_field_defs").select("*").order("sort_order"),
      supabase.from("menus").select("id, title_en").order("sort_order"),
    ]);

  const menuTitleById = new Map((menus ?? []).map((m) => [m.id, m.title_en]));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Categories */}
      <section className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.categories}</h2>
        <div className="space-y-2">
          {(categories ?? []).map((category) => (
            <div
              key={category.id}
              className="card flex flex-wrap items-center gap-2 px-4 py-2.5"
            >
              <form action={saveCategory} className="flex min-w-0 flex-1 items-center gap-2">
                <input type="hidden" name="id" value={category.id} />
                <input
                  name="nameEn"
                  defaultValue={category.name_en}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <input
                  name="nameKo"
                  defaultValue={category.name_ko}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <span className="hidden whitespace-nowrap text-[11px] text-ink-faint sm:block">
                  {category.menu_id
                    ? menuTitleById.get(category.menu_id)
                    : t.admin.allMenus}
                </span>
                <PendingButton className="btn-secondary btn-sm">
                  {t.common.save}
                </PendingButton>
              </form>
              <form action={toggleCategoryActive}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="active" value={(!category.is_active).toString()} />
                <PendingButton
                  className={`btn-sm rounded-lg font-semibold ${
                    category.is_active
                      ? "bg-positive-soft text-positive"
                      : "bg-surface-sub text-ink-faint"
                  }`}
                >
                  {category.is_active ? t.common.on : t.common.off}
                </PendingButton>
              </form>
            </div>
          ))}
        </div>

        <form action={saveCategory} className="card space-y-2 p-4">
          <p className="text-sm font-bold">{t.common.add}</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="nameEn" required placeholder={t.admin.nameEn} className="field px-2 py-1.5 text-xs" />
            <input name="nameKo" placeholder={t.admin.nameKo} className="field px-2 py-1.5 text-xs" />
          </div>
          <select name="menuId" className="field px-2 py-1.5 text-xs">
            <option value="">{t.admin.allMenus}</option>
            {(menus ?? []).map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.title_en}
              </option>
            ))}
          </select>
          <PendingButton className="btn-primary btn-sm">
            {t.common.add}
          </PendingButton>
        </form>
      </section>

      {/* Spec field pool */}
      <section className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.specFields}</h2>
        <div className="space-y-2">
          {((fields ?? []) as SpecFieldDef[]).map((field) => (
            <div key={field.id} className="card flex flex-wrap items-center gap-2 px-4 py-2.5">
              <form action={saveSpecField} className="flex min-w-0 flex-1 items-center gap-2">
                <input type="hidden" name="id" value={field.id} />
                <input
                  name="nameEn"
                  defaultValue={field.name_en}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <input
                  name="nameKo"
                  defaultValue={field.name_ko}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <PendingButton className="btn-secondary btn-sm">
                  {t.common.save}
                </PendingButton>
              </form>
              <form action={toggleSpecFieldActive}>
                <input type="hidden" name="id" value={field.id} />
                <input type="hidden" name="active" value={(!field.is_active).toString()} />
                <PendingButton
                  className={`btn-sm rounded-lg font-semibold ${
                    field.is_active
                      ? "bg-positive-soft text-positive"
                      : "bg-surface-sub text-ink-faint"
                  }`}
                >
                  {field.is_active ? t.common.on : t.common.off}
                </PendingButton>
              </form>
            </div>
          ))}
        </div>

        <form action={saveSpecField} className="card space-y-2 p-4">
          <p className="text-sm font-bold">{t.common.add}</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="nameEn" required placeholder={t.admin.nameEn} className="field px-2 py-1.5 text-xs" />
            <input name="nameKo" placeholder={t.admin.nameKo} className="field px-2 py-1.5 text-xs" />
          </div>
          <PendingButton className="btn-primary btn-sm">
            {t.common.add}
          </PendingButton>
        </form>
      </section>
    </div>
  );
}
