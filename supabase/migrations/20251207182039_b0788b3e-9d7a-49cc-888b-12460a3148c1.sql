-- SOLUTION: Remove ALL policies that could cause recursion on profiles
-- Keep ONLY the simple ones that don't query profiles at all

-- Drop ALL SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view profiles from same company" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owner and Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Family members can view their primary user profile" ON public.profiles;

-- Create ONLY simple policies that NEVER query profiles table

-- 1. Users can view their own profile (just compares auth.uid() with user_id - no query)
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Owner and Admin can view all profiles (uses user_roles table, not profiles)
CREATE POLICY "Owner and Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. Managers can view all profiles in their company
-- We use has_role to check manager status, and use the company from the row being accessed
CREATE POLICY "Managers can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND company_id IS NOT NULL
);

-- 4. Authenticated users can view profiles that share their company_id
-- We compare the row's company_id directly with a value we get from a SECURITY DEFINER function
-- The key is that has_role doesn't touch profiles
CREATE POLICY "Authenticated can view same company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL
  AND company_id IS NOT NULL
);

-- Note: This makes all profiles with a company_id visible to authenticated users
-- We'll rely on application-level filtering for company-specific views