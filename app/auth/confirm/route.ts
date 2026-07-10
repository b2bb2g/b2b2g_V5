import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { PW_RESET_COOKIE } from "@/lib/constants";

// Email verification / recovery landing: exchanges the token for a session.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      if (type === "recovery") {
        // Lock navigation to the reset screen until a new password is saved.
        const store = await cookies();
        store.set(PW_RESET_COOKIE, "1", {
          path: "/",
          maxAge: 3600,
          httpOnly: true,
          sameSite: "lax",
        });
        redirect("/reset/update");
      }
      redirect(next.startsWith("/") ? next : "/dashboard");
    }
  }

  // Token already consumed or expired: show a dedicated message, not a
  // credentials error.
  redirect("/login?error=link");
}
