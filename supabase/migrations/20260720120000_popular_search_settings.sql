-- Popular search chips become operator-managed content instead of
-- hardcoded strings (comma-separated, one list per locale).
insert into public.site_settings (key, value, is_public) values
  ('search_popular_en', '"Solar, CNC, Beauty, EPC, Generator"', true),
  ('search_popular_ko', '"태양광, CNC, 화장품, EPC, 발전기"', true)
on conflict (key) do nothing;
