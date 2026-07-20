"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { createFeedComment } from "@/app/actions/feed";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { CommentSubmitButton } from "@/components/feed/CommentSubmitButton";
import { randomId } from "@/lib/random-id";

// Requested member feature: a quick reaction palette for comments.
const EMOJIS = [
  "\u{1F44D}", "\u{1F64F}", "\u{1F44F}", "\u{1F4AA}", "\u{1F91D}", "\u{1F389}",
  "\u{1F600}", "\u{1F60A}", "\u{1F604}", "\u{1F602}", "\u{1F60E}", "\u{1F914}",
  "\u{2764}\u{FE0F}", "\u{1F525}", "\u{2B50}", "\u{2705}", "\u{1F4A1}", "\u{1F440}",
  "\u{1F680}", "\u{1F4E6}", "\u{1F3ED}", "\u{1F6A2}", "\u{2708}\u{FE0F}", "\u{1F30F}",
];

export function CommentComposer({
  postId,
  parentId,
  returnTo,
  userId,
  autoFocus = false,
  initialBody = "",
  onSubmitted,
  labels,
}: {
  postId: string;
  parentId?: string;
  returnTo: string;
  userId: string;
  autoFocus?: boolean;
  initialBody?: string;
  onSubmitted?: () => void;
  labels: {
    placeholder: string;
    submit: string;
    addImage: string;
    addEmoji: string;
    removeImage: string;
    uploadError: string;
  };
}) {
  const [body, setBody] = useState(initialBody);
  const [mediaPath, setMediaPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const caretInitialized = useRef(false);

  async function upload(raw: File) {
    setUploading(true);
    setError("");
    const file = await compressImage(raw);
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${userId}/feed-comment-${randomId()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .upload(path, file, { cacheControl: "31536000" });
    if (uploadError) setError(labels.uploadError);
    else setMediaPath(path);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function insertEmoji(emoji: string) {
    const element = textarea.current;
    if (!element) {
      setBody((current) => current + emoji);
      return;
    }
    const start = element.selectionStart ?? body.length;
    const end = element.selectionEnd ?? body.length;
    const next = body.slice(0, start) + emoji + body.slice(end);
    setBody(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + emoji.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await createFeedComment(formData);
        setBody("");
        setMediaPath(null);
        setEmojiOpen(false);
        onSubmitted?.();
      }}
      className="relative"
    >
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <input type="hidden" name="returnTo" value={returnTo} />
      <input
        type="hidden"
        name="media"
        value={JSON.stringify(mediaPath ? [mediaPath] : [])}
      />

      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface-sub transition focus-within:border-primary/50">
          <textarea
            ref={textarea}
            name="body"
            required={!mediaPath}
            maxLength={800}
            rows={parentId ? 1 : 2}
            autoFocus={autoFocus}
            value={body}
            onFocus={(event) => {
              // Prefilled mentions should continue at the end, not the start.
              if (caretInitialized.current) return;
              caretInitialized.current = true;
              const end = event.currentTarget.value.length;
              event.currentTarget.setSelectionRange(end, end);
            }}
            onChange={(event) => setBody(event.target.value)}
            placeholder={labels.placeholder}
            className="plain-input min-h-11 w-full resize-y bg-transparent px-4 pt-3 text-sm leading-6"
          />
          {mediaPath && (
            <div className="relative mx-3 mb-3 mt-1 inline-block">
              <Image
                src={postMediaUrl(mediaPath)}
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => setMediaPath(null)}
                aria-label={labels.removeImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex items-center gap-1 px-2 pb-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
            />
            <button
              type="button"
              disabled={uploading || !!mediaPath}
              onClick={() => fileInput.current?.click()}
              aria-label={labels.addImage}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-line/60 hover:text-ink-soft disabled:opacity-40"
            >
              {uploading ? (
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setEmojiOpen((value) => !value)}
              aria-label={labels.addEmoji}
              aria-expanded={emojiOpen}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-line/60 hover:text-ink-soft"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" x2="9.01" y1="9" y2="9" />
                <line x1="15" x2="15.01" y1="9" y2="9" />
              </svg>
            </button>
          </div>
          {emojiOpen && (
            <div className="grid grid-cols-8 gap-0.5 border-t border-line/70 px-2 py-2">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-base transition-colors hover:bg-white"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <CommentSubmitButton label={labels.submit} />
      </div>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-bold text-negative">
          {error}
        </p>
      )}
    </form>
  );
}
