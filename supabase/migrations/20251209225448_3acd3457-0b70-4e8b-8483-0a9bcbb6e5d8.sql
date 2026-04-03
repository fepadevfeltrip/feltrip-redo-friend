-- Allow anyone to read invite links for validation (only active ones)
CREATE POLICY "Anyone can read active invite links for validation" 
ON public.community_invite_links 
FOR SELECT 
USING (is_active = true);