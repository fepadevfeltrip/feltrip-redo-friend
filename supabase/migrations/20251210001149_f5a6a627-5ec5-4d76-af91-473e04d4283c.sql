-- Drop existing policies for group_members
DROP POLICY IF EXISTS "Users can join groups from their company" ON public.community_group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.community_group_members;
DROP POLICY IF EXISTS "Users can view members of groups they can see" ON public.community_group_members;

-- Drop existing policies for groups
DROP POLICY IF EXISTS "Users can view groups from their company" ON public.community_groups;

-- New policy: Users can only view groups they are members of
CREATE POLICY "Users can view groups they are members of"
ON public.community_groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = id AND m.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'manager'::app_role)
);

-- Only managers can add members to groups
CREATE POLICY "Managers can add members to groups"
ON public.community_group_members FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id AND g.company_id = get_user_company_id(auth.uid())
  )
);

-- Managers can remove members
CREATE POLICY "Managers can remove members from groups"
ON public.community_group_members FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id AND g.company_id = get_user_company_id(auth.uid())
  )
);

-- Users can view members of groups they belong to
CREATE POLICY "Members can view group members"
ON public.community_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = community_group_members.group_id AND m.user_id = auth.uid()
  )
  OR has_role(auth.uid(), 'manager'::app_role)
);

-- Update group posts policy to allow all members to see posts (not just their own membership check)
DROP POLICY IF EXISTS "Members can view group posts" ON public.community_group_posts;

CREATE POLICY "Members can view group posts"
ON public.community_group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = community_group_posts.group_id AND m.user_id = auth.uid()
  )
  OR (
    has_role(auth.uid(), 'manager'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.community_groups g
      WHERE g.id = community_group_posts.group_id AND g.company_id = get_user_company_id(auth.uid())
    )
  )
);

-- Members can create posts in groups they belong to
DROP POLICY IF EXISTS "Members can create posts in their groups" ON public.community_group_posts;

CREATE POLICY "Members can create posts in their groups"
ON public.community_group_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = community_group_posts.group_id AND m.user_id = auth.uid()
  )
);