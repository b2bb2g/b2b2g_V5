import "server-only";

// Keep privileged credentials confined to these public Auth operations. Database,
// storage, session refresh and all other requests retain the user's credentials.
export function createCaptchaBypassFetch(
  supabaseUrl: string,
  serviceKey: string,
  baseFetch: typeof fetch = fetch,
): typeof fetch {
  const origin = new URL(supabaseUrl).origin;
  return async (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);
    const allowed = ["/auth/v1/signup", "/auth/v1/recover", "/auth/v1/resend"].includes(url.pathname)
      || (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "password");
    if (request.method === "POST" && url.origin === origin && allowed) {
      request.headers.set("apikey", serviceKey);
      request.headers.set("Authorization", `Bearer ${serviceKey}`);
      return baseFetch(request, { redirect: "error" });
    }
    return baseFetch(request);
  };
}
