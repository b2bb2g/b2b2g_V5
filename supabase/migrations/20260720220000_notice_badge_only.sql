-- Notices are badge-only: they light up the in-app bell and notification
-- list, but do not send a web push (an announcement is not urgent, and a
-- broadcast to every member should not spray push to every device). Skip the
-- dispatch ping entirely for notice_published so no HTTP call is made.
create or replace function public.dispatch_push_notification()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.type = 'notice_published' then
    return new;
  end if;
  perform net.http_post(
    url := 'https://b2bb2g.com/api/push/dispatch',
    body := jsonb_build_object('id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
exception when others then
  return new;
end;
$$;
