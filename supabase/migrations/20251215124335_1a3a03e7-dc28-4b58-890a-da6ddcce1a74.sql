-- Update RLS policies to exclude family members from HR data

-- Drop existing policies for hr_shared_data
DROP POLICY IF EXISTS "Managers can view their company HR data" ON public.hr_shared_data;
DROP POLICY IF EXISTS "Owner and Admin can view all HR data" ON public.hr_shared_data;

-- Create new policies that exclude family members
CREATE POLICY "Managers can view their company HR data (no family)"
ON public.hr_shared_data
FOR SELECT
USING (
  has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = hr_shared_data.user_id
    AND p2.user_id = auth.uid()
  )
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = hr_shared_data.user_id
  )
);

CREATE POLICY "Owner and Admin can view all HR data (no family)"
ON public.hr_shared_data
FOR SELECT
USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = hr_shared_data.user_id
  )
);

-- Drop existing policies for workplace_hr_shared_data
DROP POLICY IF EXISTS "Managers can view their company HR data" ON public.workplace_hr_shared_data;
DROP POLICY IF EXISTS "Owner and Admin can view all HR data" ON public.workplace_hr_shared_data;

-- Create new policies that exclude family members
CREATE POLICY "Managers can view their company workplace data (no family)"
ON public.workplace_hr_shared_data
FOR SELECT
USING (
  has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = workplace_hr_shared_data.user_id
    AND p2.user_id = auth.uid()
  )
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = workplace_hr_shared_data.user_id
  )
);

CREATE POLICY "Owner and Admin can view all workplace data (no family)"
ON public.workplace_hr_shared_data
FOR SELECT
USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = workplace_hr_shared_data.user_id
  )
);

-- Also update engagement_tracking policies to exclude family members
DROP POLICY IF EXISTS "Managers can view their company engagement" ON public.engagement_tracking;
DROP POLICY IF EXISTS "Owner and Admin can view all engagement" ON public.engagement_tracking;

CREATE POLICY "Managers can view their company engagement (no family)"
ON public.engagement_tracking
FOR SELECT
USING (
  has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = engagement_tracking.user_id
    AND p2.user_id = auth.uid()
  )
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = engagement_tracking.user_id
  )
);

CREATE POLICY "Owner and Admin can view all engagement (no family)"
ON public.engagement_tracking
FOR SELECT
USING (
  (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = engagement_tracking.user_id
  )
);

-- Update map_pins HR policies to exclude family members
DROP POLICY IF EXISTS "Managers can view their company HR pins" ON public.map_pins;
DROP POLICY IF EXISTS "Owner and Admin can view all HR pins" ON public.map_pins;

CREATE POLICY "Managers can view their company HR pins (no family)"
ON public.map_pins
FOR SELECT
USING (
  is_shared_with_hr = true
  AND has_role(auth.uid(), 'manager')
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pins.user_id
    AND p2.user_id = auth.uid()
  )
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = map_pins.user_id
  )
);

CREATE POLICY "Owner and Admin can view all HR pins (no family)"
ON public.map_pins
FOR SELECT
USING (
  is_shared_with_hr = true
  AND (has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
  -- Exclude family members
  AND NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = map_pins.user_id
  )
);