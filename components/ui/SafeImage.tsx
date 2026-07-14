"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

// next/image that degrades to the branded placeholder when the file fails to
// load (a broken or missing storage path), instead of leaving a blank grey box.
export function SafeImage({ alt = "", ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MediaPlaceholder />;
  return <Image alt={alt} {...props} onError={() => setFailed(true)} />;
}
