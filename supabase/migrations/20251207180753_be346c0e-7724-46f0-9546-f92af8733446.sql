-- Drop problematic policies on community_posts
DROP POLICY IF EXISTS "Users can view posts from their company" ON public.community_posts;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Users can view posts from their company" 
ON public.community_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = community_posts.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
);

-- Drop problematic policies on community_events
DROP POLICY IF EXISTS "Users can view events from their company" ON public.community_events;

-- Create a simpler policy that avoids recursion
CREATE POLICY "Users can view events from their company" 
ON public.community_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles p1, profiles p2
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = community_events.user_id
    AND p1.company_id = p2.company_id
    AND p1.company_id IS NOT NULL
  )
);