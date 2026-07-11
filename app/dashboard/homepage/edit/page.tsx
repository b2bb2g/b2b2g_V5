import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { HomepageEditor } from "@/components/homepage/HomepageEditor";
import { BADGE_CODES } from "@/lib/constants";

export default async function HomepageEditPage() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const certified = session.badges.some(
    (b) => b.badge_types?.code === BADGE_CODES.CERTIFIED
  );
  if (!certified) redirect("/dashboard/homepage");

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: homepage } = await supabase
    .from("mini_homepages")
    .select("*")
    .eq("profile_id", session.userId)
    .maybeSingle();

  return (
    <div className="space-y-4">
      <PageHeader title={t.homepage.title} subtitle={homepage ? t.common.edit : t.common.add} />

      <HomepageEditor
        t={t}
        userId={session.userId}
        initial={{
          slug: homepage?.slug ?? "",
          introEn: homepage?.intro_en ?? "",
          introKo: homepage?.intro_ko ?? "",
          coverImagePath: homepage?.cover_image_path ?? null,
          docPaths: (homepage?.doc_paths as { path: string; name: string }[]) ?? [],
          galleryPaths: (homepage?.gallery_paths as string[]) ?? [],
          certPaths: (homepage?.cert_paths as { path: string; name: string }[]) ?? [],
          customDomain: homepage?.custom_domain ?? "",
          isPublished: homepage?.is_published ?? false,
        }}
      />
    </div>
  );
}
