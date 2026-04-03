-- Add company_id to registration_codes
ALTER TABLE public.registration_codes
ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Update the use_registration_code function to also assign company
CREATE OR REPLACE FUNCTION public.use_registration_code(_code text, _user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role app_role;
  _code_id uuid;
  _company_id uuid;
BEGIN
  -- Find valid code
  SELECT id, role, company_id INTO _code_id, _role, _company_id
  FROM public.registration_codes
  WHERE code = _code
    AND is_active = true
    AND (max_uses IS NULL OR current_uses < max_uses)
    AND (expires_at IS NULL OR expires_at > now());
  
  IF _code_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired registration code';
  END IF;
  
  -- Increment usage
  UPDATE public.registration_codes
  SET current_uses = current_uses + 1
  WHERE id = _code_id;
  
  -- Assign role to user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Update profile with company if code has one
  IF _company_id IS NOT NULL THEN
    UPDATE public.profiles
    SET company_id = _company_id
    WHERE user_id = _user_id;
  END IF;
  
  RETURN _role;
END;
$$;

-- Create function for existing users to join a community
CREATE OR REPLACE FUNCTION public.join_community_with_code(_code text, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  RETURN _code_record.company_id;
END;
$$;