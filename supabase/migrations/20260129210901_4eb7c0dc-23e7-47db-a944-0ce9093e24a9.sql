-- Create a security definer function that returns partners without sensitive data
-- This is the secure way to hide email/phone from managers while still allowing access
CREATE OR REPLACE FUNCTION public.get_partners_safe()
RETURNS TABLE (
  id uuid,
  name text,
  specialty text,
  city text,
  website text,
  observations text,
  is_remote boolean,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    specialty,
    city,
    website,
    observations,
    is_remote,
    is_active,
    created_at,
    updated_at
  FROM public.external_partners
  WHERE is_active = true
$$;

-- Create a function to get full partner details (including email/phone) for owner/admin only
CREATE OR REPLACE FUNCTION public.get_partners_full()
RETURNS TABLE (
  id uuid,
  name text,
  specialty text,
  city text,
  website text,
  observations text,
  is_remote boolean,
  is_active boolean,
  email text,
  phone text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    name,
    specialty,
    city,
    website,
    observations,
    is_remote,
    is_active,
    email,
    phone,
    created_at,
    updated_at
  FROM public.external_partners
  WHERE is_active = true
    AND (
      has_role(auth.uid(), 'owner'::app_role) 
      OR has_role(auth.uid(), 'admin'::app_role)
    )
$$;

-- Update the SELECT policy - managers see the table but email/phone columns are effectively hidden via the function
-- The direct table access is still owner/admin only for the full data
DROP POLICY IF EXISTS "Only Owner and Admin can view partners" ON public.external_partners;

-- Recreate the policy - owner/admin get full access via direct query
-- Managers should use the get_partners_safe() function instead
CREATE POLICY "Owner and Admin can view all partner data"
ON public.external_partners
FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);