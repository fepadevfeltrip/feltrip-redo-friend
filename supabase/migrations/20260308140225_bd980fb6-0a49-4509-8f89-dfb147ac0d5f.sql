
-- Drop RLS policies on engagement_tracking that reference family_members
DROP POLICY IF EXISTS "Managers can view their company engagement (no family)" ON public.engagement_tracking;
DROP POLICY IF EXISTS "Owner and Admin can view all engagement (no family)" ON public.engagement_tracking;

-- Recreate without family_members filter
CREATE POLICY "Managers can view their company engagement" ON public.engagement_tracking
FOR SELECT USING (
  has_role(auth.uid(), 'manager'::app_role) AND EXISTS (
    SELECT 1 FROM profiles p1 JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = engagement_tracking.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Owner and Admin can view all engagement" ON public.engagement_tracking
FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Drop RLS policies on hr_shared_data that reference family_members
DROP POLICY IF EXISTS "Managers can view their company HR data (no family)" ON public.hr_shared_data;
DROP POLICY IF EXISTS "Owner and Admin can view all HR data (no family)" ON public.hr_shared_data;

CREATE POLICY "Managers can view their company HR data" ON public.hr_shared_data
FOR SELECT USING (
  has_role(auth.uid(), 'manager'::app_role) AND EXISTS (
    SELECT 1 FROM profiles p1 JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = hr_shared_data.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Owner and Admin can view all HR data" ON public.hr_shared_data
FOR SELECT USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Drop RLS policies on map_pins that reference family_members
DROP POLICY IF EXISTS "Managers can view their company HR pins (no family)" ON public.map_pins;
DROP POLICY IF EXISTS "Owner and Admin can view all HR pins (no family)" ON public.map_pins;

CREATE POLICY "Managers can view their company HR pins" ON public.map_pins
FOR SELECT USING (
  is_shared_with_hr = true AND has_role(auth.uid(), 'manager'::app_role) AND EXISTS (
    SELECT 1 FROM profiles p1 JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pins.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Owner and Admin can view all HR pins" ON public.map_pins
FOR SELECT USING (
  is_shared_with_hr = true AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Drop family_invite_codes table (if exists)
DROP TABLE IF EXISTS public.family_invite_codes CASCADE;

-- Drop family_members table
DROP TABLE IF EXISTS public.family_members CASCADE;

-- Drop travel_documents table
DROP TABLE IF EXISTS public.travel_documents CASCADE;

-- Drop feltrip_local_picks table
DROP TABLE IF EXISTS public.feltrip_local_picks CASCADE;

-- Drop use_family_invite_code function
DROP FUNCTION IF EXISTS public.use_family_invite_code(text, uuid);
