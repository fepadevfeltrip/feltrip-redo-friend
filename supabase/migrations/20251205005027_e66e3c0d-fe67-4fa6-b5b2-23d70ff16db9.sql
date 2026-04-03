-- Drop old credits system
DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
DROP TRIGGER IF EXISTS update_user_credits_updated_at ON public.user_credits;
DROP FUNCTION IF EXISTS public.give_initial_credits();
DROP FUNCTION IF EXISTS public.use_ai_credit(uuid, integer, text);
DROP FUNCTION IF EXISTS public.add_credits(uuid, integer, text, text);
DROP TABLE IF EXISTS public.credit_transactions;
DROP TABLE IF EXISTS public.user_credits;

-- Create new time-based usage system
CREATE TABLE public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  minutes_used_this_month integer NOT NULL DEFAULT 0,
  monthly_limit_minutes integer NOT NULL DEFAULT 240, -- 240 minutos/mês padrão
  total_minutes_used integer NOT NULL DEFAULT 0,
  current_period_start date NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create usage log table for detailed tracking
CREATE TABLE public.usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  duration_seconds integer NOT NULL,
  ai_function text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_log ENABLE ROW LEVEL SECURITY;

-- Policies for user_usage
CREATE POLICY "Users can view their own usage"
ON public.user_usage FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
ON public.user_usage FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update usage"
ON public.user_usage FOR UPDATE
USING (auth.uid() = user_id);

-- Policies for usage_log
CREATE POLICY "Users can view their own log"
ON public.usage_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert log"
ON public.usage_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers can view all usage
CREATE POLICY "Managers can view all usage"
ON public.user_usage FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update usage"
ON public.user_usage FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can view all logs"
ON public.usage_log FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

-- Function to check and use AI time
CREATE OR REPLACE FUNCTION public.use_ai_time(
  p_user_id uuid,
  p_duration_seconds integer,
  p_ai_function text DEFAULT 'ai_call'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage user_usage%ROWTYPE;
  v_minutes_to_add integer;
  v_new_period_start date;
BEGIN
  v_minutes_to_add := CEIL(p_duration_seconds::numeric / 60);
  v_new_period_start := date_trunc('month', CURRENT_DATE)::date;

  -- Get or create usage record
  SELECT * INTO v_usage
  FROM public.user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.user_usage (user_id, minutes_used_this_month, current_period_start)
    VALUES (p_user_id, 0, v_new_period_start)
    RETURNING * INTO v_usage;
  END IF;

  -- Reset if new month
  IF v_usage.current_period_start < v_new_period_start THEN
    UPDATE public.user_usage
    SET 
      minutes_used_this_month = 0,
      current_period_start = v_new_period_start,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_usage;
  END IF;

  -- Check if enough time available
  IF v_usage.minutes_used_this_month + v_minutes_to_add > v_usage.monthly_limit_minutes THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'LIMIT_EXCEEDED',
      'minutes_remaining', v_usage.monthly_limit_minutes - v_usage.minutes_used_this_month,
      'monthly_limit', v_usage.monthly_limit_minutes
    );
  END IF;

  -- Deduct time
  UPDATE public.user_usage
  SET 
    minutes_used_this_month = minutes_used_this_month + v_minutes_to_add,
    total_minutes_used = total_minutes_used + v_minutes_to_add,
    updated_at = now()
  WHERE user_id = p_user_id;

  -- Log usage
  INSERT INTO public.usage_log (user_id, duration_seconds, ai_function)
  VALUES (p_user_id, p_duration_seconds, p_ai_function);

  RETURN jsonb_build_object(
    'success', true,
    'minutes_used', v_minutes_to_add,
    'minutes_remaining', v_usage.monthly_limit_minutes - v_usage.minutes_used_this_month - v_minutes_to_add,
    'monthly_limit', v_usage.monthly_limit_minutes
  );
END;
$$;

-- Function to check remaining time (without deducting)
CREATE OR REPLACE FUNCTION public.check_ai_time(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage user_usage%ROWTYPE;
  v_new_period_start date;
BEGIN
  v_new_period_start := date_trunc('month', CURRENT_DATE)::date;

  SELECT * INTO v_usage
  FROM public.user_usage
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_usage (user_id, minutes_used_this_month, current_period_start)
    VALUES (p_user_id, 0, v_new_period_start)
    RETURNING * INTO v_usage;
  END IF;

  -- Reset if new month
  IF v_usage.current_period_start < v_new_period_start THEN
    UPDATE public.user_usage
    SET 
      minutes_used_this_month = 0,
      current_period_start = v_new_period_start,
      updated_at = now()
    WHERE user_id = p_user_id
    RETURNING * INTO v_usage;
  END IF;

  RETURN jsonb_build_object(
    'minutes_used', v_usage.minutes_used_this_month,
    'minutes_remaining', v_usage.monthly_limit_minutes - v_usage.minutes_used_this_month,
    'monthly_limit', v_usage.monthly_limit_minutes,
    'period_start', v_usage.current_period_start
  );
END;
$$;

-- Function to set user limit (for managers)
CREATE OR REPLACE FUNCTION public.set_user_ai_limit(
  p_user_id uuid,
  p_monthly_limit integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, monthly_limit_minutes)
  VALUES (p_user_id, p_monthly_limit)
  ON CONFLICT (user_id) DO UPDATE SET
    monthly_limit_minutes = p_monthly_limit,
    updated_at = now();
  
  RETURN true;
END;
$$;

-- Trigger for new users - give them default limit
CREATE OR REPLACE FUNCTION public.create_user_usage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, monthly_limit_minutes)
  VALUES (NEW.id, 240) -- 240 minutos/mês padrão (4 horas)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_usage();

-- Update timestamp trigger
CREATE TRIGGER update_user_usage_updated_at
BEFORE UPDATE ON public.user_usage
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();