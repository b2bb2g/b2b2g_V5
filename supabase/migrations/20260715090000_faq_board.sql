-- FAQ board: an admin-curated, read-only notice-type board, plus real seed
-- entries so it is useful the moment it goes live.

insert into public.menus
  (slug, title_en, title_ko, board_type, sort_order, is_visible, member_write, review_required)
values
  ('faq', 'FAQ', '자주 묻는 질문', 'notice', 7, true, false, true)
on conflict (slug) do nothing;

-- Seed Q&A entries (question = title, answer = body). Attributed to the first
-- admin and published immediately. Only seeds when the board is still empty, so
-- re-running the migration will not duplicate them.
insert into public.posts
  (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
select
  m.id, a.id, 'notice', 'approved',
  q.title_en, q.title_ko, q.body_en, q.body_ko,
  now() - (q.ord || ' minutes')::interval
from (select id from public.menus where slug = 'faq') m
cross join (
  select id from public.profiles where is_admin = true order by created_at limit 1
) a
cross join (values
  (0,
   'How does B2BB2G work?',
   'B2BB2G는 어떻게 이용하나요?',
   '<p>B2BB2G is a global B2B and B2G marketplace that connects verified companies. Browse products and sourcing requests, then start a conversation through the platform — your message stays linked to the listing from first contact to close.</p>',
   '<p>B2BB2G는 검증된 기업을 연결하는 글로벌 B2B·B2G 마켓플레이스예요. 제품과 소싱 요청을 둘러보고 플랫폼을 통해 대화를 시작하세요. 메시지는 첫 연락부터 마무리까지 해당 게시물에 연결돼 있어요.</p>'),
  (1,
   'Why are my messages reviewed before delivery?',
   '메시지는 왜 전달 전에 확인되나요?',
   '<p>Every inquiry is checked by our operations team before it reaches the other company. This keeps conversations professional and protects both sides from spam and unsafe contact.</p>',
   '<p>모든 문의는 상대 기업에게 도착하기 전에 운영팀이 확인해요. 대화를 전문적으로 유지하고, 양측을 스팸과 안전하지 않은 연락으로부터 보호하기 위해서예요.</p>'),
  (2,
   'What do the trust badges mean?',
   '신뢰 배지는 무엇을 의미하나요?',
   '<p>Two marks build credibility. The Manufacturer badge confirms a verified supplier and is granted for free after a document check. The Verified badge is a paid trust mark that requires an active membership and an identity check.</p>',
   '<p>두 가지 신뢰 마크가 있어요. Manufacturer 배지는 검증된 공급 기업임을 나타내며 서류 확인 후 무료로 부여돼요. Verified 배지는 유료 신뢰 마크로, 멤버십과 신원 확인이 필요해요.</p>'),
  (3,
   'How do I register a product or post?',
   '제품이나 글은 어떻게 등록하나요?',
   '<p>Open your dashboard, choose “Add a product”, pick the right board, and fill in the listing. Your post is published after a quick review by our team.</p>',
   '<p>대시보드에서 “제품 등록”을 열고 알맞은 게시판을 고른 뒤 내용을 채우세요. 운영팀의 간단한 확인을 거쳐 공개돼요.</p>'),
  (4,
   'What are the different boards for?',
   '게시판마다 용도가 어떻게 다른가요?',
   '<p>Commercial, Industrial and EPC+IPP are product boards. RFQ &amp; ITB is for sourcing requests where a company posts what it needs. Events lists exhibitions and business programs, while Services and Notices carry platform information.</p>',
   '<p>Commercial·Industrial·EPC+IPP는 제품 게시판이에요. RFQ &amp; ITB는 필요한 것을 올리는 소싱 요청 게시판이고, Events는 전시·비즈니스 프로그램, Services·Notices는 플랫폼 안내를 담아요.</p>'),
  (5,
   'Is signup open? How do I join?',
   '가입은 열려 있나요? 어떻게 가입하나요?',
   '<p>Membership is by invitation only. Ask an existing member for an invitation link, then complete signup with your verified email and a secure password.</p>',
   '<p>가입은 초대제로 운영돼요. 기존 회원에게 초대 링크를 받은 뒤, 인증된 이메일과 안전한 비밀번호로 가입을 완료하세요.</p>'),
  (6,
   'What is a UID?',
   'UID는 무엇인가요?',
   '<p>Your UID is your public company identifier on B2BB2G. Companies are recognized by UID and trust badges rather than personal names, so you always know who you are dealing with.</p>',
   '<p>UID는 B2BB2G에서 회사를 나타내는 공개 식별자예요. 개인 이름 대신 UID와 신뢰 배지로 상대를 확인할 수 있어요.</p>'),
  (7,
   'How do I post an RFQ or ITB?',
   'RFQ나 ITB는 어떻게 올리나요?',
   '<p>Go to “Add a product”, choose the RFQ &amp; ITB board, and describe what you need — quantities, specifications, and any deadline. Suppliers respond through the reviewed inquiry flow.</p>',
   '<p>“제품 등록”에서 RFQ &amp; ITB 게시판을 고르고 필요한 수량·사양·마감일을 적어 요청하세요. 공급 기업이 확인된 문의 흐름으로 응답해요.</p>')
) as q(ord, title_en, title_ko, body_en, body_ko)
where not exists (select 1 from public.posts p where p.menu_id = m.id);
