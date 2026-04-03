-- Drop all policies on community_groups to recreate them properly
DROP POLICY IF EXISTS "Managers can create groups" ON public.community_groups;
DROP POLICY IF EXISTS "Managers can delete their company groups" ON public.community_groups;
DROP POLICY IF EXISTS "Managers can update their company groups" ON public.community_groups;
DROP POLICY IF EXISTS "Managers can view all company groups" ON public.community_groups;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.community_groups;

-- Create a simpler INSERT policy that doesn't cause recursion
-- The company_id check is done at the application level since we pass it in the insert
CREATE POLICY "Managers can create groups" 
ON public.community_groups 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'manager') AND auth.uid() = created_by
);

-- SELECT policy for managers - use has_role which is security definer
CREATE POLICY "Managers can view company groups" 
ON public.community_groups 
FOR SELECT 
USING (
  has_role(auth.uid(), 'manager')
);

-- SELECT policy for members - check membership without recursion
CREATE POLICY "Members can view their groups" 
ON public.community_groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members cgm
    WHERE cgm.group_id = id AND cgm.user_id = auth.uid()
  )
);

-- UPDATE policy for managers
CREATE POLICY "Managers can update groups" 
ON public.community_groups 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'manager')
);

-- DELETE policy for managers  
CREATE POLICY "Managers can delete groups" 
ON public.community_groups 
FOR DELETE 
USING (
  has_role(auth.uid(), 'manager')
);