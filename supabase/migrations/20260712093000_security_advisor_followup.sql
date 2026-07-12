-- Follow-up to the operational hardening pass.
-- Keep SECURITY DEFINER helpers callable only by roles that need them through
-- authenticated RLS policies, rather than through the implicit PUBLIC grant.

revoke execute on function public.can_read_post(uuid) from public, anon;
grant execute on function public.can_read_post(uuid) to authenticated;

revoke execute on function public.coordinator_can_view_inquiry(uuid) from public, anon;
grant execute on function public.coordinator_can_view_inquiry(uuid) to authenticated;

revoke execute on function public.coordinator_can_view_messages(uuid) from public, anon;
grant execute on function public.coordinator_can_view_messages(uuid) to authenticated;

revoke execute on function public.is_direct_referrer_coordinator(uuid) from public, anon;
grant execute on function public.is_direct_referrer_coordinator(uuid) to authenticated;

revoke execute on function public.is_inquiry_participant(uuid) from public, anon;
grant execute on function public.is_inquiry_participant(uuid) to authenticated;

revoke execute on function public.log_audit(text, text, text, jsonb) from public, anon;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;

revoke execute on function public.withdraw_member(uuid) from public, anon;
grant execute on function public.withdraw_member(uuid) to authenticated;

create index if not exists member_feed_reports_reporter_idx
  on public.member_feed_reports (reporter_id, created_at desc);

create index if not exists member_feed_reports_reviewed_by_idx
  on public.member_feed_reports (reviewed_by)
  where reviewed_by is not null;

comment on view public.public_posts is
  'Deliberate owner-executed, column-limited public teaser projection. The base posts table has no anonymous SELECT policy, preventing full body access.';
