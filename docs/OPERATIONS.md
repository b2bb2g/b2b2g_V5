# B2BB2G 운영 런북 (백업·복구·장애 대응)

최종 갱신: 2026-07-20. 값(시크릿)은 절대 이 문서에 적지 않는다.

## 1. 시스템 구성

| 구성요소 | 위치 | 비고 |
|---|---|---|
| 웹 앱 | Vercel (리전 icn1) | GitHub `b2bb2g/b2b2g_V5` main 푸시 시 자동 배포 |
| DB·인증·스토리지·실시간 | Supabase 프로젝트 `ruzamxdsuddjjuqmxokf` | 마이그레이션은 `supabase/migrations/` |
| 트랜잭션 이메일 | Resend | 알림·월간 리포트·OTP 재설정 코드 |
| 웹 푸시 | VAPID + pg_net 트리거 | notifications INSERT → `/api/push/dispatch` |
| 도메인 | b2bb2g.com | 로컬 인증 QA는 dev.b2bb2g.com:3000 (hCaptcha 허용 호스트) |

## 2. 환경변수 인벤토리

Vercel과 로컬 `.env.local` 양쪽에 있어야 한다. 이름만 나열한다.

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 전용 — 노출 금지)
- `SUPABASE_DB_PASSWORD` (CLI 마이그레이션용)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_FROM_NAME`
- `SECURITY_HASH_PEPPER` (해시 페퍼 — 변경 시 기존 해시 전부 무효)
- `CRON_SECRET` (크론 엔드포인트 잠금 — 권장)
- `NEXT_PUBLIC_SITE_URL`
- hCaptcha 키 (로그인·가입 위젯)

키를 재발급하면 Vercel 환경변수 갱신 후 재배포까지 해야 반영된다.

## 3. 백업

### 3.1 데이터베이스
- Supabase가 플랜에 따라 자동 백업을 보관한다. 대시보드 → Database → Backups에서 확인. 유료 플랜이면 PITR(시점 복구) 활성화를 권장.
- 수동 덤프(월 1회 권장, 배포 큰 변경 전 필수):
  ```bash
  supabase db dump --linked -f backup-$(date +%Y%m%d).sql          # 스키마+데이터
  supabase db dump --linked --data-only -f data-$(date +%Y%m%d).sql
  ```
  덤프 파일은 저장소에 커밋하지 말고 별도 보관(개인정보 포함).

### 3.2 스토리지 (이미지·문서)
버킷: `post-media`(공개), `badge-docs`(비공개, 서명 URL). 정기 동기화:
```bash
npx supabase storage cp -r ss:///post-media ./storage-backup/post-media --linked
npx supabase storage cp -r ss:///badge-docs ./storage-backup/badge-docs --linked
```

### 3.3 코드·설정
- 코드는 GitHub이 원본. 마이그레이션 SQL이 저장소에 있으므로 스키마는 언제든 재현 가능.
- 운영 정책값은 `site_settings` 테이블에 있다 — DB 덤프에 포함되지만, 큰 변경 전 `/admin/settings` 화면 캡처를 남겨두면 복구 검증이 빠르다.

## 4. 복구 절차

### 4.1 DB 복원
1. Supabase 대시보드 백업/PITR로 복원하거나, 새 프로젝트에 `psql < backup.sql`.
2. 새 프로젝트로 이전한 경우: 환경변수(URL·키) 교체 → Vercel 재배포 → `supabase link` 갱신.
3. 복원 후 점검: 로그인, 게시물 목록, 문의 작성, 알림 벨, `/admin` 접근.

### 4.2 부분 삭제 사고 (테이블 단위)
전체 복원 대신 덤프에서 해당 테이블만 추출해 복구:
```bash
pg_restore/psql은 텍스트 덤프이므로 grep으로 해당 COPY 블록을 추출해 적용
```
실수 삭제 직후라면 PITR가 가장 안전하다.

### 4.3 알려진 함정: GoTrue NULL 토큰
`auth.users`의 `email_change` 계열 컬럼이 NULL이면 관리자 API(listUsers, generateLink)가 500을 낸다. 증상 발생 시 SQL Editor에서:
```sql
update auth.users set
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, '')
where email_change is null or email_change_token_new is null
   or email_change_token_current is null or confirmation_token is null
   or recovery_token is null or phone_change is null or phone_change_token is null;
```

## 5. 정기 작업 (Vercel Cron)

| 경로 | 주기 | 역할 |
|---|---|---|
| `/api/cron/subscription-reminders` | 매일 00:00 UTC | 7일 내 만료 멤버십 알림 (회원당 6일 중복 방지) |
| `/api/cron/monthly-report` | 매월 1일 01:00 UTC | 전월 운영 리포트 — 관리자 인앱+이메일 (월 키 중복 방지) |

수동 실행: `curl -H "Authorization: Bearer $CRON_SECRET" https://b2bb2g.com/api/cron/<이름>`. 둘 다 멱등이라 재실행해도 중복 발송되지 않는다.

## 6. 장애 대응 체크리스트

1. **서버 오류**: `/admin/security`의 "애플리케이션 오류" 섹션(`app_error_logs`, 30일 보관). 서버 오류는 15분 스로틀로 관리자에게 푸시된다.
2. **푸시 미수신**: notifications 행 생성 여부 → pg_net 확장 상태 → `/api/push/dispatch` 응답 → 기기 `push_subscriptions` 행(404/410이면 자동 정리됨) 순으로 확인.
3. **이메일 미발송**: Resend 대시보드 로그 확인. `RESEND_API_KEY` 부재 시 코드가 조용히 건너뛰도록 되어 있다.
4. **로그인 불가(회원)**: hCaptcha 위젯 로드 여부(허용 호스트), 위 4.3의 NULL 토큰 함정.
5. **OTP 분실(회원)**: 셀프 재설정 안내 — 보안 설정 → "인증 앱을 사용할 수 없나요?" → 이메일 코드. 이메일 접근도 잃은 경우에만 운영자가 Supabase 대시보드 → Authentication → 해당 유저 → Factors 삭제.
6. **배포 롤백**: Vercel 대시보드에서 이전 배포 Promote(코드), DB 마이그레이션은 전방 수정 마이그레이션으로 되돌린다(직접 롤백 금지).

## 7. 배포 전 점검 루틴

```bash
npx tsc --noEmit && npm run lint
npm run build
node scripts/e2e-authed.mjs        # 인증 동선 스모크 (매직링크, 회원 화면, 좋아요 왕복)
```
DB 변경이 있으면 `supabase db push --linked` 먼저, 코드 푸시는 그 다음(코드는 마이그레이션 부재에 관대하게 작성돼 있으나 순서를 지키는 편이 안전).
