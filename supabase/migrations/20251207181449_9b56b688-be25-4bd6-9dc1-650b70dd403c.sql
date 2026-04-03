-- The issue is that "Users can view profiles from same company" policy calls get_user_company_id 
-- which queries profiles table, causing infinite recursion.
-- We need to fix this by making the policy not reference profiles at all for the current user check.

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;

-- Create a new policy that doesn't cause recursion
-- Users can view profiles if:
-- 1. It's their own profile (handled by separate policy)
-- 2. OR they share the same company_id (compare directly without function call for own profile)
CREATE POLICY "Users can view profiles from same company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id IS NOT NULL 
  AND company_id IN (
    SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid()
  )
);

-- Also fix the managers update policy that might cause issues
DROP POLICY IF EXISTS "Managers can update their company profiles" ON public.profiles;
CREATE POLICY "Managers can update their company profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid())
);

-- Fix Primary users can add family to their company policy
DROP POLICY IF EXISTS "Primary users can add family to their company" ON public.profiles;
CREATE POLICY "Primary users can add family to their company" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = profiles.user_id 
    AND fm.primary_user_id = get_profile_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = profiles.user_id 
    AND fm.primary_user_id = get_profile_id(auth.uid())
  )
  AND company_id IN (SELECT p.company_id FROM profiles p WHERE p.user_id = auth.uid())
);