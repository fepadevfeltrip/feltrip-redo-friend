
INSERT INTO public.user_roles (user_id, role)
VALUES ('8b7b9755-1b3e-4c91-b127-28fc46de3935', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

UPDATE public.profiles 
SET user_tier = 'premium_company_plus_language'
WHERE user_id = '8b7b9755-1b3e-4c91-b127-28fc46de3935';
