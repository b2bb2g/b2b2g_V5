import { getT } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteCategory,
  deleteSpecField,
  moveCategory,
  moveSpecField,
  saveCategory,
  saveSpecField,
  toggleCategoryActive,
  toggleSpecFieldActive,
} from "@/app/actions/admin/catalog";
import type { SpecFieldDef } from "@/lib/types";
import { PendingButton } from "@/components/ui/PendingButton";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";
import { SubmitSwitch } from "@/components/ui/SubmitSwitch";

function MoveControl({ id, direction, label, action }: { id: string; direction: -1 | 1; label: string; action: (formData: FormData) => Promise<void> }) {
  return <form action={action}><input type="hidden" name="id" value={id} /><input type="hidden" name="direction" value={direction} /><PendingButton aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sub text-xs font-bold text-ink-soft">{direction === -1 ? "↑" : "↓"}</PendingButton></form>;
}

// D10: category tree and the recommended spec field pool (PRD 6.6, 17.6).
export default async function CatalogAdminPage(props: { searchParams: Promise<{ error?: string }> }) {
  const params = await props.searchParams;
  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const [{ data: categories }, { data: fields }, { data: menus }] =
    await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("spec_field_defs").select("*").order("sort_order"),
      supabase.from("menus").select("id, title_en").order("sort_order"),
    ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Categories */}
      <section className="space-y-3">
        <h2 className="text-base font-bold">{t.admin.categories}</h2>
        {params.error === "category_used" && <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">{t.admin.categoryUsed}</p>}
        {params.error === "category_children" && <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">{t.admin.categoryHasChildren}</p>}
        {params.error === "category_cycle" && <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">{t.admin.categoryCycle}</p>}
        <div className="space-y-2">
          {(categories ?? []).map((category) => (
            <div
              key={category.id}
              className="card flex flex-wrap items-center gap-2 px-4 py-2.5"
            >
              <div className="flex gap-1"><MoveControl id={category.id} direction={-1} label={t.admin.moveUp} action={moveCategory} /><MoveControl id={category.id} direction={1} label={t.admin.moveDown} action={moveCategory} /></div>
              <form action={saveCategory} className="flex min-w-0 flex-1 items-center gap-2">
                <input type="hidden" name="id" value={category.id} />
                <input
                  name="nameEn"
                  defaultValue={category.name_en}
                  aria-label={t.admin.nameEn}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <input
                  name="nameKo"
                  defaultValue={category.name_ko}
                  aria-label={t.admin.nameKo}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <select name="menuId" defaultValue={category.menu_id ?? ""} aria-label={t.admin.menus} className="field hidden w-32 px-2 py-1.5 text-[11px] sm:block"><option value="">{t.admin.allMenus}</option>{(menus ?? []).map((menu) => <option key={menu.id} value={menu.id}>{menu.title_en}</option>)}</select>
                <select name="parentId" defaultValue={category.parent_id ?? ""} aria-label={t.admin.parentCategory} className="field hidden w-32 px-2 py-1.5 text-[11px] lg:block">
                  <option value="">{t.admin.rootCategory}</option>
                  {(categories ?? []).filter((candidate) => candidate.id !== category.id).map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name_en}</option>)}
                </select>
                <PendingButton className="btn-secondary btn-sm">
                  {t.common.save}
                </PendingButton>
              </form>
              <form action={deleteCategory}><input type="hidden" name="id" value={category.id} /><ConfirmSubmit label={t.admin.deleteMenu} confirmTitle={t.admin.deleteCatalogTitle} confirmBody={t.admin.deleteCatalogBody} confirmLabel={t.admin.deleteMenu} cancelLabel={t.common.cancel} destructive className="btn-sm rounded-lg bg-negative-soft font-semibold text-negative" /></form>
              <form action={toggleCategoryActive}>
                <input type="hidden" name="id" value={category.id} />
                <input type="hidden" name="active" value={(!category.is_active).toString()} />
                <SubmitSwitch checked={category.is_active} label={category.name_en} size="sm" />
              </form>
            </div>
          ))}
        </div>

        <form action={saveCategory} className="card space-y-2 p-4">
          <p className="text-sm font-bold">{t.common.add}</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="nameEn" required placeholder={t.admin.nameEn} aria-label={t.admin.nameEn} className="field px-2 py-1.5 text-xs" />
            <input name="nameKo" placeholder={t.admin.nameKo} aria-label={t.admin.nameKo} className="field px-2 py-1.5 text-xs" />
          </div>
          <select name="menuId" className="field px-2 py-1.5 text-xs">
            <option value="">{t.admin.allMenus}</option>
            {(menus ?? []).map((menu) => (
              <option key={menu.id} value={menu.id}>
                {menu.title_en}
              </option>
            ))}
          </select>
          <select name="parentId" className="field px-2 py-1.5 text-xs">
            <option value="">{t.admin.rootCategory}</option>
            {(categories ?? []).map((category) => (
              <option key={category.id} value={category.id}>{category.name_en}</option>
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
        {params.error === "spec_used" && <p className="rounded-xl bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">{t.admin.specFieldUsed}</p>}
        <div className="space-y-2">
          {((fields ?? []) as SpecFieldDef[]).map((field) => (
            <div key={field.id} className="card flex flex-wrap items-center gap-2 px-4 py-2.5">
              <div className="flex gap-1"><MoveControl id={field.id} direction={-1} label={t.admin.moveUp} action={moveSpecField} /><MoveControl id={field.id} direction={1} label={t.admin.moveDown} action={moveSpecField} /></div>
              <form action={saveSpecField} className="flex min-w-0 flex-1 items-center gap-2">
                <input type="hidden" name="id" value={field.id} />
                <input
                  name="nameEn"
                  defaultValue={field.name_en}
                  aria-label={t.admin.nameEn}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <input
                  name="nameKo"
                  defaultValue={field.name_ko}
                  aria-label={t.admin.nameKo}
                  className="field w-0 min-w-0 flex-1 px-2 py-1.5 text-xs"
                />
                <PendingButton className="btn-secondary btn-sm">
                  {t.common.save}
                </PendingButton>
              </form>
              <form action={deleteSpecField}><input type="hidden" name="id" value={field.id} /><ConfirmSubmit label={t.admin.deleteMenu} confirmTitle={t.admin.deleteCatalogTitle} confirmBody={t.admin.deleteCatalogBody} confirmLabel={t.admin.deleteMenu} cancelLabel={t.common.cancel} destructive className="btn-sm rounded-lg bg-negative-soft font-semibold text-negative" /></form>
              <form action={toggleSpecFieldActive}>
                <input type="hidden" name="id" value={field.id} />
                <input type="hidden" name="active" value={(!field.is_active).toString()} />
                <SubmitSwitch checked={field.is_active} label={field.name_en} size="sm" />
              </form>
            </div>
          ))}
        </div>

        <form action={saveSpecField} className="card space-y-2 p-4">
          <p className="text-sm font-bold">{t.common.add}</p>
          <div className="grid grid-cols-2 gap-2">
            <input name="nameEn" required placeholder={t.admin.nameEn} aria-label={t.admin.nameEn} className="field px-2 py-1.5 text-xs" />
            <input name="nameKo" placeholder={t.admin.nameKo} aria-label={t.admin.nameKo} className="field px-2 py-1.5 text-xs" />
          </div>
          <PendingButton className="btn-primary btn-sm">
            {t.common.add}
          </PendingButton>
        </form>
      </section>
    </div>
  );
}
