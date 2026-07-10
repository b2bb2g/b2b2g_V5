"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function applyForBadge(formData: FormData) {
  const badgeTypeId = String(formData.get("badgeTypeId") ?? "");
  const companyInfo = String(formData.get("companyInfo") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("badge_applications").insert({
    profile_id: user.id,
    badge_type_id: badgeTypeId,
    company_info: companyInfo ? { note: companyInfo } : {},
  });

  revalidatePath("/dashboard/badges");
  redirect("/dashboard/badges");
}
