-- Membership guide copy (admin-editable, shown on the public /membership page).

insert into public.site_settings (key, value, is_public) values
  ('membership_price_note', '"Annual membership. Contact us for current pricing (bank transfer)."', true),
  ('membership_bank_note', '"Bank transfer details are shared with you during the application process."', true)
on conflict (key) do nothing;
