"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";

// Neutral soft-gradient stand-in shown while the real file streams in, so
// image tiles never pop from empty grey to content.
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef0f4"/><stop offset="1" stop-color="#e2e5eb"/></linearGradient></defs><rect width="16" height="16" fill="url(#g)"/></svg>',
  );

// next/image that degrades to the branded placeholder when the file fails to
// load (a broken or missing storage path), instead of leaving a blank grey box.
export function SafeImage({ alt = "", ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);
  if (failed) return <MediaPlaceholder />;
  return (
    <Image
      alt={alt}
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
      {...props}
      onError={() => setFailed(true)}
    />
  );
}
