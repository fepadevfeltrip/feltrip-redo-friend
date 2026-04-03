
-- =============================================
-- 1. FIX: Registration codes overly permissive policies
-- =============================================
DROP POLICY IF EXISTS "Users can create codes for their company" ON public.registration_codes;
DROP POLICY IF EXISTS "Users can update their company codes" ON public.registration_codes;

-- Add properly scoped UPDATE policy for managers/owners/admins only
CREATE POLICY "Managers can update company codes"
ON public.registration_codes FOR UPDATE
TO authenticated
USING (
  (has_role(auth.uid(), 'manager'::app_role) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND (company_id = get_user_company_id(auth.uid()) OR has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- =============================================
-- 2. FIX: Concierge experts contact data exposure
-- =============================================
-- Create a safe view that hides contact details from non-admin users
CREATE OR REPLACE VIEW public.concierge_experts_safe AS
SELECT 
  id,
  full_name,
  specialty,
  city,
  bio,
  bio_en,
  bio_es,
  avatar_url,
  categories,
  languages,
  slug,
  avg_rating,
  total_reviews,
  is_active,
  is_community_verified,
  is_cult_approved,
  is_feltrip_indicated,
  verification_date,
  website,
  instagram,
  created_at,
  updated_at,
  -- Only expose contact details to admin/owner
  CASE WHEN has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
    THEN email ELSE NULL END AS email,
  CASE WHEN has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
    THEN phone ELSE NULL END AS phone
FROM public.concierge_experts
WHERE is_active = true;

-- =============================================
-- 3. FIX: Institutional squads PII exposure
-- =============================================
DROP POLICY IF EXISTS "Users can view squad count for their domain" ON public.institutional_squads;

-- Replace with a policy that only shows the user's own entry
-- The get_squad_count() security definer function already handles domain counting safely
CREATE POLICY "Users can view their domain squad entries"
ON public.institutional_squads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- 4. FIX: Always-true RLS policies (replace with authenticated-scoped)
-- =============================================

-- community_groups: USING (true) → keep for authenticated (community is public/free)
-- This is intentional for the open community model, but scoping to authenticated role
DROP POLICY IF EXISTS "Authenticated users can view all community groups" ON public.community_groups;
CREATE POLICY "Authenticated users can view all community groups"
ON public.community_groups FOR SELECT
TO authenticated
USING (true);

-- community_events: same pattern
DROP POLICY IF EXISTS "Authenticated users can view all community events" ON public.community_events;
CREATE POLICY "Authenticated users can view all community events"
ON public.community_events FOR SELECT
TO authenticated
USING (true);

-- community_posts: same pattern
DROP POLICY IF EXISTS "Authenticated users can view all community posts" ON public.community_posts;
CREATE POLICY "Authenticated users can view all community posts"
ON public.community_posts FOR SELECT
TO authenticated
USING (true);

-- =============================================
-- 5. FIX: Storage policies - tighten from {public} to {authenticated}
-- =============================================
-- Delete operations should require authentication
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;
CREATE POLICY "Users can delete their own audio"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'map-audio' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'map-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can view their own audio" ON storage.objects;
CREATE POLICY "Users can view their own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'map-audio' AND (auth.uid())::text = (storage.foldername(name))[1]);
