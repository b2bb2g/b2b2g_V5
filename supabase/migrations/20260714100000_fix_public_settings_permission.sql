-- Public pages must be able to evaluate scoped admin policies anonymously.
-- Both functions only inspect auth.uid(); for an anonymous request they return
-- false and expose no profile or assignment data.

grant execute on function public.is_platform_owner() to anon;
grant execute on function public.has_admin_permission(text) to anon;
