-- Insert registration codes for FELTRIP
INSERT INTO public.registration_codes (code, role, company_id, is_active, max_uses)
VALUES 
  ('collabfeltrip2025', 'expatriate', 'f7a8cf09-40ad-40c4-b073-525c3356c4e1', true, NULL),
  ('managerfeltrip2025', 'manager', 'f7a8cf09-40ad-40c4-b073-525c3356c4e1', true, NULL);

-- Insert registration codes for British School
INSERT INTO public.registration_codes (code, role, company_id, is_active, max_uses)
VALUES 
  ('collabbritish2025', 'expatriate', '070a477b-1bdc-4a20-8070-560a4983a939', true, NULL),
  ('managerbritish2025', 'manager', '070a477b-1bdc-4a20-8070-560a4983a939', true, NULL);