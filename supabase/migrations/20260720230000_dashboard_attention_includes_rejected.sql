-- The dashboard "needs attention" card labels its count "unread inquiry
-- updates" / "읽지 않은 문의 알림", but the summary only counted delivered
-- replies — a returned (rejected) message left the member needing to revise
-- and resend yet the dashboard showed "all clear". Count both delivered and
-- rejected inquiry notifications so the card matches its label.
create or replace function public.member_dashboard_summary()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'posts', (select count(*) from public.posts p
      where p.author_id = (select auth.uid()) and p.status <> 'draft'),
    'drafts', (select count(*) from public.posts p
      where p.author_id = (select auth.uid()) and p.status = 'draft'),
    'pending', (select count(*) from public.posts p
      where p.author_id = (select auth.uid()) and p.status = 'pending'),
    'inquiries', (select count(*) from public.inquiries i
      where (select auth.uid()) in (i.sender_id, i.recipient_id)),
    'unread_replies', (select count(*) from public.notifications n
      where n.profile_id = (select auth.uid()) and n.state = 'unread'
        and n.type in ('message_delivered', 'message_rejected')),
    'referrals', (select count(*) from public.profiles p
      where p.referred_by = (select auth.uid())),
    'feed_posts', (select count(*) from public.member_feed_posts f
      where f.author_id = (select auth.uid())),
    'followers', (select count(*) from public.member_follows f
      where f.following_id = (select auth.uid()))
  );
$$;

revoke all on function public.member_dashboard_summary() from public, anon;
grant execute on function public.member_dashboard_summary() to authenticated;
