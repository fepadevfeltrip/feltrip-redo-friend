-- Fix: Update profiles without company_id to FELTRIP
UPDATE public.profiles 
SET company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1'
WHERE company_id IS NULL;

-- Allow managers to delete any comments from their company
CREATE POLICY "Managers can delete comments from their company"
ON public.map_pin_comments
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pin_comments.user_id
    AND p2.user_id = auth.uid()
  )
);

-- Allow managers to delete any pins from their company
CREATE POLICY "Managers can delete pins from their company"
ON public.map_pins
FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pins.user_id
    AND p2.user_id = auth.uid()
  )
);

-- Allow managers to update profiles in their company (to remove from community)
CREATE POLICY "Managers can update profiles in their company"
ON public.profiles
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role) AND
  company_id = get_user_company_id(auth.uid())
);