-- Admin-editable landing page: seed an overridable, per-locale site_settings key
-- for every landing field, plus the hero background image URL. Seeded empty
-- ('""') so the landing keeps rendering its i18n defaults until an admin sets a
-- value: app/page.tsx reads settingString(settings, key) || t.home[field], and
-- settingString returns "" for an empty override, which the `||` treats as the
-- fallback. is_public = true so the anon landing read can see them. Seeding the
-- rows lets the admin save use .update() (the codebase's update-only convention).
insert into public.site_settings (key, value, is_public)
select 'landing_' || f || '_' || l, '""'::jsonb, true
from unnest(array[
  'eyebrow','heroTitle','heroSubtitle','browseBoards','browseRequests',
  'eyebrowBrowse','newProducts','newProductsBody',
  'howItWorksTitle','valueTitle',
  'value1Title','value1Body','value2Title','value2Body','value3Title','value3Body',
  'step1Title','step1Body','step2Title','step2Body','step3Title','step3Body',
  'eyebrowRequests','latestRequests',
  'eyebrowShowcase','featured','promoBody','eventsTitle',
  'feedTitle','feedBody',
  'commercialRailTagline','commercialRailTitle','commercialRailBody',
  'industrialRailTagline','industrialRailTitle','industrialRailBody',
  'epcRailTagline','epcRailTitle','epcRailBody',
  'finalCtaTitle','finalCtaBody'
]) as f, unnest(array['ko','en']) as l
on conflict (key) do nothing;

insert into public.site_settings (key, value, is_public)
values ('landing_hero_image', '""'::jsonb, true)
on conflict (key) do nothing;
