import type { SupabaseClient } from "@supabase/supabase-js";
import { STORAGE_BUCKETS } from "@/lib/constants";

// Inquiry attachments live in a PRIVATE bucket, so they are never reachable by a
// public URL. A viewer receives a signed URL only for the paths the inquiry-media
// read policy allows (own uploads; a message they may read — own always, the
// other side only once forwarded; admins and referring coordinators). Paths the
// caller may not read come back without a signedUrl and are dropped.
export async function signInquiryMedia(
  supabase: SupabaseClient,
  paths: string[] | null | undefined,
): Promise<string[]> {
  if (!paths || paths.length === 0) return [];
  const { data } = await supabase.storage
    .from(STORAGE_BUCKETS.INQUIRY_MEDIA)
    .createSignedUrls(paths, 60 * 60);
  return (data ?? [])
    .map((entry) => entry.signedUrl)
    .filter((url): url is string => Boolean(url));
}
