INSERT INTO public.user_roles (user_id, role)
VALUES ('7fddd94f-00d6-4d6c-ae0c-0252bcca2b4f', 'owner')
ON CONFLICT (user_id, role) DO NOTHING;