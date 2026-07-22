-- Review-bypass hardening.
--
-- The participant/own INSERT policies on inquiry_messages and badge_applications
-- checked only the owner (sender_id / profile_id), NOT the moderation columns.
-- Because the client controls the row, a member could INSERT a message with
-- review_status = 'forwarded' (or a badge application with status = 'approved')
-- and skip admin review entirely -- for inquiry_messages that means unmoderated
-- content is delivered straight to the counterpart (the read policy exposes the
-- other side's message once review_status = 'forwarded'). The column defaults are
-- 'pending', and the real actions never set these fields, so forcing them for
-- non-review writers changes nothing for the legitimate flow.

create or replace function public.guard_inquiry_message_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  -- Only review staff may set a moderation outcome; a member submits for review.
  if not public.has_admin_permission('review') then
    new.review_status := 'pending';
    new.admin_feedback := null;
    new.reject_reason := null;
  end if;
  return new;
end;
$function$;

drop trigger if exists inquiry_message_guard on public.inquiry_messages;
create trigger inquiry_message_guard
  before insert on public.inquiry_messages
  for each row execute function public.guard_inquiry_message_insert();

create or replace function public.guard_badge_application_insert()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not public.has_admin_permission('review') then
    new.status := 'pending';
    new.reject_reason := null;
  end if;
  return new;
end;
$function$;

drop trigger if exists badge_application_guard on public.badge_applications;
create trigger badge_application_guard
  before insert on public.badge_applications
  for each row execute function public.guard_badge_application_insert();
