"use client";

// Client-side downscale before upload: caps the longest edge and re-encodes,
// cutting storage and bandwidth without any server-side dependency.
const MAX_EDGE = 1600;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = MAX_EDGE / Math.max(bitmap.width, bitmap.height);
    // Small files that already fit need no re-encode.
    if (scale >= 1 && file.size < 1_000_000) {
      bitmap.close();
      return file;
    }

    const width = Math.round(bitmap.width * Math.min(1, scale));
    const height = Math.round(bitmap.height * Math.min(1, scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}
