
-- Chat access table: tracks time-limited chat access per user
CREATE TABLE public.chat_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'gem_single',
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for quick lookups
CREATE INDEX idx_chat_access_user_id ON public.chat_access(user_id);

-- RLS
ALTER TABLE public.chat_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own chat access"
  ON public.chat_access FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert chat access"
  ON public.chat_access FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Grant free 24h chat access when anonymous user converts (enters email)
-- This is handled in frontend after email capture
