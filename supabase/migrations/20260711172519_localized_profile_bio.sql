-- Public UID pages render the member introduction in the active locale.
-- Keep the legacy bio column during the transition so older clients remain
-- compatible; existing content becomes the English fallback.
alter table public.profiles
  add column if not exists bio_en text,
  add column if not exists bio_ko text;

update public.profiles
set bio_en = coalesce(bio_en, bio)
where bio is not null;
