"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKETS } from "@/lib/constants";

// Identity/company documents for badge applications. Files land in the
// private badge-docs bucket (owner + admin only, PRD 3.1 / 9); the storage
// paths travel with the surrounding form via a hidden input.
export function BadgeDocsUploader({
  userId,
  label,
  removeLabel,
}: {
  userId: string;
  label: string;
  removeLabel: string;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  async function upload(files: FileList) {
    setUploading(true);
    const supabase = createClient();
    const added: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${userId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKETS.BADGE_DOCS)
        .upload(path, file);
      if (!error) added.push(path);
    }
    setUploading(false);
    setPaths((prev) => [...prev, ...added]);
  }

  return (
    <div>
      <input type="hidden" name="docPaths" value={JSON.stringify(paths)} />
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {paths.length > 0 && (
        <ul className="mt-2 space-y-1.5">
          {paths.map((path) => (
            <li
              key={path}
              className="flex items-center justify-between rounded-xl border border-line px-3 py-2 text-xs"
            >
              <span className="truncate">{path.split("/").pop()?.replace(/^[0-9a-f-]{36}-/, "")}</span>
              <button
                type="button"
                onClick={() => setPaths(paths.filter((p) => p !== path))}
                className="ml-2 shrink-0 font-bold text-ink-faint"
                aria-label={removeLabel}
              >
                X
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={(e) => e.target.files && upload(e.target.files)}
        className="mt-2 block w-full text-xs text-ink-soft file:mr-3 file:rounded-lg file:border-0 file:bg-surface-sub file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft"
      />
      {uploading && (
        <span className="mt-1 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}
