"use client";

import { useRef, useState } from "react";
import Image from "next/image";

// Modern image uploader: a click/drag dropzone plus a thumbnail grid where the
// cover is chosen with an explicit badge (no hidden tooltip) and each image has
// an icon remove. Upload happens in the parent via onFiles.
export function ImageDropzone({
  images,
  repImage,
  uploading,
  onFiles,
  onRemove,
  onSetCover,
  toUrl,
  labels,
}: {
  images: string[];
  repImage: string | null;
  uploading: boolean;
  onFiles: (files: FileList) => void;
  onRemove: (path: string) => void;
  onSetCover: (path: string) => void;
  toUrl: (path: string) => string;
  labels: {
    drop: string;
    uploading: string;
    cover: string;
    setCover: string;
    remove: string;
  };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
        }}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging
            ? "border-primary bg-primary-soft/50"
            : "border-line bg-surface-sub/40 hover:border-primary/50 hover:bg-surface-sub"
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
            <path d="M20 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2" />
          </svg>
        </span>
        <span className="text-sm font-semibold text-ink-soft">
          {uploading ? labels.uploading : labels.drop}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((path) => {
            const isCover = repImage === path;
            return (
              <div
                key={path}
                className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                  isCover ? "border-primary" : "border-transparent"
                }`}
              >
                <Image src={toUrl(path)} alt="" fill sizes="120px" className="object-cover" />
                {isCover ? (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    {labels.cover}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSetCover(path)}
                    className="absolute inset-x-1.5 bottom-1.5 rounded-lg bg-black/55 py-1 text-[10px] font-bold text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                  >
                    {labels.setCover}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(path)}
                  aria-label={labels.remove}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-negative group-hover:opacity-100"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
