"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Pinch-to-zoom / double-tap / pan surface for the fullscreen viewers.
// Two pointers pinch; one pointer pans while zoomed; double-tap toggles.
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 280;

export function ZoomableImage({
  src,
  alt,
  onZoomChange,
  onDismiss,
  overlay,
  onLoad,
  loaded = true,
}: {
  src: string;
  alt: string;
  /** Reports zoom state so parents can pause swipe navigation. */
  onZoomChange?: (zoomed: boolean) => void;
  /** Swipe-down (while not zoomed) dismisses, matching SNS viewers. */
  onDismiss?: () => void;
  overlay?: ReactNode;
  onLoad?: () => void;
  loaded?: boolean;
}) {
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{
    distance: number;
    scale: number;
    x: number;
    y: number;
    midX: number;
    midY: number;
  } | null>(null);
  const panStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const lastTap = useRef(0);
  const dismissStart = useRef<{ x: number; y: number } | null>(null);
  const [interacting, setInteracting] = useState(false);
  const zoomed = transform.scale > 1.01;

  useEffect(() => {
    onZoomChange?.(zoomed);
  }, [zoomed, onZoomChange]);

  // New image: reset (deferred a tick; effects must not set state directly).
  useEffect(() => {
    const timer = setTimeout(() => {
      setTransform({ scale: 1, x: 0, y: 0 });
      pointers.current.clear();
      pinchStart.current = null;
      panStart.current = null;
    }, 0);
    return () => clearTimeout(timer);
  }, [src]);

  function clamp(next: { scale: number; x: number; y: number }, rect: DOMRect) {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale));
    const maxX = (rect.width * (scale - 1)) / 2;
    const maxY = (rect.height * (scale - 1)) / 2;
    return {
      scale,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  return (
    <div
      className="relative h-full w-full touch-none select-none overflow-hidden"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        setInteracting(true);
        pointers.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        const points = [...pointers.current.values()];
        if (points.length === 2) {
          const [a, b] = points;
          pinchStart.current = {
            distance: Math.hypot(a.x - b.x, a.y - b.y),
            scale: transform.scale,
            x: transform.x,
            y: transform.y,
            midX: (a.x + b.x) / 2,
            midY: (a.y + b.y) / 2,
          };
          panStart.current = null;
        } else if (points.length === 1) {
          if (!zoomed && onDismiss) {
            dismissStart.current = { x: event.clientX, y: event.clientY };
          }
          if (zoomed) {
            panStart.current = {
              x: event.clientX,
              y: event.clientY,
              tx: transform.x,
              ty: transform.y,
            };
          }
          const now = Date.now();
          if (now - lastTap.current < DOUBLE_TAP_MS) {
            const rect = event.currentTarget.getBoundingClientRect();
            setTransform((current) =>
              current.scale > 1.01
                ? { scale: 1, x: 0, y: 0 }
                : clamp(
                    {
                      scale: 2.5,
                      x: (rect.width / 2 - (event.clientX - rect.left)) * 1.5,
                      y: (rect.height / 2 - (event.clientY - rect.top)) * 1.5,
                    },
                    rect,
                  ),
            );
            lastTap.current = 0;
          } else {
            lastTap.current = now;
          }
        }
      }}
      onPointerMove={(event) => {
        if (!pointers.current.has(event.pointerId)) return;
        pointers.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY,
        });
        const rect = event.currentTarget.getBoundingClientRect();
        const points = [...pointers.current.values()];
        if (points.length === 2 && pinchStart.current) {
          const [a, b] = points;
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          const ratio = distance / pinchStart.current.distance;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          setTransform(
            clamp(
              {
                scale: pinchStart.current.scale * ratio,
                x: pinchStart.current.x + (midX - pinchStart.current.midX),
                y: pinchStart.current.y + (midY - pinchStart.current.midY),
              },
              rect,
            ),
          );
        } else if (points.length === 1 && panStart.current) {
          // Capture the guarded value: the setTransform updater runs async, by
          // which point a racing pointerup may have cleared panStart.current
          // (that null deref was the "reading 'tx'" crash).
          const pan = panStart.current;
          setTransform((current) =>
            clamp(
              {
                scale: current.scale,
                x: pan.tx + (event.clientX - pan.x),
                y: pan.ty + (event.clientY - pan.y),
              },
              rect,
            ),
          );
        }
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        if (pointers.current.size < 2) pinchStart.current = null;
        const start = dismissStart.current;
        if (pointers.current.size === 0) {
          panStart.current = null;
          dismissStart.current = null;
          setInteracting(false);
        }
        if (
          start &&
          !zoomed &&
          onDismiss &&
          event.clientY - start.y > 90 &&
          Math.abs(event.clientY - start.y) >
            Math.abs(event.clientX - start.x) * 1.2
        ) {
          onDismiss();
          return;
        }
        setTransform((current) =>
          current.scale <= 1.05 ? { scale: 1, x: 0, y: 0 } : current,
        );
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        pinchStart.current = null;
        panStart.current = null;
        dismissStart.current = null;
        setInteracting(false);
      }}
    >
      <div
        className="h-full w-full will-change-transform"
        style={{
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
          transition: interacting ? "none" : "transform 180ms ease-out",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          onLoad={onLoad}
          className={`pointer-events-none object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
          loading="eager"
        />
      </div>
      {overlay}
    </div>
  );
}
