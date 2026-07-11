"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function applyForBadge(formData: FormData) {
  const badgeTypeId = String(formData.get("badgeTypeId") ?? "");
  const companyInfo = String(formData.get("companyInfo") ?? "").trim();

  let docPaths: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("docPaths") ?? "[]"));
    if (Array.isArray(parsed)) {
      docPaths = parsed.filter((p): p is string => typeof p === "string");
    }
  } catch {
    docPaths = [];
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Documents must live under the applicant's own folder (bucket RLS).
  await supabase.from("badge_applications").insert({
    profile_id: user.id,
    badge_type_id: badgeTypeId,
    company_info: companyInfo ? { note: companyInfo } : {},
    document_paths: docPaths.filter((p) => p.startsWith(`${user.id}/`)),
  });

  revalidatePath("/dashboard/badges");
  redirect("/dashboard/badges?toast=submitted");
}
