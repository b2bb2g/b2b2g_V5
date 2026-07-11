-- Query-path indexes for member activity feeds and admin SLA queues.
-- All are additive and safe to run repeatedly in the shared production DB.

create index if not exists posts_author_updated_idx
  on public.posts (author_id, updated_at desc);

create index if not exists inquiries_sender_updated_idx
  on public.inquiries (sender_id, updated_at desc);

create index if not exists inquiries_recipient_updated_idx
  on public.inquiries (recipient_id, updated_at desc);

create index if not exists posts_pending_created_idx
  on public.posts (created_at)
  where status = 'pending';

create index if not exists inquiry_messages_pending_created_idx
  on public.inquiry_messages (created_at)
  where review_status = 'pending';

create index if not exists badge_applications_pending_created_idx
  on public.badge_applications (created_at)
  where status = 'pending';
