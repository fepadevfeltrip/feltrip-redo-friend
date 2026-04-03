-- Reset all truncated/corrupted maps to 'failed' so users can re-generate with the new validated service
UPDATE public.city_questionnaires
SET map_status = 'failed', map_content = NULL
WHERE map_status = 'completed';