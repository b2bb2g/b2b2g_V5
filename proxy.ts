import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { PW_RESET_COOKIE, SESSION_ONLY_COOKIE } from "@/lib/constants";

// "Keep me signed in" unchecked: token refreshes must not re-persist cookies.
function asSessionCookie(options: CookieOptions | undefined): CookieOptions {
  const finalOptions = { ...(options ?? {}) };
  delete finalOptions.maxAge;
  delete finalOptions.expires;
  return finalOptions;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const sessionOnly =
    request.cookies.get(SESSION_ONLY_COOKIE)?.value === "1";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(
              name,
              value,
              sessionOnly ? asSessionCookie(options) : options
            )
          );
        },
      },
    }
  );

  // Refresh the auth token if needed; required for Server Components.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Recovery session gate: a fresh password must be saved before anything else.
  const pwResetPending = request.cookies.get(PW_RESET_COOKIE)?.value === "1";
  if (
    user &&
    pwResetPending &&
    path !== "/reset/update" &&
    !path.startsWith("/auth") &&
    !path.startsWith("/api")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/reset/update";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // The password update screen exists only for recovery-link sessions;
  // signed-in visitors without a pending reset are sent home.
  if (path.startsWith("/reset/update") && user && !pwResetPending) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path.startsWith("/reset/update");
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
