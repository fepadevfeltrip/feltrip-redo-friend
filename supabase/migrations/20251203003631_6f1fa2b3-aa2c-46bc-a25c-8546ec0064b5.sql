-- Create profiles table with name
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers can view expatriate profiles
CREATE POLICY "Managers can view expatriate profiles"
ON public.profiles FOR SELECT
USING (public.has_role(auth.uid(), 'manager'));

-- Create HR shared data table (only pillar percentages, no details)
CREATE TABLE public.hr_shared_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  questionnaire_id uuid NOT NULL REFERENCES public.presence_questionnaires(id) ON DELETE CASCADE,
  body_score integer NOT NULL,
  space_score integer NOT NULL,
  territory_score integer NOT NULL,
  other_score integer NOT NULL,
  identity_score integer NOT NULL,
  questionnaire_type text NOT NULL,
  shared_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(questionnaire_id)
);

ALTER TABLE public.hr_shared_data ENABLE ROW LEVEL SECURITY;

-- Only managers can view HR shared data
CREATE POLICY "Managers can view shared data"
ON public.hr_shared_data FOR SELECT
USING (public.has_role(auth.uid(), 'manager'));

-- Users can insert their own shared data (when they consent)
CREATE POLICY "Users can share their own data"
ON public.hr_shared_data FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create engagement tracking table
CREATE TABLE public.engagement_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL, -- 'language_practice', 'security_map', 'presence_questionnaire'
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.engagement_tracking ENABLE ROW LEVEL SECURITY;

-- Users can insert their own engagement
CREATE POLICY "Users can track their own engagement"
ON public.engagement_tracking FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers can view all engagement data
CREATE POLICY "Managers can view engagement data"
ON public.engagement_tracking FOR SELECT
USING (public.has_role(auth.uid(), 'manager'));

-- Create indexes
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_hr_shared_data_user_id ON public.hr_shared_data(user_id);
CREATE INDEX idx_engagement_tracking_user_id ON public.engagement_tracking(user_id);
CREATE INDEX idx_engagement_tracking_activity_type ON public.engagement_tracking(activity_type);
CREATE INDEX idx_engagement_tracking_date ON public.engagement_tracking(activity_date);