
-- Update the join_community_via_link function to properly assign community_member role
CREATE OR REPLACE FUNCTION public.join_community_via_link(_slug text, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Upsert profile with company_id (create if not exists, update if exists)
  INSERT INTO public.profiles (user_id, full_name, company_id)
  VALUES (_user_id, 'Community Member', _link_record.company_id)
  ON CONFLICT (user_id) DO UPDATE SET company_id = _link_record.company_id;
  
  -- Always assign community_member role for users coming through invite links
  -- First check if they already have a role
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id) THEN
    -- No role yet, assign community_member
    INSERT INTO public.user_roles (user_id, role)
    VALUES (_user_id, 'community_member');
  ELSE
    -- User already has a role - if it's already expatriate/manager/owner/admin, keep it
    -- Only update to community_member if they have no better role
    IF NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = _user_id 
      AND role IN ('expatriate', 'manager', 'owner', 'admin')
    ) THEN
      -- They have some other role but not a main one, update to community_member
      UPDATE public.user_roles
      SET role = 'community_member'
      WHERE user_id = _user_id;
    END IF;
  END IF;
  
  RETURN _link_record.company_id;
END;
$function$;
