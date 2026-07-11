"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/imageCompress";
import { postMediaUrl } from "@/lib/media";
import { STORAGE_BUCKETS } from "@/lib/constants";
import { DefaultAvatar } from "@/components/profile/DefaultAvatar";

// Avatar register/change/remove inside the profile edit form. The chosen
// storage path travels with the form via a hidden input.
export function AvatarUploader({
  userId,
  name,
  initialPath,
  changeLabel,
  removeLabel,
}: {
  userId: string;
  name: string;
  initialPath: string | null;
  changeLabel: string;
  removeLabel: string;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(raw: File) {
    setUploading(true);
    const file = await compressImage(raw);
    const supabase = createClient();
    const storagePath = `${userId}/avatar-${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.POST_MEDIA)
      .upload(storagePath, file);
    setUploading(false);
    if (!error) setPath(storagePath);
  }

  return (
    <div className="flex items-center gap-4">
      <input type="hidden" name="avatarPath" value={path ?? ""} />
      {path ? (
        <Image
          src={postMediaUrl(path)}
          alt={name}
          width={72}
          height={72}
          className="h-18 w-18 rounded-full object-cover"
        />
      ) : (
        <DefaultAvatar className="h-18 w-18" editable />
      )}
      <div className="flex flex-col gap-1.5">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
          className="btn-secondary btn-sm"
        >
          {uploading ? (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            changeLabel
          )}
        </button>
        {path && (
          <button
            type="button"
            onClick={() => setPath(null)}
            className="btn-danger btn-sm"
          >
            {removeLabel}
          </button>
        )}
      </div>
    </div>
  );
}
