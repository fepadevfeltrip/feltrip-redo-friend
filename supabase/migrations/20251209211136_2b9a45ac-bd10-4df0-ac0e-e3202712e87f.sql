-- Create workplace questionnaires table with specific pillars
CREATE TABLE public.workplace_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Espaço (Space) - 3 questions
  space_q1 INTEGER NOT NULL,
  space_q2 INTEGER NOT NULL,
  space_q3 INTEGER NOT NULL,
  
  -- Corpo (Body) - 3 questions
  body_q1 INTEGER NOT NULL,
  body_q2 INTEGER NOT NULL,
  body_q3 INTEGER NOT NULL,
  
  -- O Outro (The Other) - 3 questions
  other_q1 INTEGER NOT NULL,
  other_q2 INTEGER NOT NULL,
  other_q3 INTEGER NOT NULL,
  
  -- Cultura da Empresa (Company Culture) - 3 questions
  culture_q1 INTEGER NOT NULL,
  culture_q2 INTEGER NOT NULL,
  culture_q3 INTEGER NOT NULL,
  
  -- Pertencimento (Belonging) - 3 questions
  belonging_q1 INTEGER NOT NULL,
  belonging_q2 INTEGER NOT NULL,
  belonging_q3 INTEGER NOT NULL,
  
  -- Auto-responsabilidade (Self-responsibility) - 5 questions
  responsibility_q1 INTEGER NOT NULL,
  responsibility_q2 INTEGER NOT NULL,
  responsibility_q3 INTEGER NOT NULL,
  responsibility_q4 INTEGER NOT NULL,
  responsibility_q5 INTEGER NOT NULL,
  
  -- Scores
  space_score INTEGER NOT NULL,
  body_score INTEGER NOT NULL,
  other_score INTEGER NOT NULL,
  culture_score INTEGER NOT NULL,
  belonging_score INTEGER NOT NULL,
  responsibility_score INTEGER NOT NULL,
  
  -- AI Response
  poetic_response TEXT,
  poetic_response_encrypted TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workplace_questionnaires ENABLE ROW LEVEL SECURITY;

-- Users can create their own questionnaires
CREATE POLICY "Users can create their own workplace questionnaires"
ON public.workplace_questionnaires
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own questionnaires
CREATE POLICY "Users can view their own workplace questionnaires"
ON public.workplace_questionnaires
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own questionnaires
CREATE POLICY "Users can delete their own workplace questionnaires"
ON public.workplace_questionnaires
FOR DELETE
USING (auth.uid() = user_id);

-- Create HR shared data table for workplace
CREATE TABLE public.workplace_hr_shared_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  questionnaire_id UUID NOT NULL UNIQUE REFERENCES public.workplace_questionnaires(id) ON DELETE CASCADE,
  
  -- Scores
  space_score INTEGER NOT NULL,
  body_score INTEGER NOT NULL,
  other_score INTEGER NOT NULL,
  culture_score INTEGER NOT NULL,
  belonging_score INTEGER NOT NULL,
  responsibility_score INTEGER NOT NULL,
  
  poetic_response TEXT,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workplace_hr_shared_data ENABLE ROW LEVEL SECURITY;

-- Users can share their own data (insert)
CREATE POLICY "Users can share their own workplace data"
ON public.workplace_hr_shared_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Managers can view their company HR data
CREATE POLICY "Managers can view their company workplace HR data"
ON public.workplace_hr_shared_data
FOR SELECT
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND EXISTS (
    SELECT 1 FROM profiles p1
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = workplace_hr_shared_data.user_id 
    AND p2.user_id = auth.uid()
  )
);

-- Owner and Admin can view all HR data
CREATE POLICY "Owner and Admin can view all workplace HR data"
ON public.workplace_hr_shared_data
FOR SELECT
USING (
  has_role(auth.uid(), 'owner'::app_role) 
  OR has_role(auth.uid(), 'admin'::app_role)
);