-- Drop the existing policy that allows managers to view partners
DROP POLICY IF EXISTS "Authenticated managers and admins can view active partners" ON public.external_partners;

-- Create a new policy that only allows owner and admin to view partners
CREATE POLICY "Only Owner and Admin can view partners"
ON public.external_partners
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) 
  AND is_active = true 
  AND (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);