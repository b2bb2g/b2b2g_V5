-- One switch for login, signup, recovery and verification resend.
insert into public.site_settings (key, value, is_public)
values ('auth_captcha_enabled', 'false'::jsonb, true)
on conflict (key) do nothing;
