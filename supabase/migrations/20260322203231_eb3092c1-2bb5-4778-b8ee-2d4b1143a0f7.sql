
CREATE OR REPLACE FUNCTION public.get_notification_preferences_with_email()
RETURNS TABLE(
  pref_id uuid,
  user_id uuid,
  user_email text,
  user_name text,
  email_notifications boolean,
  push_notifications boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only owner/admin can access this
  IF NOT (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Only owner or admin can view notification preferences';
  END IF;

  RETURN QUERY
  SELECT 
    np.id as pref_id,
    np.user_id,
    au.email::text as user_email,
    COALESCE(p.full_name, 'Anônimo')::text as user_name,
    np.email_notifications,
    np.push_notifications,
    np.created_at,
    np.updated_at
  FROM notification_preferences np
  JOIN auth.users au ON au.id = np.user_id
  LEFT JOIN profiles p ON p.user_id = np.user_id
  ORDER BY np.updated_at DESC;
END;
$$;
