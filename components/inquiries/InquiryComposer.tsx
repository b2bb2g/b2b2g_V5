"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { replyInquiry } from "@/app/actions/inquiries";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { PendingButton } from "@/components/ui/PendingButton";

// Reply composer with optional image attachments (max 2). Sending stays an
// explicit step and the message still passes review before delivery.
export function InquiryComposer({
  inquiryId,
  userId,
  labels,
}: {
  inquiryId: string;
  userId: string;
  labels: {
    placeholder: string;
    send: string;
    addImage: string;
    removeImage: string;
    uploadError: string;
    hint: string;
  };
}) {
  const [mediaPaths, setMediaPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(raw: File) {
    setUploading(true);
    setError("");
    const file = await compressImage(raw);
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${userId}/inquiry-${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .upload(path, file, { cacheControl: "31536000" });
    if (uploadError) setError(labels.uploadError);
    else setMediaPaths((current) => [...current, path].slice(0, 2));
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      <form action={replyInquiry} className="flex items-end gap-2">
        <input type="hidden" name="inquiryId" value={inquiryId} />
        <input type="hidden" name="media" value={JSON.stringify(mediaPaths)} />
        <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface-sub transition focus-within:border-primary/50">
          <textarea
            name="body"
            rows={2}
            required
            placeholder={labels.placeholder}
            className="plain-input min-h-11 w-full resize-y bg-transparent px-4 pt-2.5 text-sm leading-6"
          />
          {mediaPaths.length > 0 && (
            <div className="flex gap-2 px-3 pb-2">
              {mediaPaths.map((path) => (
                <span key={path} className="relative inline-block">
                  <Image
                    src={postMediaUrl(path)}
                    alt=""
                    width={72}
                    height={72}
                    className="h-18 w-18 rounded-xl border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setMediaPaths((current) =>
                        current.filter((item) => item !== path),
                      )
                    }
                    aria-label={labels.removeImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-white shadow"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center px-2 pb-2">
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
              disabled={uploading || mediaPaths.length >= 2}
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
          </div>
        </div>
        <PendingButton
          pendingLabel=""
          title={labels.send}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-colors hover:bg-primary-strong"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
          </svg>
          <span className="sr-only">{labels.send}</span>
        </PendingButton>
      </form>
      {error && (
        <p role="alert" className="mt-1.5 px-1 text-xs font-bold text-negative">
          {error}
        </p>
      )}
      <p className="mt-2 px-1 text-[11px] text-ink-faint">{labels.hint}</p>
    </div>
  );
}
