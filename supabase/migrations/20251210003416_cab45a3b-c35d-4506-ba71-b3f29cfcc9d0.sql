-- Add constraint: company_id required unless role is owner or admin
ALTER TABLE public.registration_codes
ADD CONSTRAINT registration_codes_company_required 
CHECK (
  company_id IS NOT NULL 
  OR role IN ('owner', 'admin')
);