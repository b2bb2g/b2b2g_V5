"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { createFeedPost, updateFeedPost } from "@/app/actions/feed";
import { PendingButton } from "@/components/ui/PendingButton";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";
import { randomId } from "@/lib/random-id";

export function FeedComposer({
  userId,
  uid,
  avatarPath,
  postId,
  initialBody = "",
  initialMedia = [],
  labels,
}: {
  userId: string;
  uid: number | null;
  avatarPath: string | null;
  postId?: string;
  initialBody?: string;
  initialMedia?: string[];
  labels: {
    placeholder: string;
    addPhotos: string;
    publishing: string;
    publish: string;
    save: string;
    remove: string;
    uploadError: string;
    moveEarlier: string;
    moveLater: string;
  };
}) {
  const [paths, setPaths] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // The first image fronts the post everywhere, so ordering is content.
  const move = (index: number, direction: -1 | 1) => {
    setPaths((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  async function upload(files: FileList) {
    const available = Math.max(0, 10 - paths.length);
    const selected = Array.from(files).slice(0, available);
    if (!selected.length) return;
    setUploading(true);
    setError("");
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const raw of selected) {
      const file = await compressImage(raw);
      const safeName = file.name.replace(/[^\w.-]+/g, "_");
      const path = `${userId}/feed-${randomId()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.POST_MEDIA)
        .upload(path, file, { cacheControl: "31536000" });
      if (uploadError) {
        setError(labels.uploadError);
        break;
      }
      uploaded.push(path);
    }
    setPaths((current) => [...current, ...uploaded].slice(0, 10));
    setUploading(false);
    if (input.current) input.current.value = "";
  }

  return (
    <form
      action={postId ? updateFeedPost : createFeedPost}
      className="rounded-[1.5rem] border border-line/80 bg-white p-4 shadow-(--shadow-card) sm:p-5"
    >
      {postId && <input type="hidden" name="postId" value={postId} />}
      <input type="hidden" name="mediaPaths" value={JSON.stringify(paths)} />
      <div className="flex items-start gap-3">
        {avatarPath ? (
          <Image
            src={postMediaUrl(avatarPath)}
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 shrink-0 rounded-full border border-line object-cover"
          />
        ) : (
          <DefaultAvatar className="h-12 w-12" />
        )}
        <div className="min-w-0 flex-1">
          {uid && (
            <p className="px-1 text-xs font-extrabold text-ink-soft">
              UID:{uid}
            </p>
          )}
          <textarea
            name="body"
            required
            maxLength={2000}
            rows={postId ? 8 : 3}
            defaultValue={initialBody}
            placeholder={labels.placeholder}
            className="mt-1 w-full resize-y border-0 bg-transparent px-1 py-1 text-[15px] leading-7 text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      {paths.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {paths.map((path, index) => (
            <div
              key={path}
              className="relative aspect-square overflow-hidden rounded-xl bg-surface-sub"
            >
              <Image
                src={postMediaUrl(path)}
                alt=""
                fill
                sizes="160px"
                className="object-cover"
              />
              <button
                type="button"
                aria-label={labels.remove}
                onClick={() =>
                  setPaths((current) => current.filter((item) => item !== path))
                }
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-sm text-white backdrop-blur"
              >
                ×
              </button>
              <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 text-[10px] font-bold leading-5 text-white backdrop-blur">
                {index + 1}
              </span>
              {paths.length > 1 && (
                <span className="absolute inset-x-1.5 bottom-1.5 flex justify-between">
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label={labels.moveEarlier}
                    onClick={() => move(index, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition disabled:opacity-30"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    disabled={index === paths.length - 1}
                    aria-label={labels.moveLater}
                    onClick={() => move(index, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition disabled:opacity-30"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs font-semibold text-negative">{error}</p>
      )}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => event.target.files && upload(event.target.files)}
        />
        <button
          type="button"
          disabled={uploading || paths.length >= 10}
          onClick={() => input.current?.click()}
          className="btn-secondary btn-md"
        >
          {uploading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <>
              ＋ {labels.addPhotos}{" "}
              {paths.length > 0 ? `(${paths.length}/10)` : ""}
            </>
          )}
        </button>
        <PendingButton
          pendingLabel={labels.publishing}
          disabled={uploading}
          className="btn-primary btn-md"
        >
          {postId ? labels.save : labels.publish}
        </PendingButton>
      </div>
    </form>
  );
}
