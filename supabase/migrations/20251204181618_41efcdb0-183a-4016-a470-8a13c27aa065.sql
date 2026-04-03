-- Allow family members to view their primary user's profile
CREATE POLICY "Family members can view their primary user profile"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.user_id = auth.uid()
    AND fm.primary_user_id = profiles.id
  )
);