-- Allow users to view profiles from the same company
CREATE POLICY "Users can view profiles from same company"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p1
    WHERE p1.user_id = auth.uid()
    AND p1.company_id IS NOT NULL
    AND p1.company_id = profiles.company_id
  )
);