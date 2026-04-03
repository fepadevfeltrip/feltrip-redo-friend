-- Drop problematic policies with infinite recursion
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.community_groups;
DROP POLICY IF EXISTS "Members can view group members" ON public.community_group_members;

-- Recreate policy for community_groups - managers see all company groups, users see groups they're in
CREATE POLICY "Managers can view all company groups" 
ON public.community_groups 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager') AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Users can view groups they are members of" 
ON public.community_groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members cgm
    WHERE cgm.group_id = community_groups.id AND cgm.user_id = auth.uid()
  )
);

-- Recreate policy for community_group_members - avoid self-reference
CREATE POLICY "Members can view their own group memberships" 
ON public.community_group_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Managers can view all memberships in company groups" 
ON public.community_group_members 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager') AND 
  EXISTS (
    SELECT 1 FROM public.community_groups g 
    WHERE g.id = community_group_members.group_id AND g.company_id = get_user_company_id(auth.uid())
  )
);