-- The old policy "Anyone can view active experts" still exists on concierge_experts
-- It targets {public} role. Drop it explicitly to ensure only the authenticated policy remains.
DROP POLICY IF EXISTS "Anyone can view active experts" ON concierge_experts;
