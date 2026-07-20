-- Shared read receipts for inquiry threads. Participants stamp their own
-- read time through a definer function so the admin-only update policy on
-- inquiries stays intact.
alter table public.inquiries
  add column if not exists sender_last_read_at timestamptz,
  add column if not exists recipient_last_read_at timestamptz;

create or replace function public.mark_inquiry_read(p_inquiry_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.inquiries set sender_last_read_at = now()
    where id = p_inquiry_id and sender_id = auth.uid();
  update public.inquiries set recipient_last_read_at = now()
    where id = p_inquiry_id and recipient_id = auth.uid();
end;
$$;

grant execute on function public.mark_inquiry_read(uuid) to authenticated;
