
-- Create housing_responses table
CREATE TABLE public.housing_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_name text NOT NULL DEFAULT 'Anônimo',
  city text NOT NULL,
  -- Answers (free text, one per pillar)
  answer_territorio text,
  answer_espaco text,
  answer_corpo text,
  answer_outro text,
  answer_identidade text,
  -- AI Result
  analise_poetica text,
  perfil_resumido text,
  pilar_corpo text,
  pilar_territorio text,
  pilar_outro text,
  pilar_espaco text,
  pilar_identidade text,
  bairros_sugeridos jsonb DEFAULT '[]'::jsonb,
  fechamento text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.housing_responses ENABLE ROW LEVEL SECURITY;

-- Users can insert their own
CREATE POLICY "Users can insert own housing responses"
  ON public.housing_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own
CREATE POLICY "Users can view own housing responses"
  ON public.housing_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Owner/Admin can view all
CREATE POLICY "Owner and Admin can view all housing responses"
  ON public.housing_responses FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Owner/Admin can delete
CREATE POLICY "Owner and Admin can delete housing responses"
  ON public.housing_responses FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Update client_activity_view to include housing_responses
CREATE OR REPLACE VIEW public.client_activity_view AS
-- Sessions
SELECT 
  'session'::text AS activity_type,
  s.id AS record_id,
  s.user_id,
  COALESCE(p.full_name, 'Anônimo') AS client_name,
  p.city AS client_city,
  p.user_tier,
  s.city AS session_city,
  s.profile AS archetype,
  s.portal,
  s.emotional_status,
  s.poetic_proposition,
  s.language,
  NULL::text AS gem_name,
  NULL::text AS gem_description,
  NULL::text AS gem_category,
  s.created_at
FROM mrp_sessions s
LEFT JOIN profiles p ON p.user_id = s.user_id

UNION ALL

-- Gems
SELECT 
  'gem'::text,
  g.id,
  g.user_id,
  COALESCE(p.full_name, 'Anônimo'),
  p.city,
  p.user_tier,
  g.cidade,
  NULL::text,
  NULL::text,
  NULL::text,
  g.proposicao_poetica,
  NULL::text,
  g.name,
  g.description,
  g.categoria_principal,
  g.created_at
FROM mrp_gems g
LEFT JOIN profiles p ON p.user_id = g.user_id

UNION ALL

-- Presence maps
SELECT 
  'presence_map'::text,
  pq.id,
  pq.user_id,
  COALESCE(p.full_name, 'Anônimo'),
  p.city,
  p.user_tier,
  NULL::text,
  pq.questionnaire_type,
  NULL::text,
  NULL::text,
  pq.poetic_response,
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::text,
  pq.created_at
FROM presence_questionnaires pq
LEFT JOIN profiles p ON p.user_id = pq.user_id

UNION ALL

-- City maps
SELECT 
  'city_map'::text,
  cq.id,
  cq.user_id,
  COALESCE(p.full_name, 'Anônimo'),
  p.city,
  p.user_tier,
  cq.city,
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::text,
  NULL::text,
  cq.created_at
FROM city_questionnaires cq
LEFT JOIN profiles p ON p.user_id = cq.user_id

UNION ALL

-- Housing responses (NEW dedicated table)
SELECT 
  'housing_complete'::text,
  hr.id,
  hr.user_id,
  COALESCE(p.full_name, hr.client_name, 'Anônimo'),
  p.city,
  p.user_tier,
  hr.city,
  hr.perfil_resumido,
  NULL::text,
  NULL::text,
  hr.analise_poetica,
  NULL::text,
  hr.bairros_sugeridos::text,
  NULL::text,
  NULL::text,
  hr.created_at
FROM housing_responses hr
LEFT JOIN profiles p ON p.user_id = hr.user_id

UNION ALL

-- Engagement tracking (concierge, etc)
SELECT 
  et.activity_type,
  et.id,
  et.user_id,
  COALESCE(p.full_name, 'Anônimo'),
  p.city,
  p.user_tier,
  et.metadata->>'city',
  et.metadata->>'profile_summary',
  NULL::text,
  NULL::text,
  et.metadata->>'poetic_analysis',
  NULL::text,
  et.metadata->>'neighborhoods',
  NULL::text,
  NULL::text,
  et.created_at
FROM engagement_tracking et
LEFT JOIN profiles p ON p.user_id = et.user_id
WHERE et.activity_type != 'housing_complete'

UNION ALL

-- Language studio
SELECT 
  'language_studio'::text,
  ul.id,
  ul.user_id,
  COALESCE(p.full_name, 'Anônimo'),
  p.city,
  p.user_tier,
  NULL::text,
  ul.ai_function,
  NULL::text,
  NULL::text,
  ul.description,
  NULL::text,
  round(ul.duration_seconds::numeric / 60.0, 1) || ' min',
  NULL::text,
  NULL::text,
  ul.created_at
FROM usage_log ul
LEFT JOIN profiles p ON p.user_id = ul.user_id;
