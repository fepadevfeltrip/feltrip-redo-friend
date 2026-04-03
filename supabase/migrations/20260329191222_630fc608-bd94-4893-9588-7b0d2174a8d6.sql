
-- Revoke direct access to client_activity_view from non-admin roles
REVOKE SELECT ON public.client_activity_view FROM authenticated, anon;

-- Grant only to postgres (service role) so edge functions and admin RPCs can still use it
GRANT SELECT ON public.client_activity_view TO postgres;
