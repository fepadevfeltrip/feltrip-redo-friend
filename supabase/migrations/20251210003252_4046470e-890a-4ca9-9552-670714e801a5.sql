-- Step 1: Deactivate orphan codes (except owner/admin codes which are global)
UPDATE public.registration_codes 
SET is_active = false 
WHERE company_id IS NULL AND role NOT IN ('owner', 'admin');