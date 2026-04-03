-- Add RLS policy for managers to view map_pins
CREATE POLICY "Managers can view all map pins"
ON public.map_pins
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));