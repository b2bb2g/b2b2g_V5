-- Preserve the menu ID so existing posts and categories remain connected.
UPDATE public.menus
SET slug = 'ict-hse', title_en = 'ICT & HSE', title_ko = 'ICT & HSE'
WHERE slug = 'commercial';
