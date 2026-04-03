-- Create function to update timestamps (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create a dedicated table for user annotations (completely private)
CREATE TABLE public.user_annotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  type TEXT NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'language')),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;

-- Create strict RLS policies - ONLY the owner can access their own annotations
-- No manager access, completely private

CREATE POLICY "Users can view only their own annotations"
ON public.user_annotations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own annotations"
ON public.user_annotations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
ON public.user_annotations
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
ON public.user_annotations
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_annotations_updated_at
BEFORE UPDATE ON public.user_annotations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();