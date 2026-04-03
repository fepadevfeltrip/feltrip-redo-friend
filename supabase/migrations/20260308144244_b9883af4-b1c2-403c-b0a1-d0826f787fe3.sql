
-- View consolidada: atividade de clientes (sessions + gems + profiles)
CREATE OR REPLACE VIEW public.client_activity_view AS
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
  NULL as gem_name,
  NULL as gem_description,
  NULL as gem_category,
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
  NULL as archetype,
  NULL as portal,
  NULL as emotional_status,
  g.proposicao_poetica as poetic_proposition,
  NULL as language,
  g.name as gem_name,
  g.description as gem_description,
  g.categoria_principal as gem_category,
  g.created_at
FROM mrp_gems g
LEFT JOIN profiles p ON p.user_id = g.user_id
ORDER BY created_at DESC;

-- Função para deletar TODOS os dados de um user_id específico (cascata manual)
CREATE OR REPLACE FUNCTION public.purge_user_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_counts jsonb := '{}'::jsonb;
  v_count integer;
BEGIN
  -- Only owner/admin can purge
  IF NOT (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Only owner or admin can purge user data';
  END IF;

  -- Delete gems (references sessions)
  DELETE FROM mrp_gems WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('mrp_gems', v_count);

  -- Delete feedback (references sessions)
  DELETE FROM mrp_feedback WHERE session_id IN (SELECT id FROM mrp_sessions WHERE user_id = p_user_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('mrp_feedback', v_count);

  -- Delete sessions
  DELETE FROM mrp_sessions WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('mrp_sessions', v_count);

  -- Delete city questionnaires
  DELETE FROM city_questionnaires WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('city_questionnaires', v_count);

  -- Delete presence questionnaires (hr_shared_data references this)
  DELETE FROM hr_shared_data WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('hr_shared_data', v_count);

  DELETE FROM presence_questionnaires WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('presence_questionnaires', v_count);

  -- Delete map pin comments/likes then pins
  DELETE FROM map_pin_comments WHERE user_id = p_user_id;
  DELETE FROM map_pin_likes WHERE user_id = p_user_id;
  DELETE FROM map_pin_comments WHERE map_pin_id IN (SELECT id FROM map_pins WHERE user_id = p_user_id);
  DELETE FROM map_pin_likes WHERE map_pin_id IN (SELECT id FROM map_pins WHERE user_id = p_user_id);
  DELETE FROM map_pins WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('map_pins', v_count);

  -- Delete engagement
  DELETE FROM engagement_tracking WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('engagement_tracking', v_count);

  -- Delete diary entries
  DELETE FROM diary_entries WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('diary_entries', v_count);

  -- Delete chat access
  DELETE FROM chat_access WHERE user_id = p_user_id;
  DELETE FROM language_practice WHERE user_id = p_user_id;
  DELETE FROM language_studio_subscriptions WHERE user_id = p_user_id;
  DELETE FROM community_posts WHERE user_id = p_user_id;
  DELETE FROM community_events WHERE user_id = p_user_id;
  DELETE FROM user_annotations WHERE user_id = p_user_id;
  DELETE FROM notifications WHERE user_id = p_user_id;
  DELETE FROM notification_preferences WHERE user_id = p_user_id;
  DELETE FROM institutional_squads WHERE user_id = p_user_id;
  DELETE FROM private_messages WHERE sender_id = p_user_id OR receiver_id = p_user_id;
  DELETE FROM usage_log WHERE user_id = p_user_id;
  DELETE FROM user_usage WHERE user_id = p_user_id;
  DELETE FROM internal_service_requests WHERE user_id = p_user_id;
  DELETE FROM expert_reviews WHERE user_id = p_user_id;

  -- Delete user role and profile last
  DELETE FROM user_roles WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('user_roles', v_count);

  DELETE FROM profiles WHERE user_id = p_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_counts := v_counts || jsonb_build_object('profiles', v_count);

  RETURN jsonb_build_object('success', true, 'deleted', v_counts, 'user_id', p_user_id);
END;
$$;
