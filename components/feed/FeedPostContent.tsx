"use client";

import { useRef, useState } from "react";
import { ExpandableFeedText } from "@/components/feed/ExpandableFeedText";
import {
  FeedMediaGrid,
  type FeedMediaLabels,
} from "@/components/feed/FeedMediaGrid";
import { FeedPostFocusDialog } from "@/components/feed/FeedPostFocusDialog";
import type {
  FeedFocusEngagementData,
  FeedFocusLabels,
} from "@/components/feed/FeedFocusEngagement";

export function FeedPostContent({
  postId,
  body,
  paths,
  authorUid,
  avatarPath,
  createdAt,
  engagement,
  compact = false,
  detail = false,
  labels,
}: {
  postId: string;
  body: string;
  paths: string[];
  authorUid: string | number;
  avatarPath: string | null;
  createdAt: string;
  engagement: FeedFocusEngagementData & { followingAuthor: boolean };
  compact?: boolean;
  detail?: boolean;
  labels: FeedMediaLabels &
    FeedFocusLabels & { less: string; follow: string; following: string };
}) {
  const [textExpanded, setTextExpanded] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const openerRef = useRef<HTMLButtonElement | null>(null);
  const variant = detail ? "detail" : compact ? "compact" : "stream";

  const closeFocus = () => {
    setFocusOpen(false);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  };

  return (
    <>
      <ExpandableFeedText
        body={body}
        moreLabel={labels.more}
        lessLabel={labels.less}
        fullPostLabel={labels.fullPost}
        variant={variant}
        hasMedia={paths.length > 0}
        textExpanded={textExpanded}
        onTextExpandedChange={setTextExpanded}
        onOpenFocus={(trigger) => {
          if (detail) return;
          openerRef.current = trigger;
          setFocusOpen(true);
        }}
      />
      <FeedMediaGrid
        paths={paths}
        body={body}
        authorUid={authorUid}
        avatarPath={avatarPath}
        createdAt={createdAt}
        labels={labels}
      />
      {!detail && focusOpen && (
        <FeedPostFocusDialog
          open={focusOpen}
          onClose={closeFocus}
          postId={postId}
          body={body}
          paths={paths}
          authorUid={authorUid}
          avatarPath={avatarPath}
          createdAt={createdAt}
          engagement={engagement}
          labels={labels}
        />
      )}
    </>
  );
}
