"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/signup", "/reset", "/verify"];

export function RouteChrome({
  children,
  hideOnAdmin = false,
}: {
  children: React.ReactNode;
  hideOnAdmin?: boolean;
}) {
  const pathname = usePathname();
  if (AUTH_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return null;
  }
  if (hideOnAdmin && (pathname === "/admin" || pathname.startsWith("/admin/"))) {
    return null;
  }
  return children;
}
