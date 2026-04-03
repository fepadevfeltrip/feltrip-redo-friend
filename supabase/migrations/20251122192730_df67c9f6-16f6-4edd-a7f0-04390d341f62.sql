-- Create diary_entries table for tracking user wellbeing
CREATE TABLE IF NOT EXISTS public.diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pillar TEXT NOT NULL CHECK (pillar IN ('Corpo', 'Espaço', 'Território', 'O Outro', 'Identidade')),
  sentiment INTEGER NOT NULL CHECK (sentiment >= 0 AND sentiment <= 100),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create map_pins table for user location notes
CREATE TABLE IF NOT EXISTS public.map_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('anotacao', 'lugar', 'evento')),
  title TEXT NOT NULL,
  content TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  audio_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create language_practice table for AI language practice sessions
CREATE TABLE IF NOT EXISTS public.language_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation JSONB NOT NULL DEFAULT '[]'::jsonb,
  language TEXT NOT NULL DEFAULT 'pt',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_practice ENABLE ROW LEVEL SECURITY;

-- RLS Policies for diary_entries
CREATE POLICY "Users can view their own diary entries"
  ON public.diary_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own diary entries"
  ON public.diary_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own diary entries"
  ON public.diary_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diary entries"
  ON public.diary_entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for map_pins
CREATE POLICY "Users can view their own map pins"
  ON public.map_pins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own map pins"
  ON public.map_pins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own map pins"
  ON public.map_pins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own map pins"
  ON public.map_pins FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for language_practice
CREATE POLICY "Users can view their own language practice"
  ON public.language_practice FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own language practice"
  ON public.language_practice FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own language practice"
  ON public.language_practice FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own language practice"
  ON public.language_practice FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage buckets for map audio and images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('map-audio', 'map-audio', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('map-images', 'map-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for map-audio
CREATE POLICY "Users can upload their own audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'map-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'map-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'map-audio' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for map-images
CREATE POLICY "Anyone can view images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'map-images');

CREATE POLICY "Users can upload their own images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'map-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'map-images' AND auth.uid()::text = (storage.foldername(name))[1]);