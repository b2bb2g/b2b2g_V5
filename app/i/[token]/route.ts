import { redirect } from "next/navigation";

// Short invite alias: /i/<token> forwards to the signup flow, which validates
// and consumes the token. Keeps shared invitation links compact; older
// /signup?invite=<token> links keep working unchanged.
export async function GET(
  _request: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  if (token && /^[A-Za-z0-9_-]{1,256}$/.test(token)) {
    redirect(`/signup?invite=${encodeURIComponent(token)}`);
  }
  redirect("/signup");
}
