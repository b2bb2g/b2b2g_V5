"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { savePost, type PostInput, type SpecInput } from "@/app/actions/posts";
import { DiscardModal } from "@/components/ui/EditFormFrame";
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
  initial?: {
    postId: string;
    titleEn: string;
    titleKo: string;
    bodyEn: string;
    bodyKo: string;
    categoryId: string | null;
    deadline: string;
    repVideoUrl: string;
    repImagePath: string | null;
    imagePaths: string[];
    specs: SpecInput[];
  };
};

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
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.categoryId ?? null
  );
  const [deadline, setDeadline] = useState(initial?.deadline ?? "");
  const [videoUrl, setVideoUrl] = useState(initial?.repVideoUrl ?? "");
  const [images, setImages] = useState<string[]>(initial?.imagePaths ?? []);
  const [repImage, setRepImage] = useState<string | null>(
    initial?.repImagePath ?? null
  );
  const [specs, setSpecs] = useState<SpecInput[]>(initial?.specs ?? []);

  // Leave-warning while composing (PRD 7.3 / 14).
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
    for (const file of Array.from(files)) {
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

  function submit(asDraft: boolean) {
    setError(null);
    const input: PostInput = {
      menuSlug,
      titleEn,
      titleKo,
      bodyEn,
      bodyKo,
      categoryId,
      deadline: boardType === BOARD_TYPES.REQUEST ? deadline || null : null,
      repVideoUrl: videoUrl,
      imagePaths: images,
      repImagePath: repImage,
      specs: specs.filter((s) => s.nameEn && s.value),
      asDraft,
      postId: initial?.postId,
    };
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
      router.push("/dashboard/posts");
    });
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">
            {t.post.titleEn} ({t.common.required})
          </span>
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
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">{t.post.titleKo}</span>
          <input
            value={titleKo}
            onChange={(e) => {
              setTitleKo(e.target.value);
              markDirty();
            }}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">
            {t.post.bodyEn} ({t.common.required})
          </span>
          <textarea
            value={bodyEn}
            onChange={(e) => {
              setBodyEn(e.target.value);
              markDirty();
            }}
            rows={8}
            required
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">{t.post.bodyKo}</span>
          <textarea
            value={bodyKo}
            onChange={(e) => {
              setBodyKo(e.target.value);
              markDirty();
            }}
            rows={8}
            className={inputCls}
          />
        </label>
      </div>

      {/* Category selection: data accumulates from day one (PRD 6.6) */}
      {categories.length > 0 && boardType !== BOARD_TYPES.NOTICE && (
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">
            {t.post.category} ({t.common.optional})
          </span>
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

      {boardType === BOARD_TYPES.REQUEST && (
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">
            {t.post.deadline} ({t.common.optional})
          </span>
          <input
            type="date"
            value={deadline}
            onChange={(e) => {
              setDeadline(e.target.value);
              markDirty();
            }}
            className={inputCls}
          />
        </label>
      )}

      <div>
        <span className="text-xs font-semibold text-ink-soft">{t.post.images}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="mt-1 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft"
        />
        {uploading && (
          <p className="mt-1 text-xs text-ink-faint">{t.common.loading}</p>
        )}
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((path) => (
              <button
                key={path}
                type="button"
                onClick={() => {
                  setRepImage(path);
                  markDirty();
                }}
                className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 ${
                  repImage === path ? "border-primary" : "border-transparent"
                }`}
                title={t.post.repMedia}
              >
                <Image
                  src={postMediaUrl(path)}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">{t.post.videoUrl}</span>
        <input
          value={videoUrl}
          onChange={(e) => {
            setVideoUrl(e.target.value);
            markDirty();
          }}
          placeholder="https://youtube.com/..."
          className={inputCls}
        />
      </label>

      {boardType !== BOARD_TYPES.NOTICE && (
        <div>
          <span className="text-xs font-semibold text-ink-soft">{t.post.specs}</span>
          <div className="mt-1 space-y-2">
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
                  className="rounded-xl bg-surface-sub px-3 text-xs font-bold text-ink-faint"
                  aria-label={t.common.delete}
                >
                  X
                </button>
              </div>
            ))}
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
                className="rounded-xl bg-surface-sub px-3 py-2 text-xs font-semibold text-ink-soft"
              >
                {t.post.customField}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          disabled={pending || uploading}
          onClick={() => {
            if (dirty.current) setDiscardOpen(true);
            else router.push(cancelHref);
          }}
          className="rounded-xl bg-surface-sub px-4 py-3 text-sm font-semibold text-ink-soft disabled:opacity-50"
        >
          {t.common.cancel}
        </button>
        <button
          type="button"
          disabled={pending || uploading}
          onClick={() => submit(true)}
          className="flex-1 rounded-xl bg-surface-sub px-4 py-3 text-sm font-bold text-ink-soft disabled:opacity-50"
        >
          {t.post.saveDraft}
        </button>
        <button
          type="button"
          disabled={pending || uploading || !titleEn || !bodyEn}
          onClick={() => submit(false)}
          className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
          ) : (
            t.post.submitForReview
          )}
        </button>
      </div>

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
