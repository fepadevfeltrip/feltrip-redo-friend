
-- Drop old check constraint and add new one with all tiers
ALTER TABLE public.profiles DROP CONSTRAINT profiles_user_tier_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_tier_check 
  CHECK (user_tier = ANY (ARRAY['free'::text, 'premium_company'::text, 'premium_individual'::text, 'premium_company_plus_language'::text]));

-- Update talkawaylanguage user to the new tier
UPDATE public.profiles 
SET user_tier = 'premium_company_plus_language' 
WHERE user_id = '493d34f1-e7a5-4f84-8fee-dd09b80eaf75';

-- Create a table to track language studio subscriptions
CREATE TABLE public.language_studio_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  weekly_minutes_limit INTEGER NOT NULL DEFAULT 90,
  minutes_used_this_week INTEGER NOT NULL DEFAULT 0,
  week_reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('week', now()) + interval '7 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.language_studio_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.language_studio_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert subscriptions"
  ON public.language_studio_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update subscriptions"
  ON public.language_studio_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_language_studio_subscriptions_updated_at
  BEFORE UPDATE ON public.language_studio_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check language studio access
CREATE OR REPLACE FUNCTION public.check_language_studio_access(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tier text;
  v_sub language_studio_subscriptions%ROWTYPE;
  v_now timestamp with time zone := now();
BEGIN
  SELECT user_tier INTO v_tier FROM profiles WHERE user_id = p_user_id;
  
  IF v_tier = 'premium_company_plus_language' THEN
    RETURN jsonb_build_object(
      'has_access', true,
      'tier', v_tier,
      'unlimited', true
    );
  END IF;
  
  SELECT * INTO v_sub
  FROM language_studio_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > v_now
  ORDER BY expires_at DESC
  LIMIT 1;
  
  IF v_sub.id IS NULL THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'tier', v_tier,
      'reason', 'NO_SUBSCRIPTION'
    );
  END IF;
  
  IF v_sub.week_reset_at <= v_now THEN
    UPDATE language_studio_subscriptions
    SET minutes_used_this_week = 0,
        week_reset_at = date_trunc('week', v_now) + interval '7 days'
    WHERE id = v_sub.id;
    v_sub.minutes_used_this_week := 0;
  END IF;
  
  IF v_sub.minutes_used_this_week >= v_sub.weekly_minutes_limit THEN
    RETURN jsonb_build_object(
      'has_access', false,
      'tier', v_tier,
      'reason', 'WEEKLY_LIMIT_REACHED',
      'minutes_used', v_sub.minutes_used_this_week,
      'weekly_limit', v_sub.weekly_minutes_limit,
      'resets_at', v_sub.week_reset_at
    );
  END IF;
  
  RETURN jsonb_build_object(
    'has_access', true,
    'tier', v_tier,
    'unlimited', false,
    'subscription_id', v_sub.id,
    'minutes_used', v_sub.minutes_used_this_week,
    'minutes_remaining', v_sub.weekly_minutes_limit - v_sub.minutes_used_this_week,
    'weekly_limit', v_sub.weekly_minutes_limit,
    'expires_at', v_sub.expires_at
  );
END;
$$;
