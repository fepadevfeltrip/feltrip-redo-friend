-- Drop all policies on community_groups
DROP POLICY IF EXISTS "Managers can create groups" ON public.community_groups;
DROP POLICY IF EXISTS "Managers can view company groups" ON public.community_groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.community_groups;
DROP POLICY IF EXISTS "Managers can update groups" ON public.community_groups;
DROP POLICY IF EXISTS "Managers can delete groups" ON public.community_groups;

-- Recreate simple policies that don't cause recursion

-- INSERT: Only managers can create, check is simple
CREATE POLICY "Managers can create groups" 
ON public.community_groups 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) AND auth.uid() = created_by
);

-- SELECT for managers - simple role check, no table references
CREATE POLICY "Managers can view all groups" 
ON public.community_groups 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role));

-- SELECT for members - reference community_group_members with explicit alias
CREATE POLICY "Members can view joined groups" 
ON public.community_groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = community_groups.id AND m.user_id = auth.uid()
  )
);

-- UPDATE: Only managers
CREATE POLICY "Managers can update groups" 
ON public.community_groups 
FOR UPDATE 
USING (has_role(auth.uid(), 'manager'::app_role));

-- DELETE: Only managers
CREATE POLICY "Managers can delete groups" 
ON public.community_groups 
FOR DELETE 
USING (has_role(auth.uid(), 'manager'::app_role));