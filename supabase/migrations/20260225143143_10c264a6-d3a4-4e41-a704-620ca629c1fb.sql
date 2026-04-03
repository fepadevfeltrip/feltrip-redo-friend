-- Add user_tier column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN user_tier text NOT NULL DEFAULT 'free' 
CHECK (user_tier IN ('free', 'premium_company', 'premium_individual'));

-- Set existing users with company_id as premium_company
UPDATE public.profiles 
SET user_tier = 'premium_company' 
WHERE company_id IS NOT NULL;

-- Create a security definer function to check user tier
CREATE OR REPLACE FUNCTION public.get_user_tier(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_tier FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;