-- Inquiry messages carry up to two images, same cap as feed comments.
-- Review still gates delivery; attachments ride the existing message row.
alter table public.inquiry_messages
  add column if not exists media_paths text[] not null default '{}'
    check (cardinality(media_paths) <= 2);
