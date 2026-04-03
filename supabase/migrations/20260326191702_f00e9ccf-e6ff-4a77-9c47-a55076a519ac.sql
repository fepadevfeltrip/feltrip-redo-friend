ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read affiliates"
ON public.affiliates
FOR SELECT
TO authenticated
USING (true);