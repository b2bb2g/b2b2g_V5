import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SESSION_ONLY_COOKIE } from "@/lib/constants";

// Strips persistence so the cookie lives only until the browser closes
// ("keep me signed in" unchecked).
function asSessionCookie(options: CookieOptions | undefined): CookieOptions {
  const finalOptions = { ...(options ?? {}) };
  delete finalOptions.maxAge;
  delete finalOptions.expires;
  return finalOptions;
}

export async function createClient(opts?: { sessionOnly?: boolean }) {
  const cookieStore = await cookies();
  const sessionOnly =
    opts?.sessionOnly ??
    cookieStore.get(SESSION_ONLY_COOKIE)?.value === "1";

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(
                name,
                value,
                sessionOnly ? asSessionCookie(options) : options
              )
            );
          } catch {
            // Called from a Server Component: session refresh is handled by proxy.ts.
          }
        },
      },
    }
  );
}
