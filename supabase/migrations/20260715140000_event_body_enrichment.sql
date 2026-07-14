-- The two original events carried a single thin sentence, which left the new
-- "About this event" reader looking empty. Give them proper multi-paragraph
-- descriptions in both languages. Matched by title, so it is idempotent.

update public.posts p
set body_en = v.body_en, body_ko = v.body_ko, updated_at = now()
from (values
  ('Precision Manufacturing Sourcing Day',
   '<p>Precision Manufacturing Sourcing Day is a focused buyer-meeting program connecting global buyers with Korean suppliers across custom machining, tooling, casting and export manufacturing.</p><p>Meetings are pre-arranged. Share your drawings, target volumes and quality requirements in advance, and the operations team pairs you with suppliers who can actually deliver. Each table runs a short capability review, so you leave with real, comparable options rather than a stack of brochures.</p><p>Advance appointments are booked through B2BB2G inquiries; walk-in slots on the day are limited.</p>',
   '<p>Precision Manufacturing Sourcing Day는 정밀 가공, 금형, 주조, 수출 제조 전반에서 글로벌 바이어와 국내 공급사를 연결하는 집중 바이어 미팅 프로그램입니다.</p><p>미팅은 사전 예약제로 진행됩니다. 도면, 목표 물량, 품질 요구사항을 미리 공유하면 운영팀이 실제로 납품 가능한 공급사와 매칭해 드립니다. 각 테이블에서 짧은 역량 상담을 진행하기 때문에, 브로슈어 더미가 아니라 비교 가능한 실질적인 옵션을 가지고 돌아갈 수 있습니다.</p><p>사전 예약은 B2BB2G 문의를 통해 신청하며, 당일 현장 접수는 제한적으로 운영됩니다.</p>'),
  ('Global Industry Technology Expo',
   '<p>Global Industry Technology Expo gathers manufacturers, engineering firms and buyers across precision machinery, automation and industrial supply. The Hanjin Precision booth runs live CNC machining and metrology demonstrations throughout the show.</p><p>Visit the booth to review sample parts, discuss tolerances and lead times, and meet the engineering team in person. Buyers planning a larger sourcing program can book a private consultation slot in advance.</p><p>The expo spans several halls — check the venue map on arrival for the precision-manufacturing zone.</p>',
   '<p>Global Industry Technology Expo는 정밀 기계, 자동화, 산업 자재 전반의 제조사·엔지니어링 기업·바이어가 모이는 전시회입니다. 한진정밀 부스에서는 전시 기간 내내 CNC 가공과 정밀 측정 실연을 선보입니다.</p><p>부스를 방문해 샘플 부품을 검토하고 공차와 납기를 상담하며 엔지니어링 팀을 직접 만나 보세요. 대규모 소싱을 계획 중인 바이어는 사전에 프라이빗 상담 슬롯을 예약할 수 있습니다.</p><p>전시는 여러 홀에 걸쳐 진행되므로, 도착 후 안내도에서 정밀 제조 존을 확인하시기 바랍니다.</p>')
) as v(title_prefix, body_en, body_ko)
where p.menu_id = (select id from public.menus where slug = 'events')
  and p.title_en like v.title_prefix || '%';
