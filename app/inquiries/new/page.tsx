import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { WorkspacePageHeader as PageHeader } from "@/components/dashboard/WorkspacePageHeader";
import { getT } from "@/lib/i18n/server";
import { getSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getPostTeaser } from "@/lib/data/posts";
import { createInquiry } from "@/app/actions/inquiries";
import { PendingButton } from "@/components/ui/PendingButton";
import { AuthorIdentity } from "@/components/marketplace/AuthorIdentity";
import { SafeImage } from "@/components/ui/SafeImage";
import { MediaPlaceholder } from "@/components/ui/MediaPlaceholder";
import { repThumbnail } from "@/lib/media";
import { BOARD_TYPES } from "@/lib/constants";

type PublicBadge = { code: string; name_en: string; name_ko: string };

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

  const [{ t, locale }, supabase] = await Promise.all([getT(), createClient()]);

  // Resolve the target into a consistent shape for the context card.
  let eyebrow = "";
  let title = "";
  let thumb: string | null = null;
  let section: string | null = null;
  let listingHref: string | null = null;
  let recipientUid: number | null = null;
  let recipientBadges: PublicBadge[] = [];
  let showRecipient = true;
  let cancelHref = "/inquiries";

  if (params.post) {
    const [{ data: post }, teaser] = await Promise.all([
      supabase
        .from("posts")
        .select(
          "author_id, menu_id, title_en, title_ko, rep_image_path, rep_video_url, rep_is_video",
        )
        .eq("id", params.post)
        .maybeSingle(),
      getPostTeaser(params.post),
    ]);
    if (!post || post.author_id === session.userId) notFound();
    const { data: menuRow } = await supabase
      .from("menus")
      .select("slug, title_en, board_type")
      .eq("id", post.menu_id)
      .maybeSingle();
    eyebrow = t.inquiry.aboutListing;
    title =
      locale === "ko" && post.title_ko ? post.title_ko : (post.title_en ?? "");
    thumb = repThumbnail(post);
    section = menuRow?.title_en ?? null;
    listingHref = menuRow?.slug ? `/${menuRow.slug}/${params.post}` : null;
    cancelHref = listingHref ?? "/inquiries";
    // Events are platform-curated: no author identity is exposed, here or on
    // the board, so the inquiry reads as reaching the operations team.
    showRecipient = menuRow?.board_type !== BOARD_TYPES.FLEXIBLE;
    recipientUid = teaser?.author_uid ?? null;
    recipientBadges = teaser?.author_badges ?? [];
    if (recipientUid == null) {
      const { data: pr } = await supabase
        .from("profiles")
        .select("uid")
        .eq("id", post.author_id)
        .maybeSingle();
      recipientUid = pr?.uid ?? null;
    }
  } else {
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id, uid, company_name")
      .eq("id", params.to!)
      .maybeSingle();
    if (!recipient || recipient.id === session.userId) notFound();
    eyebrow = t.inquiry.contactingCompany;
    title = recipient.company_name ?? `UID:${recipient.uid}`;
    recipientUid = recipient.uid;
    cancelHref = `/u/${recipient.uid}`;
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t.inquiry.newInquiry} subtitle={t.inquiry.stepHint} />

      {params.error && (
        <p className="rounded-xl bg-negative-soft px-4 py-3 text-sm font-semibold text-negative">
          {t.common.error}
        </p>
      )}

      {/* Who / what you're contacting */}
      <section className="rounded-[1.5rem] border border-line/80 bg-white p-5 shadow-(--shadow-card) sm:p-6">
        <p className="text-xs font-extrabold uppercase tracking-[.14em] text-primary">
          {eyebrow}
        </p>
        <div className="mt-4 flex items-center gap-4">
          <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-sub">
            {thumb ? (
              <SafeImage
                src={thumb}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <MediaPlaceholder />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-base font-extrabold leading-snug text-ink">
              {title}
            </strong>
            <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-faint">
              {section && (
                <span className="font-semibold text-ink-soft">{section}</span>
              )}
              {listingHref && (
                <>
                  {section && <span aria-hidden="true">·</span>}
                  <Link
                    href={listingHref}
                    className="font-bold text-primary hover:text-primary-strong"
                  >
                    {t.inquiry.viewListing} →
                  </Link>
                </>
              )}
            </span>
          </span>
        </div>
        {showRecipient && recipientUid != null && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4 text-sm">
            <span className="font-semibold text-ink-faint">
              {t.inquiry.recipient}
            </span>
            <AuthorIdentity
              uid={recipientUid}
              badges={recipientBadges}
              locale={locale}
              linked
            />
          </div>
        )}
      </section>

      {/* Message composer */}
      <form
        action={createInquiry}
        className="rounded-[1.5rem] border border-line/80 bg-white p-5 shadow-(--shadow-card) sm:p-6"
      >
        {params.post && (
          <input type="hidden" name="postId" value={params.post} />
        )}
        {params.to && (
          <input type="hidden" name="toProfileId" value={params.to} />
        )}
        <label htmlFor="inquiry-body" className="text-sm font-bold text-ink">
          {t.inquiry.yourMessage}
        </label>
        <textarea
          id="inquiry-body"
          name="body"
          rows={9}
          required
          placeholder={t.inquiry.messagePlaceholder}
          className="mt-2 w-full resize-y rounded-2xl border border-line bg-surface-sub/40 px-4 py-3.5 text-sm leading-6 text-ink outline-none transition placeholder:text-ink-faint focus:border-primary focus:bg-white focus-visible:ring-4 focus-visible:ring-primary/10"
        />
        <p className="mt-2 text-xs text-ink-faint">{t.inquiry.messageHint}</p>

        <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-primary-soft/50 px-4 py-3 text-xs font-semibold text-ink-soft">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-primary"
          >
            <path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
          {t.inquiry.reviewNote}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href={cancelHref} className="btn-secondary btn-lg">
            {t.common.cancel}
          </Link>
          <PendingButton className="btn-primary btn-lg sm:min-w-48">
            {t.inquiry.send}
          </PendingButton>
        </div>
      </form>
    </div>
  );
}
