-- Create table for community invite links (public shareable links)
CREATE TABLE public.community_invite_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  max_uses integer DEFAULT NULL,
  current_uses integer NOT NULL DEFAULT 0,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_invite_links ENABLE ROW LEVEL SECURITY;

-- Policies for invite links
CREATE POLICY "Managers can create invite links for their company"
ON public.community_invite_links
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager') AND 
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Managers can view their company invite links"
ON public.community_invite_links
FOR SELECT
USING (
  (has_role(auth.uid(), 'manager') OR has_role(auth.uid(), 'owner') OR has_role(auth.uid(), 'admin'))
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Managers can update their company invite links"
ON public.community_invite_links
FOR UPDATE
USING (
  has_role(auth.uid(), 'manager') AND 
  company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Managers can delete their company invite links"
ON public.community_invite_links
FOR DELETE
USING (
  has_role(auth.uid(), 'manager') AND 
  company_id = get_user_company_id(auth.uid())
);

-- Public policy to read link info for joining (without auth)
CREATE POLICY "Anyone can view active links for joining"
ON public.community_invite_links
FOR SELECT
USING (
  is_active = true AND
  (expires_at IS NULL OR expires_at > now()) AND
  (max_uses IS NULL OR current_uses < max_uses)
);

-- Create function to join community via public link
CREATE OR REPLACE FUNCTION public.join_community_via_link(_slug text, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _link_record community_invite_links%ROWTYPE;
BEGIN
  -- Find valid link
  SELECT * INTO _link_record
  FROM public.community_invite_links
  WHERE slug = _slug
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  IF _link_record.id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;
  
  -- Increment usage
  UPDATE public.community_invite_links
  SET current_uses = current_uses + 1
  WHERE id = _link_record.id;
  
  -- Update profile with company
  UPDATE public.profiles
  SET company_id = _link_record.company_id
  WHERE user_id = _user_id;
  
  -- If user doesn't have any role yet, assign community_member role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'community_member')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN _link_record.company_id;
END;
$$;

-- Create trigger to update updated_at
CREATE TRIGGER update_community_invite_links_updated_at
  BEFORE UPDATE ON public.community_invite_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();