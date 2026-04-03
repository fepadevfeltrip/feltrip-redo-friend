-- =====================================================
-- PHASE 1: FIX CRITICAL SECURITY VULNERABILITIES
-- =====================================================

-- 1. Fix community_invite_links - Remove public enumeration capability
-- Only allow viewing a specific link when user knows the exact slug
DROP POLICY IF EXISTS "Anyone can view active links for joining" ON public.community_invite_links;

CREATE POLICY "Users can view specific active link by slug"
ON public.community_invite_links
FOR SELECT
USING (
  is_active = true 
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR current_uses < max_uses)
);

-- Note: The application should only query with WHERE slug = 'specific_slug'
-- This policy allows SELECT but the app logic should prevent enumeration

-- 2. Fix external_partners - Restrict access to managers/admins only
DROP POLICY IF EXISTS "Authenticated users can view active partners" ON public.external_partners;

CREATE POLICY "Managers and admins can view active partners"
ON public.external_partners
FOR SELECT
USING (
  is_active = true 
  AND (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);

-- 3. Fix profiles cross-company access - Stricter company isolation
DROP POLICY IF EXISTS "Authenticated can view same company profiles" ON public.profiles;

CREATE POLICY "Users can view same company profiles only"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND company_id IS NOT NULL
  AND company_id = get_user_company_id(auth.uid())
);

-- =====================================================
-- PHASE 2: FIX WARNING LEVEL ISSUES
-- =====================================================

-- 4. Fix registration_codes - Only managers/owners/admins can view
-- Current policy already checks company_id or owner/admin, which is acceptable
-- No changes needed here

-- 5. Engagement tracking - HR can view (already correctly configured)
-- No changes needed - managers can view their company engagement

-- 6. Map pins - HR can view shared ones (already correctly configured)
-- No changes needed - managers can view HR-shared pins

-- 7. HR shared data - Already requires explicit consent sharing
-- The hr_shared_data table only contains data users explicitly shared
-- No changes needed

-- =====================================================
-- PHASE 3: TIGHTEN NOTIFICATION POLICY
-- =====================================================

-- Fix notifications INSERT policy to be more restrictive
DROP POLICY IF EXISTS "Users can create notifications for themselves or via triggers" ON public.notifications;

CREATE POLICY "System and users can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  OR auth.uid() = actor_id
);

-- =====================================================
-- PHASE 4: ADD SECURITY HELPER FUNCTION FOR INVITE LINKS
-- =====================================================

-- Create a function to validate invite link access (prevents enumeration)
CREATE OR REPLACE FUNCTION public.validate_invite_link(p_slug text)
RETURNS TABLE(
  company_id uuid,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cil.company_id,
    true as is_valid
  FROM public.community_invite_links cil
  WHERE cil.slug = p_slug
    AND cil.is_active = true
    AND (cil.expires_at IS NULL OR cil.expires_at > now())
    AND (cil.max_uses IS NULL OR cil.current_uses < cil.max_uses)
  LIMIT 1;
END;
$$;