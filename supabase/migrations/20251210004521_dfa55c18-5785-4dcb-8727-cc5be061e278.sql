-- Drop policies on community_group_members that cause circular reference
DROP POLICY IF EXISTS "Managers can add members to groups" ON public.community_group_members;
DROP POLICY IF EXISTS "Managers can remove members from groups" ON public.community_group_members;
DROP POLICY IF EXISTS "Managers can view all memberships in company groups" ON public.community_group_members;
DROP POLICY IF EXISTS "Members can view their own group memberships" ON public.community_group_members;

-- Recreate simpler policies without referencing community_groups

-- Managers can view all memberships (simple role check)
CREATE POLICY "Managers can view memberships" 
ON public.community_group_members 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'::app_role));

-- Members can view their own memberships
CREATE POLICY "Members can view own memberships" 
ON public.community_group_members 
FOR SELECT 
USING (user_id = auth.uid());

-- Managers can add members (simple role check)
CREATE POLICY "Managers can add members" 
ON public.community_group_members 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

-- Managers can remove members (simple role check)
CREATE POLICY "Managers can remove members" 
ON public.community_group_members 
FOR DELETE 
USING (has_role(auth.uid(), 'manager'::app_role));