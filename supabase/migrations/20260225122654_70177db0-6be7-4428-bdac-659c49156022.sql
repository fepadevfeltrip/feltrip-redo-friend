
-- Cult AI tables migrated to the main Supabase project

CREATE TABLE public.mrp_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  emotional_status text,
  poetic_proposition text,
  city text,
  portal text,
  profile text,
  language text DEFAULT 'pt',
  is_public boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mrp_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own mrp sessions"
  ON public.mrp_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own mrp sessions"
  ON public.mrp_sessions FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own mrp sessions"
  ON public.mrp_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mrp sessions"
  ON public.mrp_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Gems table
CREATE TABLE public.mrp_gems (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.mrp_sessions(id) ON DELETE CASCADE,
  user_id uuid,
  name text NOT NULL DEFAULT 'Nova Descoberta',
  description text,
  address text,
  lat double precision DEFAULT 0,
  lng double precision DEFAULT 0,
  pin_color text DEFAULT 'teal',
  cidade text,
  categoria_principal text,
  dna_raiz integer DEFAULT 0,
  dna_cult integer DEFAULT 0,
  dna_luxo integer DEFAULT 0,
  dna_espiritual integer DEFAULT 0,
  dna_criativo integer DEFAULT 0,
  camada_emocional text[] DEFAULT '{}',
  acesso text,
  movimento text,
  turno_ideal text,
  is_carnaval boolean DEFAULT false,
  expira_em timestamp with time zone,
  proposicao_poetica text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mrp_gems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create mrp gems"
  ON public.mrp_gems FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own mrp gems"
  ON public.mrp_gems FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own mrp gems"
  ON public.mrp_gems FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mrp gems"
  ON public.mrp_gems FOR DELETE
  USING (auth.uid() = user_id);

-- Feedback table
CREATE TABLE public.mrp_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid REFERENCES public.mrp_sessions(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mrp_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON public.mrp_feedback FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view feedback"
  ON public.mrp_feedback FOR SELECT
  USING (true);
