-- Email binding is a per-link choice rather than a global switch. Removing the
-- unused setting prevents an administrator control that would have no effect.
delete from public.site_settings where key = 'referral_invite_email_binding';
