-- The issue is that even SECURITY DEFINER functions can trigger RLS in certain cases
-- We need to make sure the function truly bypasses RLS by using a different approach

-- First, let's recreate the get_user_company_id function to ensure it bypasses RLS properly
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Now let's simplify the profiles policies even more
-- The key insight: "Users can view their own profile" policy should ALWAYS work
-- because it doesn't need to query profiles table - it just compares auth.uid() with user_id

-- Drop and recreate the "same company" policy with explicit SECURITY DEFINER call
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;

-- Create a helper function that checks if two users are in the same company
-- This function will be called and won't trigger RLS because it's SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.users_share_company(_user_id_1 uuid, _user_id_2 uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p1, public.profiles p2
    WHERE p1.user_id = _user_id_1 
    AND p2.user_id = _user_id_2
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
$$;

-- Create policy using the new function
CREATE POLICY "Users can view profiles from same company" 
ON public.profiles 
FOR SELECT 
USING (
  public.users_share_company(auth.uid(), user_id)
);