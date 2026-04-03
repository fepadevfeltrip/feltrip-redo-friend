-- Add field to track if pin is shared with HR
ALTER TABLE public.map_pins 
ADD COLUMN IF NOT EXISTS is_shared_with_hr boolean NOT NULL DEFAULT false;

-- Create index for HR queries
CREATE INDEX IF NOT EXISTS idx_map_pins_shared_hr ON public.map_pins(is_shared_with_hr) WHERE is_shared_with_hr = true;

-- Update RLS policy for HR to only see pins shared with them
DROP POLICY IF EXISTS "Managers can view all map pins" ON public.map_pins;

CREATE POLICY "Managers can view pins shared with HR" 
ON public.map_pins 
FOR SELECT 
USING (
  is_shared_with_hr = true 
  AND has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = auth.uid() AND p2.user_id = map_pins.user_id
  )
);