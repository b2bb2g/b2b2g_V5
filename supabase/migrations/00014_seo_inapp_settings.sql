-- SEO controls as admin settings (PRD 12.2 / 17.10): index switch, extra
-- robots disallow paths, search-engine verification tokens. Plus the in-app
-- browser redirect path list (PRD 13 / 17.11).
insert into public.site_settings (key, value, is_public) values
  ('seo_index_enabled', 'true', true),
  ('robots_extra_disallow', '""', true),
  ('google_site_verification', '""', true),
  ('naver_site_verification', '""', true),
  ('inapp_redirect_paths', '"/login,/signup,/reset,/write,/dashboard/badges"', true)
on conflict (key) do nothing;
