import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { createInquiry } from "@/app/actions/inquiries";

// Compose an inquiry about a post (?post=) or a company (?to=, from mini
// homepages). Both go through the same mediated review flow.
export default async function NewInquiryPage(props: {
  searchParams: Promise<{ post?: string; to?: string; error?: string }>;
}) {
  const params = await props.searchParams;
  const target = params.post
    ? `post=${params.post}`
    : params.to
      ? `to=${params.to}`
      : "";
  const session = await getSession();
  if (!session.userId) redirect(`/login?next=/inquiries/new?${target}`);
  if (!params.post && !params.to) notFound();

  const [{ t }, supabase] = await Promise.all([getT(), createClient()]);

  let heading = "";
  if (params.post) {
    const { data: post } = await supabase
      .from("posts")
      .select("id, title_en, author_id")
      .eq("id", params.post)
      .maybeSingle();
    if (!post || post.author_id === session.userId) notFound();
    heading = post.title_en;
  } else {
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, company_name, display_name")
      .eq("id", params.to!)
      .maybeSingle();
    if (!recipient || recipient.id === session.userId) notFound();
    heading = recipient.company_name ?? recipient.display_name ?? "";
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader title={t.inquiry.newInquiry} subtitle={t.inquiry.stepHint} />
      <p className="rounded-lg bg-surface-sub/60 px-3 py-2 text-sm font-semibold text-ink-soft">
        {heading}
      </p>
            {params.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-xs font-semibold text-negative">
          {t.common.error}
        </p>
      )}

      <form action={createInquiry} className="space-y-3">
        {params.post && <input type="hidden" name="postId" value={params.post} />}
        {params.to && <input type="hidden" name="toProfileId" value={params.to} />}
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
