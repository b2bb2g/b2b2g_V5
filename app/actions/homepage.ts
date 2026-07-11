"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BADGE_CODES } from "@/lib/constants";

export type HomepageInput = {
  slug: string;
  introEn: string;
  introKo: string;
  coverImagePath: string | null;
  docPaths: { path: string; name: string }[];
  galleryPaths: string[];
  certPaths: { path: string; name: string }[];
  customDomain: string;
  isPublished: boolean;
};

export async function saveHomepage(
  input: HomepageInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Paid benefit: certified badge holders only (PRD 5.2).
  const { data: certified } = await supabase
    .from("member_badges")
    .select("badge_types!inner(code)")
    .eq("profile_id", user.id)
    .eq("badge_types.code", BADGE_CODES.CERTIFIED);
  if (!certified?.length) return { error: "certified" };

  const slug = input.slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(slug)) return { error: "slug" };

  const { error } = await supabase.from("mini_homepages").upsert({
    profile_id: user.id,
    slug,
    intro_en: input.introEn,
    intro_ko: input.introKo || null,
    cover_image_path: input.coverImagePath,
    doc_paths: input.docPaths,
    gallery_paths: input.galleryPaths,
    cert_paths: input.certPaths,
    custom_domain: input.customDomain.trim() || null,
    is_published: input.isPublished,
  });
  if (error) {
    return { error: error.code === "23505" ? "slug_taken" : "save" };
  }

  revalidatePath(`/c/${slug}`);
  revalidatePath("/dashboard/homepage");
  return {};
}
