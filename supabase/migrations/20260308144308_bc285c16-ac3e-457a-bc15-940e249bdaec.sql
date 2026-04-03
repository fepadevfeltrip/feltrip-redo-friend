
-- Fix: make view use invoker security (respects RLS of querying user)
DROP VIEW IF EXISTS public.client_activity_view;

CREATE VIEW public.client_activity_view
WITH (security_invoker = true)
AS
SELECT 
  'session' as activity_type,
  s.id as record_id,
  s.user_id,
  COALESCE(p.full_name, 'Anônimo') as client_name,
  p.city as client_city,
  p.user_tier,
  s.city as session_city,
  s.profile as archetype,
  s.portal,
  s.emotional_status,
  s.poetic_proposition,
  s.language,
  NULL::text as gem_name,
  NULL::text as gem_description,
  NULL::text as gem_category,
  s.created_at
FROM mrp_sessions s
LEFT JOIN profiles p ON p.user_id = s.user_id
UNION ALL
SELECT 
  'gem' as activity_type,
  g.id as record_id,
  g.user_id,
  COALESCE(p.full_name, 'Anônimo') as client_name,
  p.city as client_city,
  p.user_tier,
  g.cidade as session_city,
  NULL::text as archetype,
  NULL::text as portal,
  NULL::text as emotional_status,
  g.proposicao_poetica as poetic_proposition,
  NULL::text as language,
  g.name as gem_name,
  g.description as gem_description,
  g.categoria_principal as gem_category,
  g.created_at
FROM mrp_gems g
LEFT JOIN profiles p ON p.user_id = g.user_id;
