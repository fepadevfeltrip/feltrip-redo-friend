-- Managers can delete any likes from their company (for moderation)
CREATE POLICY "Managers can delete likes from their company"
ON public.map_pin_likes
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pin_likes.user_id
    AND p2.user_id = auth.uid()
  )
);

-- Managers can view all profiles in their company (for member management)
CREATE POLICY "Managers can view all company profiles"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  company_id = get_user_company_id(auth.uid())
);

-- Managers can delete posts from their company
CREATE POLICY "Managers can delete posts from their company"
ON public.community_posts
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = community_posts.user_id
    AND p2.user_id = auth.uid()
  )
);

-- Managers can delete events from their company
CREATE POLICY "Managers can delete events from their company"
ON public.community_events
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = community_events.user_id
    AND p2.user_id = auth.uid()
  )
);