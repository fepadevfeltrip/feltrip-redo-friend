-- Add responsibility_score column to hr_shared_data for workplace questionnaires
ALTER TABLE public.hr_shared_data 
ADD COLUMN IF NOT EXISTS responsibility_score integer;

-- Add poetic_response column to hr_shared_data so HR can see the AI response
ALTER TABLE public.hr_shared_data 
ADD COLUMN IF NOT EXISTS poetic_response text;