-- Drop the existing policy that allows access without explicit auth check
DROP POLICY IF EXISTS "Managers and admins can view active partners" ON public.external_partners;

-- Create new policy with explicit authentication requirement
CREATE POLICY "Authenticated managers and admins can view active partners" 
ON public.external_partners 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true 
  AND (
    has_role(auth.uid(), 'owner'::app_role) 
    OR has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'manager'::app_role)
  )
);