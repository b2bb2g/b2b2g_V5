-- Rewrite the FAQ answers as multi-paragraph, structured content so the new
-- help-center reader breathes instead of showing one mechanical block. Matched
-- by question so it is idempotent.

update public.posts p
set body_en = v.body_en, body_ko = v.body_ko, updated_at = now()
from (values
  ('How does B2BB2G work?',
   '<p>B2BB2G is a global B2B and B2G marketplace that connects verified companies — the suppliers who make things and the businesses that buy them.</p><p>Browse product boards and open sourcing requests to find a partner. When you are ready, start a conversation through the platform instead of trading private contact details.</p><p>Every message is checked by our team before it is delivered, and the whole thread stays linked to the original listing — from first contact through to a closed deal.</p>',
   '<p>B2BB2G는 검증된 기업을 연결하는 글로벌 B2B·B2G 마켓플레이스예요. 제품을 만드는 공급 기업과 이를 구매하는 기업을 이어줍니다.</p><p>제품 게시판과 진행 중인 소싱 요청을 둘러보며 파트너를 찾고, 준비가 되면 개인 연락처를 주고받는 대신 플랫폼에서 대화를 시작하세요.</p><p>모든 메시지는 전달 전에 운영팀이 확인하고, 대화 전체가 첫 연락부터 마무리까지 해당 게시물에 연결돼 있어요.</p>'),
  ('Why are my messages reviewed before delivery?',
   '<p>Every inquiry passes a quick check by our operations team before it reaches the other company.</p><p>This keeps conversations professional, filters out spam, and protects both sides from unsafe or off-platform contact — so you can focus on the deal, not on vetting who reached out.</p>',
   '<p>모든 문의는 상대 기업에게 도착하기 전에 운영팀이 간단히 확인해요.</p><p>대화를 전문적으로 유지하고 스팸을 걸러내며, 안전하지 않거나 플랫폼 밖으로 유도하는 연락으로부터 양측을 보호하기 위해서예요. 덕분에 상대를 검증하는 대신 거래 자체에 집중할 수 있어요.</p>'),
  ('What do the trust badges mean?',
   '<p>Two marks help you judge who you are dealing with at a glance:</p><ul><li><strong>Manufacturer</strong> — confirms a verified supplier. Granted for free after our team reviews your company documents.</li><li><strong>Verified</strong> — a paid trust mark that requires an active membership and a simple identity check. It is only granted after review, never by payment alone.</li></ul>',
   '<p>두 가지 신뢰 마크로 상대를 한눈에 판단할 수 있어요:</p><ul><li><strong>Manufacturer</strong> — 검증된 공급 기업임을 나타내요. 회사 서류 확인 후 무료로 부여돼요.</li><li><strong>Verified</strong> — 멤버십과 간단한 신원 확인이 필요한 유료 신뢰 마크예요. 결제만으로는 부여되지 않고 확인을 거쳐야 해요.</li></ul>'),
  ('How do I register a product or post?',
   '<p>Open your dashboard and choose <strong>Add a product</strong>.</p><p>Pick the board that fits what you are posting, fill in the title, description, images and specifications, then submit. Your post goes live right after a quick review by our team.</p>',
   '<p>대시보드에서 <strong>제품 등록</strong>을 선택하세요.</p><p>올리려는 내용에 맞는 게시판을 고르고 제목·설명·이미지·사양을 채운 뒤 제출하면, 운영팀의 간단한 확인을 거쳐 바로 공개돼요.</p>'),
  ('What are the different boards for?',
   '<p>Each board is tuned to a different need:</p><ul><li><strong>Commercial, Industrial, EPC+IPP</strong> — product boards where suppliers list what they offer.</li><li><strong>RFQ &amp; ITB</strong> — sourcing requests, where a company posts what it needs and suppliers respond.</li><li><strong>Events, Services, Notices</strong> — exhibitions, service listings, and platform information.</li></ul>',
   '<p>게시판마다 용도가 달라요:</p><ul><li><strong>Commercial·Industrial·EPC+IPP</strong> — 공급 기업이 제품을 올리는 제품 게시판이에요.</li><li><strong>RFQ &amp; ITB</strong> — 필요한 것을 올리면 공급 기업이 응답하는 소싱 요청 게시판이에요.</li><li><strong>Events·Services·Notices</strong> — 전시, 서비스 안내, 플랫폼 소식을 담아요.</li></ul>'),
  ('Is signup open? How do I join?',
   '<p>Membership is invitation-only, so every member joins through someone already on the platform.</p><p>Ask an existing member for an invitation link, then complete signup with a verified email and a secure password. That keeps the network made up of real, accountable companies.</p>',
   '<p>가입은 초대제라, 모든 회원이 기존 회원을 통해 합류해요.</p><p>기존 회원에게 초대 링크를 받은 뒤 인증된 이메일과 안전한 비밀번호로 가입을 완료하세요. 이렇게 실제로 책임 있는 기업들로 네트워크를 유지해요.</p>'),
  ('What is a UID?',
   '<p>Your UID is your company''s public identifier on B2BB2G.</p><p>Companies are recognized by UID and trust badges rather than personal names, so you always know which verified business you are talking to — and your own team stays private.</p>',
   '<p>UID는 B2BB2G에서 회사를 나타내는 공개 식별자예요.</p><p>개인 이름 대신 UID와 신뢰 배지로 상대를 확인하기 때문에, 어떤 검증된 기업과 대화하는지 늘 알 수 있고 우리 담당자 정보는 노출되지 않아요.</p>'),
  ('How do I post an RFQ or ITB?',
   '<p>Go to <strong>Add a product</strong> and choose the RFQ &amp; ITB board.</p><p>Describe what you need — quantities, specifications, and any deadline — and publish. Suppliers reply through the same reviewed inquiry flow, so every response stays on record and linked to your request.</p>',
   '<p><strong>제품 등록</strong>에서 RFQ &amp; ITB 게시판을 고르세요.</p><p>필요한 수량·사양·마감일을 적어 게시하면, 공급 기업이 확인된 문의 흐름으로 응답해요. 모든 응답이 기록으로 남고 요청에 연결돼 있어요.</p>')
) as v(title_en, body_en, body_ko)
where p.menu_id = (select id from public.menus where slug = 'faq')
  and p.title_en = v.title_en;
