-- Add company-level limits configuration
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS studio_minutes_limit integer DEFAULT 240,
ADD COLUMN IF NOT EXISTS mrp_monthly_limit integer DEFAULT 2;

-- For Feltrip company, set unlimited MRP (null = unlimited)
UPDATE public.companies 
SET mrp_monthly_limit = NULL 
WHERE name ILIKE '%feltrip%';

-- Create function to check MRP limit for a user
CREATE OR REPLACE FUNCTION public.check_mrp_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_company_id uuid;
  v_mrp_limit integer;
  v_mrp_count integer;
  v_current_month date;
BEGIN
  v_current_month := date_trunc('month', CURRENT_DATE)::date;
  
  -- Get user's company and limit
  SELECT p.company_id, c.mrp_monthly_limit 
  INTO v_company_id, v_mrp_limit
  FROM public.profiles p
  LEFT JOIN public.companies c ON c.id = p.company_id
  WHERE p.user_id = p_user_id;
  
  -- If no limit (NULL), allow unlimited
  IF v_mrp_limit IS NULL THEN
    RETURN jsonb_build_object(
      'can_submit', true,
      'mrp_count', 0,
      'mrp_limit', null,
      'unlimited', true
    );
  END IF;
  
  -- Count MRPs this month
  SELECT COUNT(*) INTO v_mrp_count
  FROM public.presence_questionnaires
  WHERE user_id = p_user_id
    AND date_trunc('month', created_at) = v_current_month;
  
  RETURN jsonb_build_object(
    'can_submit', v_mrp_count < v_mrp_limit,
    'mrp_count', v_mrp_count,
    'mrp_limit', v_mrp_limit,
    'unlimited', false
  );
END;
$$;

-- Create function to get company limits (for owner dashboard)
CREATE OR REPLACE FUNCTION public.get_company_limits(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_limits jsonb;
BEGIN
  SELECT jsonb_build_object(
    'studio_minutes_limit', studio_minutes_limit,
    'mrp_monthly_limit', mrp_monthly_limit
  ) INTO v_limits
  FROM public.companies
  WHERE id = p_company_id;
  
  RETURN COALESCE(v_limits, jsonb_build_object(
    'studio_minutes_limit', 240,
    'mrp_monthly_limit', 2
  ));
END;
$$;

-- Create function to update company limits (for owner/admin)
CREATE OR REPLACE FUNCTION public.set_company_limits(
  p_company_id uuid,
  p_studio_minutes_limit integer DEFAULT NULL,
  p_mrp_monthly_limit integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.companies
  SET 
    studio_minutes_limit = COALESCE(p_studio_minutes_limit, studio_minutes_limit),
    mrp_monthly_limit = p_mrp_monthly_limit,
    updated_at = now()
  WHERE id = p_company_id;
  
  RETURN FOUND;
END;
$$;