import { notFound, redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { createInquiry } from "@/app/actions/inquiries";

export default async function NewInquiryPage(props: {
  searchParams: Promise<{ post?: string; error?: string }>;
}) {
  const params = await props.searchParams;
  const session = await getSession();
  if (!session.userId) redirect(`/login?next=/inquiries/new?post=${params.post ?? ""}`);
  if (!params.post) notFound();

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);
  const { data: post } = await supabase
    .from("posts")
    .select("id, title_en, author_id")
    .eq("id", params.post)
    .maybeSingle();
  if (!post || post.author_id === session.userId) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-extrabold">{t.inquiry.newInquiry}</h1>
      <p className="rounded-lg bg-surface-sub/60 px-3 py-2 text-sm font-semibold text-ink-soft">
        {post.title_en}
      </p>
      <p className="text-xs text-ink-faint">{t.inquiry.stepHint}</p>

      {params.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {t.common.error}
        </p>
      )}

      <form action={createInquiry} className="space-y-3">
        <input type="hidden" name="postId" value={post.id} />
        <label className="block">
          <span className="text-xs font-semibold text-ink-soft">
            {t.inquiry.yourMessage}
          </span>
          <textarea
            name="body"
            rows={8}
            required
            className="mt-1 w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:bg-primary-strong"
        >
          {t.inquiry.send}
        </button>
      </form>
    </div>
  );
}
