"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import {
  savePost,
  type AttachmentInput,
  type PostInput,
  type SpecInput,
} from "@/app/actions/posts";
import { DiscardModal } from "@/components/ui/EditFormFrame";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { ImageDropzone } from "@/components/post/ImageDropzone";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS, BOARD_TYPES, type BoardType } from "@/lib/constants";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/constants";
import type { SpecFieldDef } from "@/lib/types";

type CategoryOption = { id: string; name_en: string; name_ko: string };

type Props = {
  t: Dictionary;
  locale: Locale;
  userId: string;
  menuSlug: string;
  boardType: BoardType;
  fieldPool: SpecFieldDef[];
  categories: CategoryOption[];
  maxFileMb: number;
  maxFiles: number;
  quota?: { used: number; limit: number } | null;
  autosave: boolean;
  initial?: {
    postId: string;
    titleEn: string;
    titleKo: string;
    bodyEn: string;
    bodyKo: string;
    categoryId: string | null;
    deadline: string;
    repVideoUrl: string;
    repIsVideo: boolean;
    repImagePath: string | null;
    imagePaths: string[];
    attachments: AttachmentInput[];
    specs: SpecInput[];
  };
};

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-line/70 bg-white p-5 shadow-(--shadow-card) sm:p-6">
      <h2 className="text-xs font-bold uppercase tracking-[.14em] text-primary">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-semibold text-ink">
      {children}
    </span>
  );
}

const inputCls =
  "w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus-visible:ring-4 focus-visible:ring-primary/10";

export function PostComposer({
  t,
  locale,
  userId,
  menuSlug,
  boardType,
  fieldPool,
  categories,
  maxFileMb,
  maxFiles,
  quota,
  autosave,
  initial,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty = useRef(false);
  const cancelHref = "/dashboard/posts";

  const [titleEn, setTitleEn] = useState(initial?.titleEn ?? "");
  const [titleKo, setTitleKo] = useState(initial?.titleKo ?? "");
  const [bodyEn, setBodyEn] = useState(initial?.bodyEn ?? "");
  const [bodyKo, setBodyKo] = useState(initial?.bodyKo ?? "");
  const [bilingual, setBilingual] = useState(
    !!(initial?.titleKo || initial?.bodyKo),
  );
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.categoryId ?? null,
  );
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.repVideoUrl ?? "");
  const [repIsVideo, setRepIsVideo] = useState(initial?.repIsVideo ?? false);
  const [images, setImages] = useState<string[]>(initial?.imagePaths ?? []);
  const [repImage, setRepImage] = useState<string | null>(
    initial?.repImagePath ?? null,
  );
  const [specs, setSpecs] = useState<SpecInput[]>(initial?.specs ?? []);
  const [attachments, setAttachments] = useState<AttachmentInput[]>(
    initial?.attachments ?? [],
  );
  const savedPostId = useRef<string | undefined>(initial?.postId);
  const [autoSavedAt, setAutoSavedAt] = useState<string | null>(null);

  const bodyText = stripHtml(bodyEn);
  const valid = titleEn.trim().length > 0 && bodyText.length > 0;
  const quotaBlocked = !!quota && !initial?.postId && quota.used >= quota.limit;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty.current && !pending) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pending]);

  function markDirty() {
    dirty.current = true;
  }

  async function uploadFiles(files: FileList) {
    setError(null);
    if (images.length + files.length > maxFiles) {
      setError(t.common.error);
      return;
    }
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    for (const raw of Array.from(files)) {
      const file = await compressImage(raw);
      if (file.size > maxFileMb * 1024 * 1024) continue;
      const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKETS.POST_MEDIA)
        .upload(path, file);
      if (!upErr) uploaded.push(path);
    }
    setUploading(false);
    setImages((prev) => {
      const next = [...prev, ...uploaded];
      if (!repImage && next.length) setRepImage(next[0]);
      return next;
    });
    markDirty();
  }

  function removeImage(path: string) {
    setImages((prev) => prev.filter((p) => p !== path));
    if (repImage === path) {
      setRepImage(images.find((p) => p !== path) ?? null);
    }
    markDirty();
  }

  function buildInput(asDraft: boolean): PostInput {
    return {
      menuSlug,
      titleEn,
      titleKo,
      bodyEn,
      bodyKo,
      categoryId,
      deadline: boardType === BOARD_TYPES.REQUEST ? deadline || null : null,
      repVideoUrl: videoUrl,
      repIsVideo,
      imagePaths: images,
      repImagePath: repImage,
      attachments,
      specs: specs.filter((s) => s.nameEn && s.value),
      asDraft,
      postId: savedPostId.current,
    };
  }

  useEffect(() => {
    if (!autosave) return;
    const timer = setInterval(async () => {
      if (!dirty.current || pending || uploading || !titleEn) return;
      const result = await savePost(buildInput(true));
      if (result.postId) {
        savedPostId.current = result.postId;
        dirty.current = false;
        setAutoSavedAt(new Date().toTimeString().slice(0, 5));
      }
    }, 30_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- interval reads latest state via closure re-created on each render cycle of deps below
  }, [autosave, pending, uploading, titleEn, titleKo, bodyEn, bodyKo, categoryId, deadline, videoUrl, repIsVideo, images, repImage, attachments, specs]);

  function submit(asDraft: boolean) {
    setError(null);
    if (!asDraft && !valid) {
      setError(t.post.submitHint);
      return;
    }
    const input = buildInput(asDraft);
    startTransition(async () => {
      const result = await savePost(input);
      if (result.error === "limit") {
        setError(t.post.postLimitReached);
        return;
      }
      if (result.error) {
        setError(t.common.error);
        return;
      }
      dirty.current = false;
      router.push(`/dashboard/posts?toast=${asDraft ? "draftSaved" : "submitted"}`);
    });
  }

  const showCategory = categories.length > 0 && boardType !== BOARD_TYPES.NOTICE;
  const showSpecs = boardType !== BOARD_TYPES.NOTICE;
  const previewCover = repImage ?? images[0] ?? null;
  const previewTitle =
    (locale === "ko" && titleKo ? titleKo : titleEn) || "";
  const previewCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <div className="min-w-0 space-y-5">
        {quota && !initial?.postId && (
          <p
            className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold ${
              quotaBlocked
                ? "bg-negative-soft text-negative"
                : "bg-surface-sub text-ink-soft"
            }`}
          >
            {quotaBlocked
              ? t.post.quotaBlocked
              : t.post.quotaLine
                  .replace("{used}", String(quota.used))
                  .replace("{limit}", String(quota.limit))}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl bg-negative-soft px-3.5 py-2.5 text-xs font-semibold text-negative">
            {error}
          </p>
        )}

        <Section title={t.post.sectionBasics}>
          <label className="block">
            <FieldLabel>
              {t.post.titleEn} ({t.common.required})
            </FieldLabel>
            <input
              value={titleEn}
              onChange={(e) => {
                setTitleEn(e.target.value);
                markDirty();
              }}
              required
              className={inputCls}
            />
          </label>
          {bilingual && (
            <label className="block">
              <FieldLabel>{t.post.titleKo}</FieldLabel>
              <input
                value={titleKo}
                onChange={(e) => {
                  setTitleKo(e.target.value);
                  markDirty();
                }}
                className={inputCls}
              />
            </label>
          )}
          {showCategory && (
            <label className="block">
              <FieldLabel>
                {t.post.category} ({t.common.optional})
              </FieldLabel>
              <select
                value={categoryId ?? ""}
                onChange={(e) => {
                  setCategoryId(e.target.value || null);
                  markDirty();
                }}
                className={inputCls}
              >
                <option value="" />
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {locale === "ko" ? category.name_ko : category.name_en}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            onClick={() => {
              setBilingual((v) => !v);
              markDirty();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary-strong"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {bilingual ? <path d="M5 12h14" /> : <path d="M12 5v14M5 12h14" />}
            </svg>
            {bilingual ? t.post.hideKorean : t.post.addKorean}
          </button>
        </Section>

        <Section title={t.post.sectionContent}>
          <div>
            <FieldLabel>
              {t.post.bodyEn} ({t.common.required})
            </FieldLabel>
            <RichTextEditor
              value={bodyEn}
              onChange={(html) => {
                setBodyEn(html);
                markDirty();
              }}
              userId={userId}
              labels={t.editor}
              maxFileMb={maxFileMb}
            />
          </div>
          {bilingual && (
            <div>
              <FieldLabel>{t.post.bodyKo}</FieldLabel>
              <RichTextEditor
                value={bodyKo}
                onChange={(html) => {
                  setBodyKo(html);
                  markDirty();
                }}
                userId={userId}
                labels={t.editor}
                maxFileMb={maxFileMb}
              />
            </div>
          )}
        </Section>

        {boardType === BOARD_TYPES.REQUEST && (
          <Section title={t.post.sectionRequest}>
            <label className="block">
              <FieldLabel>
                {t.post.deadline} ({t.common.optional})
              </FieldLabel>
              <input
                type="date"
                value={deadline}
                onChange={(e) => {
                  setDeadline(e.target.value);
                  markDirty();
                }}
                className={`${inputCls} sm:max-w-xs`}
              />
            </label>
          </Section>
        )}

        <Section title={t.post.sectionMedia}>
          <div>
            <FieldLabel>{t.post.images}</FieldLabel>
            <ImageDropzone
              images={images}
              repImage={repImage}
              uploading={uploading}
              onFiles={uploadFiles}
              onRemove={removeImage}
              onSetCover={(path) => {
                setRepImage(path);
                markDirty();
              }}
              toUrl={postMediaUrl}
              labels={{
                drop: t.post.dropImages,
                uploading: t.common.loading,
                cover: t.post.cover,
                setCover: t.post.setCover,
                remove: t.common.delete,
              }}
            />
          </div>

          <div>
            <FieldLabel>{t.post.attachFiles}</FieldLabel>
            {attachments.length > 0 && (
              <ul className="mb-2 space-y-1.5">
                {attachments.map((file) => (
                  <li
                    key={file.path}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line px-3 py-2 text-xs"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachments(attachments.filter((f) => f.path !== file.path));
                        markDirty();
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-faint hover:bg-negative-soft hover:text-negative"
                      aria-label={t.common.delete}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface-sub/40 px-4 py-3 text-xs font-semibold text-ink-soft transition-colors hover:border-primary/50 hover:bg-surface-sub">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t.post.dropAttachments}
              <input
                type="file"
                accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx,.zip"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = e.target.files;
                  if (!files) return;
                  setUploading(true);
                  const supabase = createClient();
                  const added: AttachmentInput[] = [];
                  for (const file of Array.from(files)) {
                    if (file.size > maxFileMb * 1024 * 1024) continue;
                    const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
                    const { error: upErr } = await supabase.storage
                      .from(STORAGE_BUCKETS.ATTACHMENTS)
                      .upload(path, file);
                    if (!upErr) added.push({ path, name: file.name, size: file.size });
                  }
                  setUploading(false);
                  setAttachments((prev) => [...prev, ...added]);
                  markDirty();
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <label className="block">
            <FieldLabel>{t.post.videoUrl}</FieldLabel>
            <input
              value={videoUrl}
              onChange={(e) => {
                setVideoUrl(e.target.value);
                markDirty();
              }}
              placeholder="https://youtube.com/..."
              className={inputCls}
            />
            {videoUrl.trim() && (
              <span className="mt-2 flex items-center gap-2 text-xs font-semibold text-ink-soft">
                <input
                  type="checkbox"
                  checked={repIsVideo}
                  onChange={(e) => {
                    setRepIsVideo(e.target.checked);
                    markDirty();
                  }}
                  className="h-4 w-4 rounded border-line accent-[var(--color-primary)]"
                />
                {t.post.useVideoAsRep}
              </span>
            )}
          </label>
        </Section>

        {showSpecs && (
          <Section title={t.post.specs}>
            {specs.length > 0 && (
              <div className="space-y-2">
                {specs.map((spec, i) => (
                  <div key={i} className="flex gap-2">
                    {spec.fieldDefId ? (
                      <input
                        readOnly
                        value={locale === "ko" && spec.nameKo ? spec.nameKo : spec.nameEn}
                        className="w-2/5 rounded-xl border border-line bg-surface-sub/60 px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        value={spec.nameEn}
                        onChange={(e) => {
                          const next = [...specs];
                          next[i] = { ...spec, nameEn: e.target.value };
                          setSpecs(next);
                          markDirty();
                        }}
                        placeholder={t.post.specName}
                        className="w-2/5 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    )}
                    <input
                      value={spec.value}
                      onChange={(e) => {
                        const next = [...specs];
                        next[i] = { ...spec, value: e.target.value };
                        setSpecs(next);
                        markDirty();
                      }}
                      placeholder={t.post.specValue}
                      className="flex-1 rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setSpecs(specs.filter((_, j) => j !== i))}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-sub text-ink-faint hover:bg-negative-soft hover:text-negative"
                      aria-label={t.common.delete}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <select
                onChange={(e) => {
                  const def = fieldPool.find((f) => f.id === e.target.value);
                  if (def) {
                    setSpecs([
                      ...specs,
                      {
                        fieldDefId: def.id,
                        nameEn: def.name_en,
                        nameKo: def.name_ko,
                        value: "",
                      },
                    ]);
                    markDirty();
                  }
                  e.target.value = "";
                }}
                defaultValue=""
                className="rounded-xl border border-line px-3 py-2 text-xs font-semibold text-ink-soft"
              >
                <option value="" disabled>
                  {t.post.selectFromPool}
                </option>
                {fieldPool.map((f) => (
                  <option key={f.id} value={f.id}>
                    {locale === "ko" ? f.name_ko : f.name_en}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setSpecs([
                    ...specs,
                    { fieldDefId: null, nameEn: "", nameKo: null, value: "" },
                  ])
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface-sub px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-primary-soft hover:text-primary-strong"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                {t.post.customField}
              </button>
            </div>
          </Section>
        )}

        {/* Sticky action bar: always reachable, always shows what is missing */}
        <div className="sticky bottom-0 z-10 rounded-2xl border border-line bg-white/95 p-3 shadow-[0_-8px_24px_rgba(25,31,40,.06)] backdrop-blur sm:p-3.5">
          <div className="mb-2 flex min-h-4 items-center justify-between gap-3 text-xs">
            <span className="text-ink-faint">
              {autoSavedAt ? `${t.post.autoSaved} · ${autoSavedAt}` : ""}
            </span>
            {!valid && !quotaBlocked && (
              <span className="text-ink-faint">{t.post.submitHint}</span>
            )}
          </div>
          <div className="grid gap-2 sm:grid-cols-[auto_1fr_1.4fr]">
            <button
              type="button"
              disabled={pending || uploading}
              onClick={() => {
                if (dirty.current) setDiscardOpen(true);
                else router.push(cancelHref);
              }}
              className="btn-secondary btn-md disabled:opacity-50"
            >
              {t.common.cancel}
            </button>
            <button
              type="button"
              disabled={pending || uploading}
              onClick={() => submit(true)}
              className="btn-secondary btn-md disabled:opacity-50"
            >
              {t.post.saveDraft}
            </button>
            <button
              type="button"
              disabled={pending || uploading || quotaBlocked}
              onClick={() => submit(false)}
              className={`btn-md inline-flex items-center justify-center gap-2 rounded-xl px-4 font-bold text-white transition-colors ${
                valid ? "bg-primary hover:bg-primary-strong" : "bg-primary/45"
              } disabled:opacity-50`}
            >
              {pending && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {t.post.submitForReview}
            </button>
          </div>
        </div>
      </div>

      {/* Live preview rail */}
      <aside className="xl:sticky xl:top-24">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-ink-faint">
          {t.post.livePreview}
        </p>
        <div className="overflow-hidden rounded-[1.35rem] border border-line/70 bg-white shadow-(--shadow-card)">
          <div className="relative aspect-[4/3] bg-surface-sub">
            {previewCover ? (
              <Image src={postMediaUrl(previewCover)} alt="" fill sizes="320px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-ink-faint">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </div>
            )}
          </div>
          <div className="p-4">
            {previewCategory && (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-primary">
                {locale === "ko" ? previewCategory.name_ko : previewCategory.name_en}
              </p>
            )}
            <p className={`truncate text-sm font-bold ${previewTitle ? "text-ink" : "text-ink-faint"}`}>
              {previewTitle || t.post.titleEn}
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-faint">
              {bodyText || t.post.previewPlaceholder}
            </p>
          </div>
        </div>
      </aside>

      <DiscardModal
        open={discardOpen}
        discardTitle={t.common.discardTitle}
        discardBody={t.common.discardBody}
        discardConfirm={t.common.discardConfirm}
        keepEditing={t.common.keepEditing}
        onKeep={() => setDiscardOpen(false)}
        onDiscard={() => {
          dirty.current = false;
          router.push(cancelHref);
        }}
      />
    </div>
  );
}
