import { redirect } from "next/navigation";
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
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-extrabold">
        {t.homepage.title}
        <span className="ml-2 text-sm font-semibold text-ink-faint">
          {homepage ? t.common.edit : t.common.add}
        </span>
      </h1>

      <HomepageEditor
        t={t}
        userId={session.userId}
        initial={{
          slug: homepage?.slug ?? "",
          introEn: homepage?.intro_en ?? "",
          introKo: homepage?.intro_ko ?? "",
          coverImagePath: homepage?.cover_image_path ?? null,
          docPaths: (homepage?.doc_paths as { path: string; name: string }[]) ?? [],
          customDomain: homepage?.custom_domain ?? "",
          isPublished: homepage?.is_published ?? false,
        }}
      />
    </div>
  );
}
