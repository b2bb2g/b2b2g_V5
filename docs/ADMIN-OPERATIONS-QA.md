# 관리자 통합 관제 QA 및 운영 가이드

최종 점검: 2026-07-14

## 1. 결론

PRD 17장과 DESIGN D1-D18을 기준으로 관리자 기능을 다시 대조했다. 관리자 콘솔은
21개 화면으로 구성되며, 플랫폼 소유자와 직원의 권한을 분리했다. 메뉴를 숨기는 데서 끝내지
않고 Server Action, Route Handler, RPC, RLS까지 같은 권한을 다시 확인한다.

관리자 또는 직원은 `/admin` 진입 전에 인증 앱의 AAL2 검증을 완료해야 한다. 직원은 기존
회원 UID를 사용해 등록하며, 맡은 업무 영역만 표시되고 실행된다.

## 2. 메뉴와 운영 업무

| 운영 영역 | 경로 | 주요 업무 | 필요 권한 |
| --- | --- | --- | --- |
| 현황 | `/admin` | 검수 SLA, 신규 회원, 만료 예정 구독, 운영 경고 | `overview` |
| 게시글 검수 | `/admin/moderation` | 미리보기, 승인, 사유 필수 반려 | `review` |
| 문의 검수 | `/admin/inquiries` | 전달, 운영 피드백, 사유 필수 반려 | `review` |
| 배지 | `/admin/badges` | 유형 추가·편집·중지, 서류 심사, 직접 부여·회수 | `review` |
| 피드 신고 | `/admin/feed` | 신고 검토와 운영 조치 | `review` |
| 코디네이터 메시지 | `/admin/coordinator-messages` | 검수 없는 예외 채널 감사 열람 | `review` |
| 회원 목록 | `/admin/members` | 검색·필터·일괄 알림·등급·CSV | `members` |
| 회원 상세 | `/admin/members/[id]` | 상태·메모·탈퇴·재설정·이력·개별 코디네이터 정책 | `members` |
| 추천 트리 | `/admin/referrals` | 추천 관계 및 코디네이터 역할 | `members` |
| 가입 초대 | `/admin/invitations` | 1회용 링크 상태 확인과 폐기 | `members` 또는 `security` |
| 구독 | `/admin/subscriptions` | 수동 부여·회수·만료 실행·혜택 관리 | `subscriptions` |
| 메뉴 | `/admin/menus` | 게시판 생성·편집·순서·스위치·안전 삭제 | `catalog` |
| 카탈로그 | `/admin/catalog` | 카테고리 계층·순서와 추천 필드 풀 | `catalog` |
| 등급 | `/admin/tiers` | 동적 등급과 행동 권한 매트릭스 | `catalog` |
| 콘텐츠 | `/admin/content` | 운영 게시판 작성·관리, 사이트 공유 이미지 | `content` |
| 알림 | `/admin/notifications` | 구현된 이벤트별 이메일 스위치, 발송 실패 | `notifications` |
| 보안 | `/admin/security` | 위험 로그인·실패 추이·기기 세션 폐기 | `security` |
| 시스템 설정 | `/admin/settings` | 가입·PWA·업로드·SEO·정책 스위치 | `settings` |
| 감사 로그 | `/admin/audit` | 운영자 행위 검색과 추적 | `audit` |
| 직원 권한 | `/admin/team` | 역할·최소 권한·활성 상태 | 플랫폼 소유자 |

회원 미니홈피 편집(`/admin/members/[id]/homepage`)은 회원 권한에 포함된다. 회원 상세의
배지 신청 서류는 `review` 권한까지 가진 직원에게만 10분짜리 서명 URL로 표시한다.

## 3. 직원 권한 기본안

- 운영 매니저: 현황과 실제 담당 영역을 조합해 부여한다.
- 콘텐츠 검수자: `overview`, `review`.
- 회원 지원 담당: `overview`, `members`, 필요 시 `subscriptions`.
- 콘텐츠 편집자: `overview`, `content`, 필요 시 `catalog`.
- 알림·보안·시스템·감사·직원 권한은 자동으로 묶지 않고 명시적으로 부여한다.
- 직원 권한 추가·수정·중지는 플랫폼 소유자만 가능하다.

권한 변경은 다음 로그인부터가 아니라 다음 요청부터 RLS와 서버 액션에 즉시 반영된다.

## 4. 안전장치

- `/admin` 전체에 MFA AAL2를 강제한다.
- 연락처를 포함하는 회원 CSV는 `members` 권한과 AAL2를 모두 다시 확인하고 감사 로그를 남긴다.
- 회원 중지는 사유 없이는 서버에서 거부한다.
- 게시판·카테고리·추천 필드는 사용 중인 데이터를 파괴하지 못하도록 삭제를 차단한다.
- 배지 서류, 첨부파일, 보안 이벤트는 업무 권한별 RLS로 분리한다.
- 관리자 액션은 `audit_log`에 행위자, 대상, 변경 내용을 남긴다.
- 사이트 OG 이미지는 `site-assets` 버킷에 저장하며 교체 시 이전 운영 파일을 정리한다.

## 5. 원격 Supabase 반영

다음 마이그레이션을 기존 프로젝트의 직접 PostgreSQL 적용 방식으로 반영하고
`supabase_migrations.schema_migrations`에도 기록했다.

- `20260714070419_admin_operations_control_plane`
- `20260714090000_admin_site_assets`
- `20260714100000_fix_public_settings_permission`
- `20260714101500_complete_admin_setting_effects`
- `20260714103000_staff_permission_policy_completion`

마지막 권한 마이그레이션은 과거의 포괄 `is_admin()` 정책을 플랫폼 소유자 전용으로 되돌리고,
직원은 `has_admin_permission()`과 테이블별 RLS로만 접근하도록 완결했다.

## 6. 운영상 남은 외부 의존성

- 구독 만료 cron은 상태 변경과 인앱 알림을 처리한다. cron에서 이메일까지 보내려면
  Supabase Edge Function 또는 `pg_net`과 Resend 호출 경계를 별도로 운영해야 한다.
- SMTP/Resend 키, 도메인 인증, 발송 한도와 반송 목록은 코드만으로 보장되지 않으므로 배포
  체크리스트에서 별도로 확인한다.
- 실제 관리자 시각 회귀는 MFA가 등록된 테스트 계정과 인증 상태 파일이 있어야 자동화할 수 있다.
  익명 경로, 권한 함수, 빌드, 공개 E2E와 원격 정책 검증은 계정 없이도 수행한다.

## 7. 배포 전 관리자 체크리스트

1. 플랫폼 소유자 계정에 TOTP 등록 후 `/admin` 진입 확인
2. 각 역할의 테스트 UID를 만들고 허용 메뉴와 403/리다이렉트 경계 확인
3. 게시글·문의·배지 승인/반려 후 토스트, 이메일 이벤트, 감사 로그 확인
4. 회원 중지 사유, CSV MFA, 기기 폐기, 직원 권한 회수 확인
5. 구독 만료 수동 실행 후 구독·배지·알림 결과 확인
6. 사이트 제목·설명·OG 이미지·robots·쿠키 문구의 공개 화면 반영 확인
7. 모바일 관리자 칩 내비게이션과 표의 카드형 대체 화면 확인

## 8. 2026-07-14 검증 결과

- ESLint: 통과
- TypeScript `--noEmit`: 통과
- Next.js production build: 통과
- Playwright E2E: 20개 통과, 2개 조건부 제외
- 공개 핵심 화면 접근성 검사: 심각도 serious 이상 위반 없음
- 프로덕션 의존성 보안 감사: 취약점 0건
- 원격 Supabase: 최신 5개 관리자 마이그레이션 적용 및 잔존 포괄 관리자 정책 0건 확인

조건부 제외 2건은 유효한 일회용 초대 토큰과 로그인된 회원 상태가 각각 필요한 시나리오다.
기능 오류로 제외된 것은 아니며, 배포 환경에서 초대용 계정과 MFA 관리자 테스트 계정을 준비해
체크리스트 1~2번과 함께 확인한다.
