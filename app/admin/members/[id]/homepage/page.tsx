import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { HomepageEditor } from "@/components/homepage/HomepageEditor";
import { saveHomepageAdmin } from "@/app/actions/admin";

// Admin editor for a member's mini homepage (PRD 17.2). The admin layout
// already gates this route to admins.
export default async function AdminMemberHomepagePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [{ t }, session, supabase] = await Promise.all([
    getT(),
    getSession(),
    createClient(),
  ]);
  if (!session.userId) notFound();

  const [{ data: member }, { data: homepage }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, uid, display_name, company_name")
      .eq("id", id)
      .maybeSingle(),
    supabase.from("mini_homepages").select("*").eq("profile_id", id).maybeSingle(),
  ]);
  if (!member) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-base font-bold">
        {t.admin.miniHomepage}
        <span className="ml-2 text-xs font-normal text-ink-faint">
          {member.company_name ?? member.display_name} · {t.admin.uid} {member.uid}
        </span>
      </h2>
      <HomepageEditor
        t={t}
        userId={member.id}
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
        save={saveHomepageAdmin.bind(null, id)}
        doneHref={`/admin/members/${id}`}
      />
    </div>
  );
}
