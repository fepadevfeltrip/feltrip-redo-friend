
CREATE TABLE public.institutional_squads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institutional_email TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.institutional_squads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own squad entry"
  ON public.institutional_squads
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own squad entry"
  ON public.institutional_squads
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view squad count for their domain"
  ON public.institutional_squads
  FOR SELECT
  USING (domain IN (SELECT domain FROM public.institutional_squads WHERE user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.get_squad_count(p_domain TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM public.institutional_squads WHERE domain = p_domain;
$$;
