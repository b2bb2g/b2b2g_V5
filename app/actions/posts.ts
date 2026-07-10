"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import { BADGE_CODES, POST_STATUS, SETTING_KEYS } from "@/lib/constants";

export type SpecInput = {
  fieldDefId: string | null;
  nameEn: string;
  nameKo: string | null;
  value: string;
};

export type AttachmentInput = { path: string; name: string; size: number };

export type PostInput = {
  menuSlug: string;
  titleEn: string;
  titleKo: string;
  bodyEn: string;
  bodyKo: string;
  categoryId: string | null;
  deadline: string | null;
  repVideoUrl: string;
  imagePaths: string[];
  repImagePath: string | null;
  attachments: AttachmentInput[];
  specs: SpecInput[];
  asDraft: boolean;
  postId?: string;
};

async function isPaidMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("member_badges")
    .select("badge_types!inner(code)")
    .eq("profile_id", userId)
    .eq("badge_types.code", BADGE_CODES.CERTIFIED);
  return (data?.length ?? 0) > 0;
}

export async function savePost(input: PostInput): Promise<{ error?: string; postId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: menu } = await supabase
    .from("menus")
    .select("*")
    .eq("slug", input.menuSlug)
    .maybeSingle();
  if (!menu) return { error: "menu" };

  // Free-member post quota (admin-set value; certified members unlimited).
  if (!input.postId && !input.asDraft) {
    const paid = await isPaidMember(supabase, user.id);
    if (!paid) {
      const settings = await getPublicSettings();
      const limit = settingNumber(settings, SETTING_KEYS.FREE_POST_LIMIT, 3);
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user.id)
        .neq("status", POST_STATUS.DRAFT);
      if ((count ?? 0) >= limit) return { error: "limit" };
    }
  }

  // Review-before-publish is the global default; immediate publish is an
  // admin-only board switch and still lands as pending for members.
  const status = input.asDraft ? POST_STATUS.DRAFT : POST_STATUS.PENDING;

  const row = {
    menu_id: menu.id,
    author_id: user.id,
    type: menu.board_type,
    status,
    title_en: input.titleEn,
    title_ko: input.titleKo || null,
    body_en: input.bodyEn,
    body_ko: input.bodyKo || null,
    category_id: input.categoryId,
    deadline: input.deadline || null,
    rep_video_url: input.repVideoUrl || null,
    rep_image_path: input.repImagePath,
  };

  let postId = input.postId;
  if (postId) {
    const { error } = await supabase.from("posts").update(row).eq("id", postId);
    if (error) return { error: "save" };
    await Promise.all([
      supabase.from("post_specs").delete().eq("post_id", postId),
      supabase.from("post_media").delete().eq("post_id", postId),
      supabase.from("post_attachments").delete().eq("post_id", postId),
    ]);
  } else {
    const { data, error } = await supabase
      .from("posts")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) return { error: "save" };
    postId = data.id;
  }

  if (input.specs.length) {
    await supabase.from("post_specs").insert(
      input.specs.map((s, i) => ({
        post_id: postId,
        field_def_id: s.fieldDefId,
        name_en: s.nameEn,
        name_ko: s.nameKo,
        value: s.value,
        sort_order: i,
      }))
    );
  }
  if (input.imagePaths.length) {
    await supabase.from("post_media").insert(
      input.imagePaths.map((path, i) => ({
        post_id: postId,
        path,
        sort_order: i,
      }))
    );
  }
  if (input.attachments.length) {
    // Attachments must live under the author's own folder (bucket RLS).
    await supabase.from("post_attachments").insert(
      input.attachments
        .filter((a) => a.path.startsWith(`${user.id}/`))
        .map((a) => ({
          post_id: postId,
          path: a.path,
          filename: a.name,
          size_bytes: a.size,
        }))
    );
  }

  revalidatePath(`/${input.menuSlug}`);
  revalidatePath("/dashboard/posts");
  return { postId };
}

export async function closeOwnPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const supabase = await createClient();
  await supabase
    .from("posts")
    .update({ status: POST_STATUS.CLOSED, closed_at: new Date().toISOString() })
    .eq("id", postId);
  revalidatePath("/dashboard/posts");
}

export async function deleteOwnPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const supabase = await createClient();
  await supabase.from("posts").delete().eq("id", postId);
  revalidatePath("/dashboard/posts");
}
