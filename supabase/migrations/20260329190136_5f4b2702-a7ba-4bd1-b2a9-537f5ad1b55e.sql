
-- 1. Fix mrp_gems: restrict INSERT to authenticated users with owner check
DROP POLICY IF EXISTS "Users can create mrp gems" ON mrp_gems;
CREATE POLICY "Authenticated users can create their own mrp gems"
ON mrp_gems FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Fix affiliates: restrict SELECT to admins/owners only (edge function uses service role)
DROP POLICY IF EXISTS "Authenticated users can read affiliates" ON affiliates;
CREATE POLICY "Only admins can view affiliates"
ON affiliates FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix sales table: enable RLS and add policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales"
ON sales FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sales"
ON sales FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Fix expert_referrals: restrict public read to authenticated only
DROP POLICY IF EXISTS "Anyone can view verified referrals" ON expert_referrals;
CREATE POLICY "Authenticated users can view verified referrals"
ON expert_referrals FOR SELECT
TO authenticated
USING (is_verified = true);

-- 5. Fix registration_codes: restrict INSERT to managers/owners/admins only with role restrictions
DROP POLICY IF EXISTS "Users can insert codes for their company" ON registration_codes;
DROP POLICY IF EXISTS "Managers can create codes" ON registration_codes;

CREATE POLICY "Managers can create codes for their company"
ON registration_codes FOR INSERT
TO authenticated
WITH CHECK (
  company_id = get_user_company_id(auth.uid())
  AND (
    has_role(auth.uid(), 'manager'::app_role) OR
    has_role(auth.uid(), 'owner'::app_role) OR
    has_role(auth.uid(), 'admin'::app_role)
  )
  AND role IN ('expatriate'::app_role, 'community_member'::app_role)
);

CREATE POLICY "Owners can create any role codes"
ON registration_codes FOR INSERT
TO authenticated
WITH CHECK (
  (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);
