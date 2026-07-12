# b2bb2g-v5

B2B/B2G trade community platform connecting Korean manufacturers and suppliers
with global buyers. Built with Next.js 16 (App Router) and Supabase.
Product spec: `PRD.md` · Design spec: `DESIGN.md`.

## Stack

- Next.js 16 (Turbopack, React 19, Tailwind CSS 4)
- Supabase: Auth (email verification), Postgres + RLS, Storage
- i18n: English default + Korean, cookie-based, language packs in `lib/i18n/locales`

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL and
   publishable (anon) key.
2. Link a Supabase project and apply the complete migration history:

   ```bash
   npx supabase link --project-ref <project-ref>
   npx supabase db push --include-all
   ```

3. `npm install && npm run dev`

The first user who signs up with the email stored in the `bootstrap_admin_email`
site setting automatically becomes an admin.

## Architecture notes

- **Policy lives in the database, not code**: admin switches are rows in
  `site_settings`; menus/boards, tiers, badge types and the permission matrix
  are all admin-editable data (PRD section 0).
- **Sensitive data double defense** (PRD 9): contact data sits in
  `profile_contacts` behind RLS (self, admin, direct-referrer coordinator only).
- **Non-member teaser** (PRD 12): anonymous visitors can only read the
  `public_posts` view (approved posts, truncated body). The gradient lock in
  the UI is presentation; the locked data is never delivered.
- **Mediated inquiries** (PRD 8): every message is admin-reviewed before the
  counterpart can read it, enforced by RLS on `inquiry_messages`.
- **Member network** (PRD 16.6): public UID-based business updates with image
  galleries, likes, comments, reposts, external sharing and follows. Writes are
  authenticated and ownership-scoped by RLS.
- **B2B commerce detail**: Commercial, Industrial and EPC+IPP use a unified
  image/video gallery, key specifications, inquiry-first CTA, rich product
  content and related products instead of price/cart checkout UI.
- **UI text**: no hardcoded strings; everything goes through the language packs.
  No emoji anywhere (PRD rule 2).

## Structure

- `app/` routes: dynamic boards (`[menuSlug]`), auth, dashboard, inquiries,
  notifications, admin console (`/admin`)
- `lib/` constants, i18n, Supabase clients, data helpers
- `components/` layout, UI primitives, post composer
- `supabase/migrations/` canonical schema for the Supabase project
- `proxy.ts` session refresh + route guard (Next 16 proxy convention)

## Verification

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Authenticated browser regression tests use a pre-authenticated Playwright storage
state through `E2E_AUTH_STATE`. Without it, public auth UI and all anonymous route,
accessibility, SEO, and authorization-boundary tests still run; the authenticated
scenario is reported as skipped instead of attempting to bypass hCaptcha.
