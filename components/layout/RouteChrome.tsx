"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/login", "/signup", "/reset", "/verify"];

export function RouteChrome({
  children,
  hideOnAdmin = false,
  hideOnHome = false,
}: {
  children: React.ReactNode;
  hideOnAdmin?: boolean;
  hideOnHome?: boolean;
}) {
  const pathname = usePathname();
  if (
    AUTH_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    )
  ) {
    return null;
  }
  if (
    hideOnAdmin &&
    (pathname === "/admin" || pathname.startsWith("/admin/"))
  ) {
    return null;
  }
  if (hideOnHome && pathname === "/") return null;
  return children;
}
