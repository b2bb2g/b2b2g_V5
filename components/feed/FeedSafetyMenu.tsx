import { reportFeedPost, blockFeedMember } from "@/app/actions/feed";
import { PendingButton } from "@/components/ui/PendingButton";
import { ConfirmSubmit } from "@/components/ui/ConfirmSubmit";

export function FeedSafetyMenu({
  postId,
  authorId,
  returnTo,
  labels,
}: {
  postId: string;
  authorId: string;
  returnTo: string;
  labels: {
    menu: string;
    report: string;
    reportReason: string;
    reportDetails: string;
    spam: string;
    misleading: string;
    abuse: string;
    other: string;
    block: string;
    blockTitle: string;
    blockBody: string;
    cancel: string;
  };
}) {
  return (
    <details className="group relative">
      <summary
        aria-label={labels.menu}
        className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-lg font-bold text-ink-faint transition hover:bg-surface-sub hover:text-ink [&::-webkit-details-marker]:hidden"
      >
        ···
      </summary>
      <div className="absolute right-0 top-11 z-30 w-72 rounded-2xl border border-line bg-white p-3 shadow-(--shadow-float)">
        <form action={reportFeedPost} className="space-y-2">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <p className="text-xs font-extrabold">{labels.report}</p>
          <select name="reason" aria-label={labels.reportReason} className="field py-2 text-xs">
            <option value="spam">{labels.spam}</option>
            <option value="misleading">{labels.misleading}</option>
            <option value="abuse">{labels.abuse}</option>
            <option value="other">{labels.other}</option>
          </select>
          <textarea
            name="details"
            maxLength={500}
            rows={2}
            placeholder={labels.reportDetails}
            className="field text-xs"
          />
          <PendingButton className="w-full rounded-xl bg-surface-sub px-3 py-2 text-xs font-bold text-ink-soft">
            {labels.report}
          </PendingButton>
        </form>
        <form action={blockFeedMember} className="mt-2 border-t border-line pt-2">
          <input type="hidden" name="targetId" value={authorId} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <ConfirmSubmit
            label={labels.block}
            confirmTitle={labels.blockTitle}
            confirmBody={labels.blockBody}
            confirmLabel={labels.block}
            cancelLabel={labels.cancel}
            className="w-full rounded-xl px-3 py-2 text-xs font-bold text-negative hover:bg-negative-soft"
            destructive
          />
        </form>
      </div>
    </details>
  );
}
