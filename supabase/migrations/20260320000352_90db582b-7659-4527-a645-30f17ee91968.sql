CREATE OR REPLACE VIEW public.client_activity_view AS
 SELECT 'session'::text AS activity_type,
    s.id AS record_id,
    s.user_id,
    COALESCE(p.full_name, 'Anônimo'::text) AS client_name,
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
 SELECT 'gem'::text AS activity_type,
    g.id AS record_id,
    g.user_id,
    COALESCE(p.full_name, 'Anônimo'::text) AS client_name,
    p.city AS client_city,
    p.user_tier,
    g.cidade AS session_city,
    NULL::text AS archetype,
    NULL::text AS portal,
    NULL::text AS emotional_status,
    g.proposicao_poetica AS poetic_proposition,
    NULL::text AS language,
    g.name AS gem_name,
    g.description AS gem_description,
    g.categoria_principal AS gem_category,
    g.created_at
   FROM mrp_gems g
     LEFT JOIN profiles p ON p.user_id = g.user_id
UNION ALL
 SELECT 'presence_map'::text AS activity_type,
    pq.id AS record_id,
    pq.user_id,
    COALESCE(p.full_name, 'Anônimo'::text) AS client_name,
    p.city AS client_city,
    p.user_tier,
    NULL::text AS session_city,
    pq.questionnaire_type AS archetype,
    NULL::text AS portal,
    NULL::text AS emotional_status,
    pq.poetic_response AS poetic_proposition,
    NULL::text AS language,
    NULL::text AS gem_name,
    NULL::text AS gem_description,
    NULL::text AS gem_category,
    pq.created_at
   FROM presence_questionnaires pq
     LEFT JOIN profiles p ON p.user_id = pq.user_id
UNION ALL
 SELECT 'city_map'::text AS activity_type,
    cq.id AS record_id,
    cq.user_id,
    COALESCE(p.full_name, 'Anônimo'::text) AS client_name,
    p.city AS client_city,
    p.user_tier,
    cq.city AS session_city,
    NULL::text AS archetype,
    NULL::text AS portal,
    NULL::text AS emotional_status,
    NULL::text AS poetic_proposition,
    NULL::text AS language,
    NULL::text AS gem_name,
    NULL::text AS gem_description,
    NULL::text AS gem_category,
    cq.created_at
   FROM city_questionnaires cq
     LEFT JOIN profiles p ON p.user_id = cq.user_id
UNION ALL
 SELECT et.activity_type,
    et.id AS record_id,
    et.user_id,
    COALESCE(p.full_name, 'Anônimo'::text) AS client_name,
    p.city AS client_city,
    p.user_tier,
    (et.metadata->>'city')::text AS session_city,
    (et.metadata->>'profile_summary')::text AS archetype,
    NULL::text AS portal,
    NULL::text AS emotional_status,
    (et.metadata->>'poetic_analysis')::text AS poetic_proposition,
    NULL::text AS language,
    (et.metadata->>'neighborhoods')::text AS gem_name,
    NULL::text AS gem_description,
    NULL::text AS gem_category,
    et.created_at
   FROM engagement_tracking et
     LEFT JOIN profiles p ON p.user_id = et.user_id;