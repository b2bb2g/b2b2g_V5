"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/signup", "/reset", "/verify"];

export function RouteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }
  return children;
}
