ALTER TABLE public.city_questionnaires 
  ADD COLUMN generation text,
  ADD COLUMN gender text,
  ADD COLUMN journey_identities text[] DEFAULT '{}'::text[];