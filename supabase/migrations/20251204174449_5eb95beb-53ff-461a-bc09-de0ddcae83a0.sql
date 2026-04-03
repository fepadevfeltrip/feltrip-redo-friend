-- Create community_posts table for the Wall
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_posts (all authenticated users in same company can see)
CREATE POLICY "Users can view posts from their company" 
ON public.community_posts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1 
    JOIN public.profiles p2 ON p1.company_id = p2.company_id 
    WHERE p1.user_id = auth.uid() AND p2.user_id = community_posts.user_id
  )
);

CREATE POLICY "Users can create their own posts" 
ON public.community_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.community_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.community_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create community_events table
CREATE TABLE public.community_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  image_url TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  meeting_link TEXT,
  max_participants INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_events
CREATE POLICY "Users can view events from their company" 
ON public.community_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p1 
    JOIN public.profiles p2 ON p1.company_id = p2.company_id 
    WHERE p1.user_id = auth.uid() AND p2.user_id = community_events.user_id
  )
);

CREATE POLICY "Users can create events" 
ON public.community_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" 
ON public.community_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" 
ON public.community_events 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create event_participants table for RSVPs
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.community_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'going', -- going, maybe, not_going
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Enable RLS
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_participants
CREATE POLICY "Users can view participants of events they can see" 
ON public.event_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_events ce
    JOIN public.profiles p1 ON p1.user_id = ce.user_id
    JOIN public.profiles p2 ON p1.company_id = p2.company_id
    WHERE ce.id = event_participants.event_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Users can participate in events" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their participation" 
ON public.event_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their participation" 
ON public.event_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_events_updated_at
BEFORE UPDATE ON public.community_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();