"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { saveHomepage, type HomepageInput } from "@/app/actions/homepage";
import { DiscardModal } from "@/components/ui/EditFormFrame";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { ClearableInput } from "@/components/ui/TextField";
import type { Dictionary } from "@/lib/i18n";

type Doc = { path: string; name: string };

type Props = {
  t: Dictionary;
  userId: string;
  initial: {
    slug: string;
    introEn: string;
    introKo: string;
    coverImagePath: string | null;
    docPaths: Doc[];
    galleryPaths: string[];
    certPaths: Doc[];
    customDomain: string;
    isPublished: boolean;
  };
  // Admin reuse: alternate save action and return location.
  save?: (input: HomepageInput) => Promise<{ error?: string }>;
  doneHref?: string;
};

export function HomepageEditor({ t, userId, initial, save, doneHref }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const dirty = useRef(false);
  const cancelHref = doneHref ?? "/dashboard/homepage";

  const [slug, setSlug] = useState(initial.slug);
  const [introEn, setIntroEn] = useState(initial.introEn);
  const [introKo, setIntroKo] = useState(initial.introKo);
  const [cover, setCover] = useState<string | null>(initial.coverImagePath);
  const [docs, setDocs] = useState<Doc[]>(initial.docPaths);
  const [gallery, setGallery] = useState<string[]>(initial.galleryPaths);
  const [certs, setCerts] = useState<Doc[]>(initial.certPaths);
  const [customDomain, setCustomDomain] = useState(initial.customDomain);
  const [isPublished, setIsPublished] = useState(initial.isPublished);

  async function upload(raw: File, prefix: string): Promise<string | null> {
    const file = await compressImage(raw);
    const supabase = createClient();
    const path = `${userId}/${prefix}-${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error: upErr } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .upload(path, file);
    return upErr ? null : path;
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await (save ?? saveHomepage)({
        slug,
        introEn,
        introKo,
        coverImagePath: cover,
        docPaths: docs,
        galleryPaths: gallery,
        certPaths: certs,
        customDomain,
        isPublished,
      });
      if (result.error) {
        setError(result.error === "slug" || result.error === "slug_taken"
          ? t.homepage.slugHint
          : t.common.error);
        return;
      }
      router.push(`${cancelHref}?toast=saved`);
      router.refresh();
    });
  }

  const inputCls =
    "mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary";

  return (
    <div
      className="space-y-4"
      onInput={() => {
        dirty.current = true;
      }}
    >
      {error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {error}
        </p>
      )}

      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.slug}</span>
        <div className="mt-1">
          <ClearableInput
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-company"
            clearLabel={t.common.clearInput}
          />
        </div>
        <p className="mt-1 text-xs text-ink-faint">{t.homepage.slugHint}</p>
      </label>

      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.introEn}</span>
        <textarea
          value={introEn}
          onChange={(e) => setIntroEn(e.target.value)}
          rows={6}
          className={inputCls}
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.introKo}</span>
        <textarea
          value={introKo}
          onChange={(e) => setIntroKo(e.target.value)}
          rows={4}
          className={inputCls}
        />
      </label>

      <div>
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.cover}</span>
        {cover && (
          <div className="relative mt-2 aspect-video overflow-hidden rounded-card bg-surface-sub">
            <Image src={postMediaUrl(cover)} alt="" fill sizes="512px" className="object-cover" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            const path = await upload(file, "cover");
            setUploading(false);
            if (path) setCover(path);
          }}
          className="mt-2 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft"
        />
      </div>

      <div>
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.gallery}</span>
        {gallery.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {gallery.map((path) => (
              <div key={path} className="relative aspect-square overflow-hidden rounded-xl bg-surface-sub">
                <Image src={postMediaUrl(path)} alt="" fill sizes="160px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setGallery(gallery.filter((g) => g !== path))}
                  aria-label={t.common.delete}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-bold text-white"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={async (e) => {
            const files = e.target.files;
            if (!files) return;
            setUploading(true);
            const added: string[] = [];
            for (const file of Array.from(files)) {
              const path = await upload(file, "gallery");
              if (path) added.push(path);
            }
            setUploading(false);
            setGallery((prev) => [...prev, ...added]);
          }}
          className="mt-2 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft"
        />
      </div>

      <div>
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.certificates}</span>
        {certs.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {certs.map((doc) => (
              <li
                key={doc.path}
                className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-xs"
              >
                <span className="truncate">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => setCerts(certs.filter((d) => d.path !== doc.path))}
                  className="ml-2 shrink-0 font-bold text-ink-faint"
                  aria-label={t.common.delete}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          onChange={async (e) => {
            const files = e.target.files;
            if (!files) return;
            setUploading(true);
            const added: Doc[] = [];
            for (const file of Array.from(files)) {
              const path = await upload(file, "cert");
              if (path) added.push({ path, name: file.name });
            }
            setUploading(false);
            setCerts((prev) => [...prev, ...added]);
          }}
          className="mt-2 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft"
        />
      </div>

      <div>
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.docs}</span>
        {docs.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {docs.map((doc) => (
              <li
                key={doc.path}
                className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-xs"
              >
                <span className="truncate">{doc.name}</span>
                <button
                  type="button"
                  onClick={() => setDocs(docs.filter((d) => d.path !== doc.path))}
                  className="ml-2 shrink-0 font-bold text-ink-faint"
                  aria-label={t.common.delete}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          onChange={async (e) => {
            const files = e.target.files;
            if (!files) return;
            setUploading(true);
            const added: Doc[] = [];
            for (const file of Array.from(files)) {
              const path = await upload(file, "doc");
              if (path) added.push({ path, name: file.name });
            }
            setUploading(false);
            setDocs((prev) => [...prev, ...added]);
          }}
          className="mt-2 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft"
        />
      </div>

      <label className="block">
        <span className="text-xs font-semibold text-ink-soft">{t.homepage.customDomain}</span>
        <div className="mt-1">
          <ClearableInput
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="www.example.com"
            clearLabel={t.common.clearInput}
          />
        </div>
        <p className="mt-1 text-xs text-ink-faint">{t.homepage.customDomainHint}</p>
      </label>

      <label className="flex items-center gap-2 py-1 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded accent-primary"
        />
        {t.homepage.publish}
      </label>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          disabled={pending || uploading}
          onClick={() => {
            if (dirty.current) setDiscardOpen(true);
            else router.push(cancelHref);
          }}
          className="flex-1 rounded-xl bg-surface-sub px-4 py-3 text-sm font-semibold text-ink-soft disabled:opacity-50"
        >
          {t.common.cancel}
        </button>
        <button
          type="button"
          disabled={pending || uploading || !slug || !introEn}
          onClick={submit}
          className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong disabled:opacity-50"
        >
          {pending || uploading ? (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-middle" />
          ) : (
            t.common.save
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
        onDiscard={() => router.push(cancelHref)}
      />
    </div>
  );
}
