"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

// Referral QR code (PRD 16.2): rendered on demand into a canvas.
export function ReferralQr({ value, label }: { value: string; label: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (open && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, { width: 180, margin: 1 }).catch(
        () => {}
      );
    }
  }, [open, value]);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary btn-sm"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <div className="mt-3 inline-block rounded-xl border border-line bg-white p-2">
          <canvas ref={canvasRef} aria-label={label} />
        </div>
      )}
    </div>
  );
}
