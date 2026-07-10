-- Badge labels are brand marks, identical in every locale:
-- Manufacturer (navy, calm authority) / Verified (green).

update public.badge_types
set name_en = 'Manufacturer', name_ko = 'Manufacturer'
where code = 'manufacturer';

update public.badge_types
set name_en = 'Verified', name_ko = 'Verified'
where code = 'certified';
