-- Fix family_members RLS policies to use profile id lookup
DROP POLICY IF EXISTS "Primary users can view their family" ON public.family_members;
DROP POLICY IF EXISTS "Primary users can add family members" ON public.family_members;
DROP POLICY IF EXISTS "Primary users can update family members" ON public.family_members;
DROP POLICY IF EXISTS "Primary users can delete family members" ON public.family_members;

-- Create helper function to get profile id from user id
CREATE OR REPLACE FUNCTION public.get_profile_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Recreate policies using profile id lookup
CREATE POLICY "Primary users can view their family" 
ON public.family_members 
FOR SELECT 
USING (
  get_profile_id(auth.uid()) = primary_user_id 
  OR auth.uid() = user_id
);

CREATE POLICY "Primary users can add family members" 
ON public.family_members 
FOR INSERT 
WITH CHECK (get_profile_id(auth.uid()) = primary_user_id);

CREATE POLICY "Primary users can update family members" 
ON public.family_members 
FOR UPDATE 
USING (get_profile_id(auth.uid()) = primary_user_id);

CREATE POLICY "Primary users can delete family members" 
ON public.family_members 
FOR DELETE 
USING (get_profile_id(auth.uid()) = primary_user_id);

-- Fix family_invite_codes RLS policies too
DROP POLICY IF EXISTS "Users can view their own invite codes" ON public.family_invite_codes;
DROP POLICY IF EXISTS "Users can create invite codes" ON public.family_invite_codes;
DROP POLICY IF EXISTS "Users can update their own codes" ON public.family_invite_codes;
DROP POLICY IF EXISTS "Users can delete their own codes" ON public.family_invite_codes;

CREATE POLICY "Users can view their own invite codes" 
ON public.family_invite_codes 
FOR SELECT 
USING (get_profile_id(auth.uid()) = primary_user_id);

CREATE POLICY "Users can create invite codes" 
ON public.family_invite_codes 
FOR INSERT 
WITH CHECK (get_profile_id(auth.uid()) = primary_user_id);

CREATE POLICY "Users can update their own codes" 
ON public.family_invite_codes 
FOR UPDATE 
USING (get_profile_id(auth.uid()) = primary_user_id);

CREATE POLICY "Users can delete their own codes" 
ON public.family_invite_codes 
FOR DELETE 
USING (get_profile_id(auth.uid()) = primary_user_id);