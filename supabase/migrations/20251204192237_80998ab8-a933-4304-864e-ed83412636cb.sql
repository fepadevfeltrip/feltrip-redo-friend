-- Drop the old constraint and add one with all valid types
ALTER TABLE public.map_pins DROP CONSTRAINT IF EXISTS map_pins_type_check;

ALTER TABLE public.map_pins ADD CONSTRAINT map_pins_type_check 
CHECK (type = ANY (ARRAY['anotacao', 'lugar', 'evento', 'safe', 'alert', 'danger']));