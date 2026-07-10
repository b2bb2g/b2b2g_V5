-- Per-type switches for parallel email notifications (PRD 10.2).
-- Admin-only settings: they appear as toggles on the admin settings screen.

insert into public.site_settings (key, value, is_public) values
  ('email_notify_post_approved', 'true', false),
  ('email_notify_post_rejected', 'true', false),
  ('email_notify_message_delivered', 'true', false),
  ('email_notify_message_rejected', 'true', false),
  ('email_notify_badge_approved', 'true', false),
  ('email_notify_badge_rejected', 'true', false)
on conflict (key) do nothing;
