-- Remove the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read active invite links for validation" ON public.community_invite_links;

-- The validate_invite_link function already exists and uses SECURITY DEFINER
-- Users can validate links via the RPC function, no need for public SELECT access
-- Only managers/owners/admins can view links for their company (policy already exists)