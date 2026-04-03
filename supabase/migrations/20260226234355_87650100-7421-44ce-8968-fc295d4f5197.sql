
-- Delete the older duplicate questionnaire
DELETE FROM city_questionnaires WHERE id = '308c02ac-f9d0-432a-ad28-c041ef3f52d5';

-- Reset the most recent one to pending so the user can retry
UPDATE city_questionnaires SET map_status = 'pending' WHERE id = '37344e49-df1a-4156-b105-daed72b6c8a2';
