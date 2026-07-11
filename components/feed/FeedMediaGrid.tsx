import Image from "next/image";
import Link from "next/link";
import { postMediaUrl } from "@/lib/media";

export function FeedMediaGrid({
  paths,
  href,
  label,
}: {
  paths: string[];
  href: string;
  label: string;
}) {
  if (!paths.length) return null;
  const visible = paths.slice(0, 4);
  const extra = Math.max(0, paths.length - visible.length);
  const layout =
    visible.length === 1
      ? "grid-cols-1 aspect-[16/10]"
      : visible.length === 2
        ? "grid-cols-2 aspect-[16/9]"
        : visible.length === 3
          ? "grid-cols-[2fr_1fr] grid-rows-2 aspect-[16/10]"
          : "grid-cols-[2fr_1fr] grid-rows-3 aspect-[16/10]";

  return (
    <div className={`grid gap-0.5 overflow-hidden bg-line ${layout}`}>
      {visible.map((path, index) => {
        const featured = visible.length >= 3 && index === 0;
        return (
          <Link
            href={href}
            key={`${path}-${index}`}
            aria-label={label}
            className={`relative min-h-0 bg-surface-sub ${featured && visible.length === 3 ? "row-span-2" : ""} ${featured && visible.length === 4 ? "row-span-3" : ""}`}
          >
            <Image
              src={postMediaUrl(path)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 680px"
              className="object-cover"
            />
            {extra > 0 && index === visible.length - 1 && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-3xl font-extrabold text-white backdrop-blur-[1px]">
                +{extra}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
