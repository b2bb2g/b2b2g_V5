-- Dynamic paid-benefit catalog (PRD 5.4 / D8): the benefits list shown on the
-- membership page is admin-managed data, not code.
create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  title_en text not null,
  title_ko text,
  body_en text not null default '',
  body_ko text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.benefits enable row level security;

create policy "benefits read all" on public.benefits
  for select to anon, authenticated using (true);
create policy "benefits admin write" on public.benefits
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Seed with the launch benefit set (previously hardcoded copy).
insert into public.benefits (title_en, title_ko, body_en, body_ko, sort_order) values
  ('Unlimited posts', '글 수량 무제한',
   'Free members have a post limit. Certified members publish without limits.',
   '무료 회원은 글 수량 제한이 있어요. 인증 회원은 제한 없이 게시할 수 있어요.', 0),
  ('Mini homepage', '미니 홈페이지',
   'A public company page with your products, documents and story. Custom domain supported.',
   '제품, 자료, 회사 이야기를 담는 공개 회사 페이지. 자체 도메인도 연결돼요.', 1),
  ('Featured exposure', '추천 노출',
   'Your company appears in the featured section on the front page.',
   '메인 화면 추천 기업 영역에 회사가 노출돼요.', 2),
  ('Certified badge', '인증 배지',
   'An identity-verified trust signal shown on everything you do.',
   '신원 확인을 거친 신뢰 신호가 모든 활동에 표시돼요.', 3);
