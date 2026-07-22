"use client";

import { useEffect, useRef, useState } from "react";
import { replyInquiry } from "@/app/actions/inquiries";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { PendingButton } from "@/components/ui/PendingButton";
import { randomId } from "@/lib/random-id";

// Frequently-used replies, kept on the device (traders repeat the same
// quotes/greetings across threads).
const TEMPLATE_KEY = "b2bb2g:inquiry-templates";
const TEMPLATE_MAX = 5;

function readTemplates(): string[] {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(TEMPLATE_KEY) ?? "[]",
    ) as string[];
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string").slice(0, TEMPLATE_MAX)
      : [];
  } catch {
    return [];
  }
}

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
    templates: string;
    saveTemplate: string;
    noTemplates: string;
    removeTemplate: string;
  };
}) {
  // Track a local object-URL per upload so the preview never has to read the
  // private bucket back; only the paths are submitted with the form.
  const [items, setItems] = useState<{ path: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<string[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setTemplates(readTemplates()), 0);
    return () => clearTimeout(timer);
  }, []);

  const persistTemplates = (next: string[]) => {
    setTemplates(next);
    try {
      window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(next));
    } catch {
      // Device storage is best-effort only.
    }
  };

  const saveCurrentAsTemplate = () => {
    const value = textarea.current?.value.trim();
    if (!value) return;
    persistTemplates(
      [value, ...templates.filter((item) => item !== value)].slice(
        0,
        TEMPLATE_MAX,
      ),
    );
  };

  const insertTemplate = (value: string) => {
    const element = textarea.current;
    if (!element) return;
    element.value = element.value.trim()
      ? `${element.value.trimEnd()}\n${value}`
      : value;
    setTemplatesOpen(false);
    element.focus();
    const end = element.value.length;
    element.setSelectionRange(end, end);
  };

  async function upload(raw: File) {
    setUploading(true);
    setError("");
    const file = await compressImage(raw);
    const supabase = createClient();
    const safeName = file.name.replace(/[^\w.-]+/g, "_");
    const path = `${userId}/inquiry-${randomId()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.INQUIRY_MEDIA)
      .upload(path, file, { cacheControl: "31536000" });
    if (uploadError) setError(labels.uploadError);
    else
      setItems((current) =>
        [...current, { path, url: URL.createObjectURL(file) }].slice(0, 2),
      );
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <div>
      <form action={replyInquiry} className="flex items-end gap-2">
        <input type="hidden" name="inquiryId" value={inquiryId} />
        <input
          type="hidden"
          name="media"
          value={JSON.stringify(items.map((item) => item.path))}
        />
        <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface-sub transition focus-within:border-primary/50">
          <textarea
            ref={textarea}
            name="body"
            rows={2}
            required
            placeholder={labels.placeholder}
            className="plain-input min-h-11 w-full resize-y bg-transparent px-4 pt-2.5 text-sm leading-6"
          />
          {items.length > 0 && (
            <div className="flex gap-2 px-3 pb-2">
              {items.map(({ path, url }) => (
                <span key={path} className="relative inline-block">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ephemeral local blob preview, never a remote asset */}
                  <img
                    src={url}
                    alt=""
                    width={72}
                    height={72}
                    className="h-18 w-18 rounded-xl border border-line object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setItems((current) => {
                        URL.revokeObjectURL(url);
                        return current.filter((item) => item.path !== path);
                      })
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
              disabled={uploading || items.length >= 2}
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
              onClick={() => setTemplatesOpen((value) => !value)}
              aria-expanded={templatesOpen}
              aria-label={labels.templates}
              title={labels.templates}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-line/60 hover:text-ink-soft"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h9" />
              </svg>
            </button>
          </div>
          {templatesOpen && (
            <div className="border-t border-line/70 px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-extrabold text-ink-soft">
                  {labels.templates}
                </p>
                <button
                  type="button"
                  onClick={saveCurrentAsTemplate}
                  className="rounded-full px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-primary-soft"
                >
                  ＋ {labels.saveTemplate}
                </button>
              </div>
              {templates.length === 0 ? (
                <p className="mt-1.5 text-xs text-ink-faint">
                  {labels.noTemplates}
                </p>
              ) : (
                <ul className="mt-1.5 space-y-1">
                  {templates.map((template) => (
                    <li key={template} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => insertTemplate(template)}
                        className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-ink-soft transition-colors hover:bg-white hover:text-ink"
                      >
                        {template}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          persistTemplates(
                            templates.filter((item) => item !== template),
                          )
                        }
                        aria-label={labels.removeTemplate}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-negative-soft hover:text-negative"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="m6 6 12 12M18 6 6 18" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
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
