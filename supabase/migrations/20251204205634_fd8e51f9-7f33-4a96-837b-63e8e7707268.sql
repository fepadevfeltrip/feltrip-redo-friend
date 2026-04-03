-- Allow primary users to update their family members' company_id (to add them to community)
CREATE POLICY "Primary users can add family to their company"
ON public.profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    JOIN profiles p ON p.id = fm.primary_user_id
    WHERE fm.user_id = profiles.user_id
    AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM family_members fm
    JOIN profiles p ON p.id = fm.primary_user_id
    WHERE fm.user_id = profiles.user_id
    AND p.user_id = auth.uid()
  )
  AND company_id = get_user_company_id(auth.uid())
);