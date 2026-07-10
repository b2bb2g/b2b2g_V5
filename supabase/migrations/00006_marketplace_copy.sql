-- Reposition public copy as a marketplace (no mediation/review wording,
-- buyer/supplier instead of buyer-broker terms).

update public.site_settings
set value = '"A trusted global B2B and B2G marketplace connecting buyers and suppliers."'
where key = 'site_description';
