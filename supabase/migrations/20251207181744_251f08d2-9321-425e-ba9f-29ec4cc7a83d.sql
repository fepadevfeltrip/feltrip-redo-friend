-- Fix ALL profiles SELECT policies to avoid infinite recursion
-- The issue is that subqueries on profiles table trigger RLS, causing recursion
-- We MUST use SECURITY DEFINER functions instead

-- Drop ALL SELECT policies on profiles and recreate them properly
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner and Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view their primary user profile" ON public.profiles;

-- Recreate with proper non-recursive logic
-- 1. Users can always view their own profile (simple, no recursion)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can view profiles from same company using SECURITY DEFINER function
-- get_user_company_id bypasses RLS because it's SECURITY DEFINER
CREATE POLICY "Users can view profiles from same company" 
ON public.profiles 
FOR SELECT 
USING (
  company_id IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid())
);

-- 3. Owner and Admin can view all profiles
CREATE POLICY "Owner and Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 4. Family members can view their primary user's profile (using security definer)
CREATE POLICY "Family members can view their primary user profile" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = auth.uid() AND fm.primary_user_id = profiles.id
  )
);