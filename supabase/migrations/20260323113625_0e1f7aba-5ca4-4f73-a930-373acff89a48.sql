-- Track personal map purchases (per user per city)
CREATE TABLE IF NOT EXISTS public.map_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  purchase_type TEXT NOT NULL DEFAULT 'personal_map',
  city TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.map_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own map purchases"
  ON public.map_purchases FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- System inserts via service role (webhook), but also allow authenticated insert
CREATE POLICY "Users can insert own map purchases"
  ON public.map_purchases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- For Explorer plan: track remaining maps in the 30-day window
-- We'll count from map_purchases where created_at > subscription start