-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Company members can view their company
CREATE POLICY "Authenticated users can view companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (true);

-- Only managers can manage companies
CREATE POLICY "Managers can insert companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update companies" 
ON public.companies 
FOR UPDATE 
USING (has_role(auth.uid(), 'manager'));

-- Link profiles to companies
ALTER TABLE public.profiles 
ADD COLUMN company_id uuid REFERENCES public.companies(id);

-- Create family_members table
CREATE TABLE public.family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL UNIQUE,
  relationship text NOT NULL, -- spouse, child, parent, etc.
  full_name text NOT NULL,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Primary user can manage their family
CREATE POLICY "Primary users can view their family" 
ON public.family_members 
FOR SELECT 
USING (auth.uid() = primary_user_id OR auth.uid() = user_id);

CREATE POLICY "Primary users can add family members" 
ON public.family_members 
FOR INSERT 
WITH CHECK (auth.uid() = primary_user_id);

CREATE POLICY "Primary users can update family members" 
ON public.family_members 
FOR UPDATE 
USING (auth.uid() = primary_user_id);

CREATE POLICY "Primary users can delete family members" 
ON public.family_members 
FOR DELETE 
USING (auth.uid() = primary_user_id);

-- Managers can view family members
CREATE POLICY "Managers can view all family members" 
ON public.family_members 
FOR SELECT 
USING (has_role(auth.uid(), 'manager'));

-- Create family invite codes table
CREATE TABLE public.family_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  relationship text NOT NULL,
  full_name text NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_invite_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own codes
CREATE POLICY "Users can view their own invite codes" 
ON public.family_invite_codes 
FOR SELECT 
USING (auth.uid() = primary_user_id);

-- Users can create invite codes
CREATE POLICY "Users can create invite codes" 
ON public.family_invite_codes 
FOR INSERT 
WITH CHECK (auth.uid() = primary_user_id);

-- Users can update their own codes
CREATE POLICY "Users can update their own codes" 
ON public.family_invite_codes 
FOR UPDATE 
USING (auth.uid() = primary_user_id);

-- Users can delete their own codes
CREATE POLICY "Users can delete their own codes" 
ON public.family_invite_codes 
FOR DELETE 
USING (auth.uid() = primary_user_id);

-- Function to use family invite code
CREATE OR REPLACE FUNCTION public.use_family_invite_code(_code text, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite_record family_invite_codes%ROWTYPE;
  _family_member_id uuid;
  _primary_profile profiles%ROWTYPE;
BEGIN
  -- Find valid code
  SELECT * INTO _invite_record
  FROM public.family_invite_codes
  WHERE code = _code
    AND is_used = false
    AND expires_at > now();
  
  IF _invite_record.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired family invite code';
  END IF;
  
  -- Get primary user's profile
  SELECT * INTO _primary_profile
  FROM public.profiles
  WHERE id = _invite_record.primary_user_id;
  
  -- Check family member limit (max 4)
  IF (SELECT COUNT(*) FROM public.family_members WHERE primary_user_id = _invite_record.primary_user_id) >= 4 THEN
    RAISE EXCEPTION 'Maximum family members limit reached (4)';
  END IF;
  
  -- Mark code as used
  UPDATE public.family_invite_codes
  SET is_used = true, used_by = _user_id
  WHERE id = _invite_record.id;
  
  -- Create family member record
  INSERT INTO public.family_members (primary_user_id, user_id, relationship, full_name)
  VALUES (_invite_record.primary_user_id, _user_id, _invite_record.relationship, _invite_record.full_name)
  RETURNING id INTO _family_member_id;
  
  -- Create profile for family member with same company
  INSERT INTO public.profiles (user_id, full_name, company_id)
  VALUES (_user_id, _invite_record.full_name, _primary_profile.company_id)
  ON CONFLICT (user_id) DO UPDATE SET company_id = _primary_profile.company_id;
  
  -- Assign expatriate role to family member
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'expatriate')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN _family_member_id;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_family_members_updated_at
BEFORE UPDATE ON public.family_members
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();