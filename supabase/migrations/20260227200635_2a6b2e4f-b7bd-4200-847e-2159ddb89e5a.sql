ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS origin_city text,
  ADD COLUMN IF NOT EXISTS pronoun text;