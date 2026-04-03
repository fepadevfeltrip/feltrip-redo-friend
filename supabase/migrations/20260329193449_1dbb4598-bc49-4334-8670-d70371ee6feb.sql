-- Fix: Restrict concierge_experts SELECT to authenticated users only
-- This prevents anonymous users from reading phone numbers and emails

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view active experts" ON concierge_experts;
DROP POLICY IF EXISTS "Public can view active experts" ON concierge_experts;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can view active experts"
ON concierge_experts
FOR SELECT
TO authenticated
USING (is_active = true);
