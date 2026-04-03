-- Delete inactive orphan codes to allow constraint
DELETE FROM public.registration_codes 
WHERE company_id IS NULL AND is_active = false;