import { STORAGE_BUCKETS } from "@/lib/constants";

// Public bucket objects are addressed by URL; no listing/signing needed.
export function postMediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${STORAGE_BUCKETS.POST_MEDIA}/${path}`;
}

// Basic YouTube/Vimeo thumbnail extraction for video representative media
// (lists show a thumbnail; only the detail page embeds a player, PRD 6.8).
export function videoThumbnail(url: string): string | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
  return null;
}

export function videoEmbedUrl(url: string, autoplay: boolean): string | null {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/
  );
  if (yt) {
    // Muted autoplay is the browser-policy ceiling (PRD 7.2).
    const params = autoplay ? "?autoplay=1&mute=1" : "";
    return `https://www.youtube-nocookie.com/embed/${yt[1]}${params}`;
  }
  return null;
}
