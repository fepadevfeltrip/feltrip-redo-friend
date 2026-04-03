-- Drop and recreate policies using security definer function to avoid recursion

-- Fix community_posts policies
DROP POLICY IF EXISTS "Users can view posts from their company" ON public.community_posts;

CREATE POLICY "Users can view posts from their company" 
ON public.community_posts 
FOR SELECT 
USING (
  get_user_company_id(auth.uid()) IS NOT NULL 
  AND get_user_company_id(auth.uid()) = get_user_company_id(user_id)
);

-- Fix community_events policies  
DROP POLICY IF EXISTS "Users can view events from their company" ON public.community_events;

CREATE POLICY "Users can view events from their company" 
ON public.community_events 
FOR SELECT 
USING (
  get_user_company_id(auth.uid()) IS NOT NULL 
  AND get_user_company_id(auth.uid()) = get_user_company_id(user_id)
);

-- Fix other policies that might have similar issues
DROP POLICY IF EXISTS "Managers can delete their community posts" ON public.community_posts;
CREATE POLICY "Managers can delete their community posts" 
ON public.community_posts 
FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND get_user_company_id(auth.uid()) = get_user_company_id(user_id)
);

DROP POLICY IF EXISTS "Managers can delete their community events" ON public.community_events;
CREATE POLICY "Managers can delete their community events" 
ON public.community_events 
FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND get_user_company_id(auth.uid()) = get_user_company_id(user_id)
);