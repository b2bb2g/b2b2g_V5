-- Events become a real exhibition/expo calendar. Posts on the flexible board
-- gain a schedule (start/end date) and a venue, so the /events page can show a
-- COEX / KINTEX / BEXCO-style agenda with live "Now on / Upcoming / Ended"
-- status. Dates are seeded relative to current_date so every status stays
-- demonstrable no matter when the page is viewed. Fully idempotent.

-- 1) Schedule columns (nullable, additive — safe on a live table).
alter table public.posts
  add column if not exists event_start date,
  add column if not exists event_end date,
  add column if not exists event_venue text;

-- 2) Expose the new columns on the anon-safe teaser view. CREATE OR REPLACE can
-- only append columns, so the three event fields go at the end; the rest of the
-- definition is preserved verbatim from 20260711161621_public_post_author_badges.
create or replace view public.public_posts as
select
  p.id,
  p.menu_id,
  p.type,
  p.status,
  p.title_en,
  p.title_ko,
  left(p.body_en, 600) as body_teaser_en,
  left(coalesce(p.body_ko, ''), 600) as body_teaser_ko,
  length(p.body_en) > 600 as body_truncated,
  p.category_id,
  p.rep_image_path,
  p.rep_video_url,
  p.deadline,
  p.closed_at,
  p.published_at,
  p.created_at,
  pr.uid as author_uid,
  pr.display_name as author_name,
  pr.company_name as author_company,
  p.rep_is_video,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'code', bt.code,
        'name_en', bt.name_en,
        'name_ko', bt.name_ko
      ) order by bt.code
    )
    from public.member_badges mb
    join public.badge_types bt on bt.id = mb.badge_type_id
    where mb.profile_id = p.author_id
      and bt.is_active = true
  ), '[]'::jsonb) as author_badges,
  p.event_start,
  p.event_end,
  p.event_venue
from public.posts p
join public.profiles pr on pr.id = p.author_id
where p.status in ('approved', 'closed');

revoke all on public.public_posts from anon, authenticated;
grant select on public.public_posts to anon, authenticated;

-- 3) Give the two existing events a real schedule + venue so they read as part
-- of the calendar. The first one runs "now" to anchor the featured hero.
update public.posts p
set event_start = current_date - 1,
    event_end = current_date + 2,
    event_venue = 'KINTEX Hall 7, Goyang',
    updated_at = now()
from public.menus m
where p.menu_id = m.id and m.slug = 'events'
  and p.title_en like 'Global Industry Technology Expo%';

update public.posts p
set event_start = current_date + 9,
    event_end = current_date + 9,
    event_venue = 'COEX Conference Room 401, Seoul',
    updated_at = now()
from public.menus m
where p.menu_id = m.id and m.slug = 'events'
  and p.title_en like 'Precision Manufacturing Sourcing Day%';

-- 4) Seed a realistic Korean B2B/B2G expo calendar. Offsets from current_date
-- span past, live and future so the status system is always exercised.
insert into public.posts
  (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko,
   rep_image_path, event_start, event_end, event_venue, published_at)
select
  m.id, a.id, 'flexible', 'approved',
  e.title_en, e.title_ko, e.body_en, e.body_ko, e.rep_image_path,
  current_date + e.start_off, current_date + e.end_off, e.venue,
  now() - (e.ord || ' minutes')::interval
from (select id from public.menus where slug = 'events') m
cross join (
  select id from public.profiles where is_admin = true order by created_at limit 1
) a
cross join (values
  (1,
   'Korea Metal Week 2026',
   '코리아 메탈 위크 2026',
   '<p>Korea Metal Week brings together sheet-metal, casting, forging and surface-treatment suppliers with buyers sourcing precision metal parts. The floor is organised by process so procurement teams can walk a full supply chain in a day.</p><p>Come prepared with drawings and target volumes — most exhibitors run live capability reviews at their booths.</p>',
   '<p>코리아 메탈 위크는 판금·주조·단조·표면처리 공급사와 정밀 금속 부품을 소싱하는 바이어를 한자리에 모읍니다. 공정별로 부스가 구성되어 하루 만에 전체 공급망을 둘러볼 수 있습니다.</p><p>도면과 목표 물량을 준비해 오시면 대부분의 부스에서 현장 역량 상담을 받을 수 있습니다.</p>',
   '/landing-v2/precision-manufacturing.jpg', 16, 19, 'KINTEX Hall 3–5, Goyang'),
  (2,
   'Seoul International Sourcing Fair 2026',
   '서울 국제 소싱 페어 2026',
   '<p>A cross-industry sourcing fair connecting global buyers with Korean manufacturers across consumer goods, components and industrial supply. Pre-scheduled buyer meetings run alongside the open exhibition.</p><p>Registered members can request matchmaking slots in advance through the platform.</p>',
   '<p>소비재·부품·산업 자재 전반에서 글로벌 바이어와 국내 제조사를 연결하는 크로스 인더스트리 소싱 페어입니다. 공개 전시와 함께 사전 예약 바이어 미팅이 진행됩니다.</p><p>가입 회원은 플랫폼을 통해 사전에 매칭 상담을 신청할 수 있습니다.</p>',
   '/landing-v2/hero-global-collaboration.jpg', 33, 35, 'COEX Hall A–C, Seoul'),
  (3,
   'Busan International Machinery Fair 2026',
   '부산 국제 기계대전 2026',
   '<p>Southern Korea''s flagship machinery show covers machine tools, industrial automation, power transmission and plant equipment. Strong participation from shipbuilding and heavy-industry supply chains.</p><p>A dedicated hall hosts automation and robotics demonstrations throughout the week.</p>',
   '<p>공작기계, 산업 자동화, 동력전달, 플랜트 설비를 아우르는 영남권 대표 기계 전시회입니다. 조선·중공업 공급망의 참여가 활발합니다.</p><p>전시 기간 내내 자동화·로보틱스 실연이 별도 홀에서 진행됩니다.</p>',
   '/generated/epc/turbine-hall-commissioning.jpg', 57, 60, 'BEXCO Exhibition Hall 1, Busan'),
  (4,
   'Korea Public Procurement Expo 2026',
   '대한민국 공공조달 엑스포 2026',
   '<p>A B2G-focused expo where public institutions, procurement agencies and qualified suppliers meet. Sessions cover innovation procurement, certification requirements and how to prepare a compliant bid.</p><p>Suppliers new to public tenders can book one-on-one guidance desks.</p>',
   '<p>공공기관, 조달 기관, 자격을 갖춘 공급사가 만나는 B2G 중심 엑스포입니다. 혁신조달, 인증 요건, 적격 입찰 준비 방법을 다루는 세션이 열립니다.</p><p>공공 입찰이 처음인 공급사는 일대일 상담 데스크를 예약할 수 있습니다.</p>',
   null, 80, 82, 'Songdo Convensia, Incheon'),
  (5,
   'Smart Factory + Automation World 2026',
   '스마트공장·자동화산업전 2026',
   '<p>Asia''s largest smart-manufacturing exhibition, covering industrial IoT, machine vision, robotics, MES and factory-wide automation. A must-attend for teams modernising production lines.</p><p>Live line demonstrations show end-to-end automation from intake to inspection.</p>',
   '<p>산업용 IoT, 머신비전, 로보틱스, MES, 공장 전반 자동화를 다루는 아시아 최대 규모의 스마트 제조 전시회입니다. 생산 라인을 현대화하는 팀이라면 놓치지 말아야 할 행사입니다.</p><p>입고부터 검사까지 엔드투엔드 자동화를 현장 라인 실연으로 확인할 수 있습니다.</p>',
   '/generated/epc/solar-bess-commissioning.jpg', -16, -13, 'COEX Hall A–D, Seoul'),
  (6,
   'Global Electronics Components Fair 2026',
   '글로벌 전자부품 페어 2026',
   '<p>A focused fair for electronic components, PCBs, connectors, power modules and EMS partners. Buyers source qualified suppliers and review samples on-site.</p><p>Technical seminars cover reliability testing and supply-continuity planning.</p>',
   '<p>전자부품, PCB, 커넥터, 전력 모듈, EMS 파트너에 특화된 전문 전시회입니다. 바이어는 검증된 공급사를 발굴하고 현장에서 샘플을 검토할 수 있습니다.</p><p>기술 세미나에서는 신뢰성 시험과 공급 연속성 계획을 다룹니다.</p>',
   '/catalog/ev-inverter-housing.jpg', -47, -44, 'EXCO, Daegu')
) as e(ord, title_en, title_ko, body_en, body_ko, rep_image_path, start_off, end_off, venue)
where not exists (
  select 1 from public.posts p
  where p.menu_id = m.id and p.title_en = e.title_en
);
