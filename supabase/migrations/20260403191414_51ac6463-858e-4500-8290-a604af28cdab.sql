
DROP FUNCTION IF EXISTS public.check_language_studio_access(uuid);

CREATE FUNCTION public.check_language_studio_access(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_minutes_used NUMERIC;
  v_month_start TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_sub
  FROM language_studio_subscriptions
  WHERE user_id = p_user_id
    AND is_active = true
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_sub IS NULL THEN
    RETURN json_build_object(
      'has_access', false,
      'reason', 'no_active_subscription'
    );
  END IF;

  v_month_start := date_trunc('month', now());

  SELECT COALESCE(SUM(duration_seconds) / 60.0, 0)
  INTO v_minutes_used
  FROM usage_log
  WHERE user_id = p_user_id
    AND ai_function = 'language_studio'
    AND created_at >= v_month_start;

  RETURN json_build_object(
    'has_access', true,
    'minutes_used', round(v_minutes_used::numeric, 1),
    'minutes_limit', v_sub.weekly_minutes_limit,
    'minutes_remaining', GREATEST(0, v_sub.weekly_minutes_limit - v_minutes_used),
    'period_start', v_month_start,
    'expires_at', v_sub.expires_at
  );
END;
$$;
