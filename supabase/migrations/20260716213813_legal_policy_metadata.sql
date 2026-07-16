-- Public legal-policy metadata. The document body remains version-controlled,
-- while these operational fields can be updated from the admin settings page
-- without a deployment.
insert into public.site_settings (key, value, is_public)
values
  ('legal_policy_effective_date', '"2026-07-17"'::jsonb, true),
  ('legal_policy_version', '"1.0"'::jsonb, true),
  ('legal_operator_name', '"B2BB2G"'::jsonb, true),
  ('legal_privacy_department', '"B2BB2G 운영팀"'::jsonb, true),
  ('legal_contact_path', '"/inquiries"'::jsonb, true)
on conflict (key) do update
set
  value = excluded.value,
  is_public = excluded.is_public,
  updated_at = now();
