"use client";

import { useEffect } from "react";
import { markInquiryRead } from "@/app/actions/inquiries";

// Fires once the thread is actually on screen (not on link prefetch), marking
// this inquiry's delivered/returned notifications read so the badge drops.
export function InquiryReadMarker({ inquiryId }: { inquiryId: string }) {
  useEffect(() => {
    markInquiryRead(inquiryId);
  }, [inquiryId]);
  return null;
}
