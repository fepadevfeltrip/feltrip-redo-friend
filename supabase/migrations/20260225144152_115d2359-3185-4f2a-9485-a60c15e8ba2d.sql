INSERT INTO public.profiles (user_id, full_name, user_tier)
VALUES ('493d34f1-e7a5-4f84-8fee-dd09b80eaf75', 'TalkAway Language', 'premium_company')
ON CONFLICT (user_id) DO UPDATE SET user_tier = 'premium_company', updated_at = now();