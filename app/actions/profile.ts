"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = String(formData.get("displayName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();

  // Public-safe fields; privileged columns are protected by the DB guard trigger.
  await supabase
    .from("profiles")
    .update({
      display_name: displayName || null,
      company_name: companyName || null,
      bio: bio || null,
    })
    .eq("id", user.id);

  // Sensitive contact data lives in its own RLS-guarded table (PRD 9).
  await supabase
    .from("profile_contacts")
    .update({
      phone: phone || null,
      contact_person: contactPerson || null,
    })
    .eq("profile_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard/profile?saved=1");
}
