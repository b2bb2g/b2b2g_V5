"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getPublicSettings, settingNumber } from "@/lib/data/settings";
import {
  BADGE_CODES,
  POST_STATUS,
  SETTING_KEYS,
  STORAGE_BUCKETS,
} from "@/lib/constants";

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
  repIsVideo: boolean;
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
  // Applies to brand-new posts AND drafts being submitted for review --
  // otherwise saving drafts first would bypass the limit.
  let countsTowardQuota = !input.postId && !input.asDraft;
  if (input.postId && !input.asDraft) {
    const { data: existing } = await supabase
      .from("posts")
      .select("status")
      .eq("id", input.postId)
      .maybeSingle();
    countsTowardQuota = existing?.status === POST_STATUS.DRAFT;
  }
  if (countsTowardQuota) {
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

  const oldAssets = input.postId
    ? await Promise.all([
        supabase.from("post_media").select("path").eq("post_id", input.postId),
        supabase
          .from("post_attachments")
          .select("path")
          .eq("post_id", input.postId),
      ])
    : null;

  // One PostgreSQL function owns the post row and every child row. A failure
  // rolls the whole bundle back instead of leaving a partially saved post.
  const { data: savedId, error: saveError } = await supabase.rpc(
    "save_post_bundle",
    {
      p_post_id: input.postId ?? null,
      p_menu_slug: input.menuSlug,
      p_title_en: input.titleEn,
      p_title_ko: input.titleKo,
      p_body_en: input.bodyEn,
      p_body_ko: input.bodyKo,
      p_category_id: input.categoryId,
      p_deadline: input.deadline || null,
      p_rep_video_url: input.repVideoUrl,
      p_rep_is_video: input.repIsVideo,
      p_rep_image_path: input.repImagePath,
      p_as_draft: input.asDraft,
      p_specs: input.specs,
      p_image_paths: input.imagePaths,
      p_attachments: input.attachments,
    },
  );
  if (saveError || !savedId) return { error: "save" };
  const postId = String(savedId);

  if (oldAssets) {
    const keepMedia = new Set(input.imagePaths);
    const keepAttachments = new Set(input.attachments.map((item) => item.path));
    const removedMedia = (oldAssets[0].data ?? [])
      .map((item) => item.path)
      .filter((path) => !keepMedia.has(path));
    const removedAttachments = (oldAssets[1].data ?? [])
      .map((item) => item.path)
      .filter((path) => !keepAttachments.has(path));
    await Promise.all([
      removedMedia.length
        ? supabase.storage.from(STORAGE_BUCKETS.POST_MEDIA).remove(removedMedia)
        : Promise.resolve(),
      removedAttachments.length
        ? supabase.storage
            .from(STORAGE_BUCKETS.ATTACHMENTS)
            .remove(removedAttachments)
        : Promise.resolve(),
    ]);
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
  redirect("/dashboard/posts?toast=closed");
}

export async function deleteOwnPost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const supabase = await createClient();
  const [media, attachments] = await Promise.all([
    supabase.from("post_media").select("path").eq("post_id", postId),
    supabase.from("post_attachments").select("path").eq("post_id", postId),
  ]);
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) redirect("/dashboard/posts?error=delete");
  await Promise.all([
    media.data?.length
      ? supabase.storage
          .from(STORAGE_BUCKETS.POST_MEDIA)
          .remove(media.data.map((item) => item.path))
      : Promise.resolve(),
    attachments.data?.length
      ? supabase.storage
          .from(STORAGE_BUCKETS.ATTACHMENTS)
          .remove(attachments.data.map((item) => item.path))
      : Promise.resolve(),
  ]);
  revalidatePath("/dashboard/posts");
  redirect("/dashboard/posts?toast=deleted");
}
