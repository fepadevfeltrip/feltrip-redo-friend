-- Add 'community_member' to the app_role enum for people who only access community
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'community_member';

-- Update join_community_with_code to also assign community_member role
CREATE OR REPLACE FUNCTION public.join_community_with_code(_code text, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code_record registration_codes%ROWTYPE;
BEGIN
  -- Find valid code
  SELECT * INTO _code_record
  FROM public.registration_codes
  WHERE code = _code
    AND is_active = true
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (expires_at IS NULL OR expires_at > now());
  
  IF _code_record.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired code';
  END IF;
  
  IF _code_record.company_id IS NULL THEN
    RAISE EXCEPTION 'This code is not associated with a community';
  END IF;
  
  -- Increment usage
  UPDATE public.registration_codes
  SET current_uses = current_uses + 1
  WHERE id = _code_record.id;
  
  -- Update profile with company
  UPDATE public.profiles
  SET company_id = _code_record.company_id
  WHERE user_id = _user_id;
  
  -- If user doesn't have any role yet, assign the role from the code
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, _code_record.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN _code_record.company_id;
END;
$$;