-- Create profile for info@feltrip.com and link to FELTRIP company
INSERT INTO public.profiles (user_id, full_name, company_id)
VALUES ('b240b05c-3ea6-4175-bf24-828333b2fc3f', 'RH Feltrip', 'f7a8cf09-40ad-40c4-b073-525c3356c4e1')
ON CONFLICT (user_id) DO UPDATE SET company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1';

-- Also update Patricia RH to same company
UPDATE public.profiles 
SET company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1'
WHERE user_id = '4abed42b-5f45-41b2-8318-40e1392293cf';

-- Update registration codes to point to the correct company
UPDATE public.registration_codes 
SET company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1'
WHERE company_id IN ('6474a134-0528-45bc-9e40-9a383ba02471', 'f26f1310-122f-4643-876d-40a8c1e826f8', '9cbac14e-baa6-44a5-b9f9-69517e4771a5');

-- Now delete duplicate companies
DELETE FROM public.companies 
WHERE id IN ('6474a134-0528-45bc-9e40-9a383ba02471', 'f26f1310-122f-4643-876d-40a8c1e826f8', '9cbac14e-baa6-44a5-b9f9-69517e4771a5');