-- Seeds a product-update notice and beginner-friendly FAQ how-to entries
-- (bilingual, with in-app links). Idempotent: skips rows that already exist
-- by title. Authored by the first admin, published and approved so they show
-- on the public notice and FAQ boards immediately.

-- Notice writes are gated to admins with the "content" permission via a
-- trigger keyed on auth.uid(), which is null in migration context. Disable
-- that one trigger (table-owner privilege) for this trusted one-time seed.
alter table public.posts disable trigger posts_notice_admin_write;

do $$
declare
  v_author uuid;
  v_notices uuid;
  v_faq uuid;
begin
  select id into v_author from public.profiles where is_admin order by created_at limit 1;
  select id into v_notices from public.menus where slug = 'notices';
  select id into v_faq from public.menus where slug = 'faq';
  if v_author is null or v_notices is null or v_faq is null then
    return;
  end if;

  -- Announcement notice.
  if not exists (
    select 1 from public.posts
    where menu_id = v_notices and title_en = 'New: App lock, saved replies, and more'
  ) then
    insert into public.posts (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
    values (
      v_notices, v_author, 'notice', 'approved',
      'New: App lock, saved replies, and more',
      '업데이트 안내: 앱 잠금, 자주 쓰는 답변 등 새 기능',
      '<p>We have shipped several updates to make B2BB2G safer and easier to use on your phone.</p>'
      || '<p><strong>App lock (fingerprint / Face ID or PIN)</strong> — protect this device so only you can open the app. Set it up in <a href="/dashboard/security#app-lock">Security settings</a>. A 6-digit PIN always works as the alternative, and you can reset it any time.</p>'
      || '<p><strong>Self-service authenticator reset</strong> — lost your OTP app or changed phones? Recover it yourself from <a href="/dashboard/security">Security settings</a> with an email code.</p>'
      || '<p><strong>Saved replies</strong> in inquiries, <strong>product comparison</strong> for saved items, an <strong>events calendar</strong>, and <strong>#hashtags</strong> in the network feed.</p>'
      || '<p>See the <a href="/faq">FAQ</a> for step-by-step guides.</p>',
      '<p>B2BB2G를 휴대폰에서 더 안전하고 편리하게 쓸 수 있도록 여러 기능을 업데이트했습니다.</p>'
      || '<p><strong>앱 잠금 (지문·Face ID 또는 PIN)</strong> — 이 기기에서 나만 앱을 열 수 있게 보호합니다. <a href="/dashboard/security#app-lock">보안 설정</a>에서 켤 수 있고, 6자리 PIN이 항상 대체 수단으로 동작하며 언제든 재설정할 수 있습니다.</p>'
      || '<p><strong>OTP 인증 셀프 재설정</strong> — 인증 앱을 잃어버렸거나 휴대폰을 바꿨나요? <a href="/dashboard/security">보안 설정</a>에서 이메일 코드로 직접 복구할 수 있습니다.</p>'
      || '<p>문의의 <strong>자주 쓰는 답변</strong>, 찜한 상품 <strong>비교</strong>, <strong>이벤트 캘린더</strong>, 네트워크 피드의 <strong>#해시태그</strong>도 추가되었습니다.</p>'
      || '<p>단계별 사용법은 <a href="/faq">자주 묻는 질문</a>에서 확인하세요.</p>',
      now()
    );
  end if;

  -- FAQ: app lock setup.
  if not exists (select 1 from public.posts where menu_id = v_faq and title_en = 'How do I lock the app with my fingerprint or PIN?') then
    insert into public.posts (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
    values (v_faq, v_author, 'notice', 'approved',
      'How do I lock the app with my fingerprint or PIN?',
      '지문이나 PIN으로 앱을 잠그려면 어떻게 하나요?',
      '<p>Open <a href="/dashboard/security#app-lock">Security settings</a> and find <strong>App lock</strong>. Choose a 6-digit PIN, then tap <strong>Turn on with biometric</strong> to also use your fingerprint or Face ID (or <strong>Turn on with PIN only</strong> if your phone has no biometric). Next time you open the app, unlock with your fingerprint or enter your PIN.</p>',
      '<p><a href="/dashboard/security#app-lock">보안 설정</a>에서 <strong>앱 잠금</strong>을 찾으세요. 6자리 PIN을 정한 뒤 <strong>생체인증으로 켜기</strong>를 누르면 지문·Face ID도 함께 사용됩니다(생체인증이 없는 기기는 <strong>PIN만으로 켜기</strong>). 다음에 앱을 열면 지문으로 잠금 해제하거나 PIN을 입력하면 됩니다.</p>',
      now());
  end if;

  -- FAQ: two PINs confusion.
  if not exists (select 1 from public.posts where menu_id = v_faq and title_en = 'The unlock screen asks for a PIN — which PIN is it?') then
    insert into public.posts (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
    values (v_faq, v_author, 'notice', 'approved',
      'The unlock screen asks for a PIN — which PIN is it?',
      '잠금 화면에서 PIN을 물어봅니다 — 어떤 PIN인가요?',
      '<p>On the B2BB2G unlock screen, the <strong>App PIN</strong> field is the 6-digit PIN you set in the app — type it directly there. If you tap the fingerprint button, your phone may offer to "use PIN": that is your <strong>phone''s screen-lock PIN</strong>, a different one. To use the app PIN, just enter it in the app''s own field instead of opening the fingerprint prompt.</p>',
      '<p>B2BB2G 잠금 화면의 <strong>앱 PIN</strong> 입력란은 앱에서 설정한 6자리 PIN입니다 — 여기에 바로 입력하세요. 지문 버튼을 눌렀을 때 휴대폰이 "PIN 사용"을 제안하면 그것은 <strong>휴대폰 화면잠금 PIN</strong>으로 서로 다릅니다. 앱 PIN을 쓰려면 지문 창을 열지 말고 앱 화면의 입력란에 바로 입력하면 됩니다.</p>',
      now());
  end if;

  -- FAQ: forgot PIN / new phone.
  if not exists (select 1 from public.posts where menu_id = v_faq and title_en = 'I forgot my app PIN or changed my phone. What do I do?') then
    insert into public.posts (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
    values (v_faq, v_author, 'notice', 'approved',
      'I forgot my app PIN or changed my phone. What do I do?',
      '앱 PIN을 잊었거나 휴대폰을 바꿨어요. 어떻게 하나요?',
      '<p>On the unlock screen tap <strong>Forgot your PIN?</strong> — this signs you out and removes the lock. Sign back in with your password, then set a new PIN in <a href="/dashboard/security#app-lock">Security settings</a>. A brand-new phone simply starts with no lock, so just sign in and set it up again. The app lock is stored only on each device; your account is always protected by your password and two-step verification.</p>',
      '<p>잠금 화면에서 <strong>PIN을 잊으셨나요?</strong>를 누르면 로그아웃되면서 잠금이 제거됩니다. 비밀번호로 다시 로그인한 뒤 <a href="/dashboard/security#app-lock">보안 설정</a>에서 새 PIN을 설정하세요. 새 휴대폰은 잠금 없이 시작되므로 로그인 후 다시 설정하면 됩니다. 앱 잠금은 각 기기에만 저장되며, 계정은 항상 비밀번호와 2단계 인증으로 보호됩니다.</p>',
      now());
  end if;

  -- FAQ: OTP reset.
  if not exists (select 1 from public.posts where menu_id = v_faq and title_en = 'I lost my authenticator (OTP) app. How do I get back in?') then
    insert into public.posts (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
    values (v_faq, v_author, 'notice', 'approved',
      'I lost my authenticator (OTP) app. How do I get back in?',
      '인증 앱(OTP)을 잃어버렸어요. 어떻게 다시 로그인하나요?',
      '<p>Go to <a href="/dashboard/security">Security settings</a> and, on the two-step verification card, tap <strong>Can''t use your authenticator app?</strong>. We email a 6-digit code to your account address; enter it within 10 minutes to remove the old authenticator, then set up a new device by scanning the new QR code.</p>',
      '<p><a href="/dashboard/security">보안 설정</a>의 2단계 인증 카드에서 <strong>인증 앱을 사용할 수 없나요?</strong>를 누르세요. 계정 이메일로 6자리 코드를 보내드리며, 10분 안에 입력하면 기존 인증기가 해제됩니다. 이후 새 QR 코드를 스캔해 새 기기를 등록하면 됩니다.</p>',
      now());
  end if;

  -- FAQ: save & compare products.
  if not exists (select 1 from public.posts where menu_id = v_faq and title_en = 'How do I save products and compare them?') then
    insert into public.posts (menu_id, author_id, type, status, title_en, title_ko, body_en, body_ko, published_at)
    values (v_faq, v_author, 'notice', 'approved',
      'How do I save products and compare them?',
      '상품을 찜하고 비교하려면 어떻게 하나요?',
      '<p>Tap the heart on any product card to save it. Your saved items live in <a href="/dashboard/bookmarks">Saved products</a>. There, tap <strong>Compare</strong> on two or three products and open the comparison to see their specifications side by side.</p>',
      '<p>상품 카드의 하트를 누르면 찜됩니다. 찜한 상품은 <a href="/dashboard/bookmarks">찜한 상품</a>에서 볼 수 있습니다. 그 화면에서 2~3개 상품의 <strong>비교</strong>를 누른 뒤 비교 화면을 열면 사양을 나란히 확인할 수 있습니다.</p>',
      now());
  end if;
end $$;

alter table public.posts enable trigger posts_notice_admin_write;
