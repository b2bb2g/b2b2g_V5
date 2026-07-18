"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function togglePostBookmark(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const postId = String(formData.get("postId") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/");
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!UUID.test(postId)) return;

  const { data: existing } = await supabase
    .from("post_bookmarks")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", user.id)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("post_bookmarks")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", user.id);
  } else {
    await supabase.from("post_bookmarks").insert({
      post_id: postId,
      profile_id: user.id,
    });
  }
  revalidatePath("/dashboard/bookmarks");
  if (returnTo.startsWith("/")) revalidatePath(returnTo);
}
