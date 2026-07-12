-- These pre-authentication helpers are needed only by the anonymous role.
-- Removing authenticated access reduces the exposed SECURITY DEFINER surface.
revoke execute on function public.check_signup_email(text, text) from authenticated;
revoke execute on function public.record_login_failure(text, text, text, text, text) from authenticated;
