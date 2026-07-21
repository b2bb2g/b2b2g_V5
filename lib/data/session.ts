import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { MemberBadge, Profile } from "@/lib/types";

export type SessionInfo = {
  userId: string | null;
  profile: Profile | null;
  badges: MemberBadge[];
};

// Deduplicated per request: layout, header and pages all call this.
export const getSession = cache(async (): Promise<SessionInfo> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, profile: null, badges: [] };

  const [{ data: profile }, { data: priv }, { data: badges }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      // last_seen_at lives in the owner/admin-only profile_private table.
      supabase
        .from("profile_private")
        .select("last_seen_at")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase
        .from("member_badges")
        .select("badge_type_id, badge_types(*)")
        .eq("profile_id", user.id),
    ]);

  const lastSeen =
    (priv as { last_seen_at: string | null } | null)?.last_seen_at ?? null;
  const typedProfile = profile
    ? ({ ...(profile as Profile), last_seen_at: lastSeen } as Profile)
    : null;

  // Last-seen heartbeat (PRD 17.2), refreshed at most hourly.
  if (
    typedProfile &&
    (!lastSeen || Date.parse(lastSeen) < Date.now() - 3600_000)
  ) {
    await supabase
      .from("profile_private")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("profile_id", user.id);
  }

  return {
    userId: user.id,
    profile: typedProfile,
    badges: (badges as unknown as MemberBadge[]) ?? [],
  };
});
