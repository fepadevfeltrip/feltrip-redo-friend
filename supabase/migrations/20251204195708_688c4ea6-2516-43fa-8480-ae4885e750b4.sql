-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;

-- Create a security definer function to get user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Create new policy using the function
CREATE POLICY "Users can view profiles from same company"
ON public.profiles
FOR SELECT
USING (
  company_id IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
);