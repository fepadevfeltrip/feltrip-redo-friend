-- Add community sharing to map_pins
ALTER TABLE public.map_pins 
ADD COLUMN is_shared_to_community boolean NOT NULL DEFAULT false;

-- Create map pin comments table
CREATE TABLE public.map_pin_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_pin_id uuid NOT NULL REFERENCES public.map_pins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create map pin likes table
CREATE TABLE public.map_pin_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_pin_id uuid NOT NULL REFERENCES public.map_pins(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(map_pin_id, user_id)
);

-- Enable RLS
ALTER TABLE public.map_pin_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_pin_likes ENABLE ROW LEVEL SECURITY;

-- RLS for viewing shared map pins from same company
CREATE POLICY "Users can view shared pins from their company"
ON public.map_pins
FOR SELECT
USING (
  is_shared_to_community = true 
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = auth.uid() 
    AND p2.user_id = map_pins.user_id
  )
);

-- RLS for comments
CREATE POLICY "Users can view comments on shared pins from their company"
ON public.map_pin_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM map_pins mp
    JOIN profiles p1 ON p1.user_id = mp.user_id
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE mp.id = map_pin_comments.map_pin_id
    AND mp.is_shared_to_community = true
    AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create comments on shared pins from their company"
ON public.map_pin_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM map_pins mp
    JOIN profiles p1 ON p1.user_id = mp.user_id
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE mp.id = map_pin_comments.map_pin_id
    AND mp.is_shared_to_community = true
    AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own comments"
ON public.map_pin_comments
FOR DELETE
USING (auth.uid() = user_id);

-- RLS for likes
CREATE POLICY "Users can view likes on shared pins from their company"
ON public.map_pin_likes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM map_pins mp
    JOIN profiles p1 ON p1.user_id = mp.user_id
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE mp.id = map_pin_likes.map_pin_id
    AND mp.is_shared_to_community = true
    AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can like shared pins from their company"
ON public.map_pin_likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM map_pins mp
    JOIN profiles p1 ON p1.user_id = mp.user_id
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE mp.id = map_pin_likes.map_pin_id
    AND mp.is_shared_to_community = true
    AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can remove their own likes"
ON public.map_pin_likes
FOR DELETE
USING (auth.uid() = user_id);