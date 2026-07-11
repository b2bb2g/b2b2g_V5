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

  const [{ data: profile }, { data: badges }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("member_badges")
      .select("badge_type_id, badge_types(*)")
      .eq("profile_id", user.id),
  ]);

  const typedProfile = (profile as Profile) ?? null;

  // Last-seen heartbeat (PRD 17.2), refreshed at most hourly.
  if (
    typedProfile &&
    (!typedProfile.last_seen_at ||
      Date.parse(typedProfile.last_seen_at) < Date.now() - 3600_000)
  ) {
    await supabase
      .from("profiles")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  return {
    userId: user.id,
    profile: typedProfile,
    badges: (badges as unknown as MemberBadge[]) ?? [],
  };
});
