-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'like', 'comment', 'post', 'boba_reflection'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID, -- ID of the related entity (post, pin, etc)
  actor_id UUID, -- Who triggered the notification
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_related_id UUID DEFAULT NULL,
  p_actor_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't notify yourself
  IF p_actor_id IS NOT NULL AND p_actor_id = p_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, related_id, actor_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id, p_actor_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Trigger function for new community posts
CREATE OR REPLACE FUNCTION public.notify_community_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name TEXT;
  v_company_user RECORD;
BEGIN
  -- Get author name
  SELECT full_name INTO v_author_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Notify all users in the same company
  FOR v_company_user IN
    SELECT p.user_id
    FROM public.profiles p
    WHERE p.company_id = (SELECT company_id FROM public.profiles WHERE user_id = NEW.user_id)
    AND p.user_id != NEW.user_id
  LOOP
    PERFORM create_notification(
      v_company_user.user_id,
      'post',
      'Novo post na comunidade',
      v_author_name || ' publicou algo na comunidade',
      NEW.id,
      NEW.user_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

-- Trigger for community posts
CREATE TRIGGER on_community_post_created
AFTER INSERT ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_community_post();

-- Trigger function for likes on map pins
CREATE OR REPLACE FUNCTION public.notify_map_pin_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin_owner_id UUID;
  v_pin_title TEXT;
  v_actor_name TEXT;
BEGIN
  -- Get pin owner and title
  SELECT user_id, title INTO v_pin_owner_id, v_pin_title
  FROM public.map_pins WHERE id = NEW.map_pin_id;

  -- Get actor name
  SELECT full_name INTO v_actor_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Notify pin owner
  PERFORM create_notification(
    v_pin_owner_id,
    'like',
    'Alguém curtiu sua dica',
    v_actor_name || ' curtiu "' || COALESCE(LEFT(v_pin_title, 30), 'sua dica') || '"',
    NEW.map_pin_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

-- Trigger for likes
CREATE TRIGGER on_map_pin_liked
AFTER INSERT ON public.map_pin_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_map_pin_like();

-- Trigger function for comments on map pins
CREATE OR REPLACE FUNCTION public.notify_map_pin_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pin_owner_id UUID;
  v_pin_title TEXT;
  v_actor_name TEXT;
BEGIN
  -- Get pin owner and title
  SELECT user_id, title INTO v_pin_owner_id, v_pin_title
  FROM public.map_pins WHERE id = NEW.map_pin_id;

  -- Get actor name
  SELECT full_name INTO v_actor_name
  FROM public.profiles WHERE user_id = NEW.user_id;

  -- Notify pin owner
  PERFORM create_notification(
    v_pin_owner_id,
    'comment',
    'Novo comentário',
    v_actor_name || ' comentou em "' || COALESCE(LEFT(v_pin_title, 30), 'sua dica') || '"',
    NEW.map_pin_id,
    NEW.user_id
  );

  RETURN NEW;
END;
$$;

-- Trigger for comments
CREATE TRIGGER on_map_pin_commented
AFTER INSERT ON public.map_pin_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_map_pin_comment();