"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

type OpenImage = { src: string; alt: string } | null;

export function RichContentViewer({
  html,
  title,
  closeLabel,
  className = "",
}: {
  html: string;
  title: string;
  closeLabel: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openImage, setOpenImage] = useState<OpenImage>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll("img").forEach((image) => {
      image.tabIndex = 0;
      image.setAttribute("role", "button");
      image.setAttribute(
        "aria-label",
        image.alt ? `${image.alt} — ${title}` : title,
      );
    });
  }, [html, title]);

  useEffect(() => {
    if (!openImage) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenImage(null);
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus();
    };
  }, [openImage]);

  const openTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLImageElement) || !target.src) return;
    openerRef.current = target;
    setOpenImage({ src: target.src, alt: target.alt || title });
  };

  return (
    <>
      <div
        ref={containerRef}
        className={className}
        onClick={(event) => openTarget(event.target)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (!(event.target instanceof HTMLImageElement)) return;
          event.preventDefault();
          openTarget(event.target);
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {openImage &&
        createPortal(
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={openImage.alt}
            className="fixed inset-0 z-[200] flex flex-col bg-[#05070a]"
            onClick={() => setOpenImage(null)}
          >
            <div className="relative z-20 flex justify-end p-4 sm:p-6">
              <button
                ref={closeRef}
                type="button"
                aria-label={closeLabel}
                onClick={() => setOpenImage(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div
              className="relative min-h-0 flex-1"
              onClick={(event) => event.stopPropagation()}
            >
              <Image
                src={openImage.src}
                alt={openImage.alt}
                fill
                sizes="100vw"
                className="object-contain p-4 sm:p-10"
                priority
              />
            </div>
            {openImage.alt && (
              <p className="relative z-20 px-6 pb-5 text-center text-sm text-white/70">
                {openImage.alt}
              </p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
