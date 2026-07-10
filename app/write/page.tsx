import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { getMenuBySlug } from "@/lib/data/menus";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { PostComposer } from "@/components/post/PostComposer";
import { SETTING_KEYS } from "@/lib/constants";
import type { SpecFieldDef, Post, PostSpec } from "@/lib/types";

export default async function WritePage(props: {
  searchParams: Promise<{ menu?: string; post?: string }>;
}) {
  const params = await props.searchParams;
  const session = await getSession();
  if (!session.userId) redirect(`/login?next=/write?menu=${params.menu ?? ""}`);

  const menu = params.menu ? await getMenuBySlug(params.menu) : null;
  if (!menu) notFound();
  if (!menu.member_write && !session.profile?.is_admin) notFound();

  const [{ t, locale }, settings, supabase] = await Promise.all([
    getT(),
    getPublicSettings(),
    createClient(),
  ]);

  const [{ data: fieldPool }, { data: categories }] = await Promise.all([
    supabase
      .from("spec_field_defs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("categories")
      .select("id, name_en, name_ko")
      .eq("is_active", true)
      .or(`menu_id.is.null,menu_id.eq.${menu.id}`)
      .order("sort_order"),
  ]);

  // Edit mode: load own post (RLS restricts to author/admin anyway).
  let initial;
  if (params.post) {
    const [{ data: post }, { data: specs }, { data: media }] = await Promise.all([
      supabase.from("posts").select("*").eq("id", params.post).maybeSingle(),
      supabase.from("post_specs").select("*").eq("post_id", params.post).order("sort_order"),
      supabase.from("post_media").select("path").eq("post_id", params.post).order("sort_order"),
    ]);
    const p = post as Post | null;
    if (!p || (p.author_id !== session.userId && !session.profile?.is_admin)) notFound();
    initial = {
      postId: p.id,
      titleEn: p.title_en,
      titleKo: p.title_ko ?? "",
      bodyEn: p.body_en,
      bodyKo: p.body_ko ?? "",
      categoryId: p.category_id,
      deadline: p.deadline ?? "",
      repVideoUrl: p.rep_video_url ?? "",
      repImagePath: p.rep_image_path,
      imagePaths: (media ?? []).map((m) => m.path),
      specs: ((specs ?? []) as PostSpec[]).map((s) => ({
        fieldDefId: s.field_def_id,
        nameEn: s.name_en,
        nameKo: s.name_ko,
        value: s.value,
      })),
    };
  }

  return (
    <div className="wide space-y-4">
      <PageHeader title={initial ? t.post.editPost : t.post.writePost} subtitle={menu.title_en} />
      <div className="max-w-2xl">
        <PostComposer
        t={t}
        locale={locale}
        userId={session.userId}
        menuSlug={menu.slug}
        boardType={menu.board_type}
        fieldPool={(fieldPool as SpecFieldDef[]) ?? []}
        categories={categories ?? []}
        maxFileMb={settingNumber(settings, SETTING_KEYS.UPLOAD_MAX_FILE_MB, 10)}
        maxFiles={settingNumber(settings, SETTING_KEYS.UPLOAD_MAX_FILES_PER_POST, 10)}
        initial={initial}
        />
      </div>
    </div>
  );
}
