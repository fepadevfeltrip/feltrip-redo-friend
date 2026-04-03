-- Drop the city constraint that only allows 3 Brazilian cities (questionnaire now supports worldwide cities)
ALTER TABLE public.city_questionnaires DROP CONSTRAINT city_questionnaires_valid_city;