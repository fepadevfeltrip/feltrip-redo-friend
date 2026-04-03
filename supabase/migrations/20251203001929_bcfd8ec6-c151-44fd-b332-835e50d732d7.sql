-- Create role enum
CREATE TYPE public.app_role AS ENUM ('expatriate', 'manager');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create registration_codes table
CREATE TABLE public.registration_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  role app_role NOT NULL,
  max_uses INTEGER DEFAULT NULL,
  current_uses INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_codes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Function to validate registration code and assign role
CREATE OR REPLACE FUNCTION public.use_registration_code(_code TEXT, _user_id uuid)
RETURNS app_role
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _code_id uuid;
BEGIN
  -- Find valid code
  SELECT id, role INTO _code_id, _role
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
  
  RETURN _role;
END;
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own role"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- RLS policies for registration_codes (only managers can manage)
CREATE POLICY "Managers can view codes"
ON public.registration_codes FOR SELECT
USING (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can create codes"
ON public.registration_codes FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'manager'));

CREATE POLICY "Managers can update codes"
ON public.registration_codes FOR UPDATE
USING (public.has_role(auth.uid(), 'manager'));

-- Insert default codes (you can change these in Supabase dashboard)
INSERT INTO public.registration_codes (code, role) VALUES 
  ('EXPAT2024', 'expatriate'),
  ('MANAGER2024', 'manager');

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_registration_codes_code ON public.registration_codes(code);