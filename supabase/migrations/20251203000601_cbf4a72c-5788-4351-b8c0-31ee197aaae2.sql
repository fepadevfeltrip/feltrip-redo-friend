-- Create table for relational presence questionnaire responses
CREATE TABLE public.presence_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  questionnaire_type TEXT NOT NULL CHECK (questionnaire_type IN ('before_arrival', 'during_stay', 'departure')),
  
  -- Body pillar (3 questions, 1-5 scale)
  body_q1 INTEGER NOT NULL CHECK (body_q1 BETWEEN 1 AND 5),
  body_q2 INTEGER NOT NULL CHECK (body_q2 BETWEEN 1 AND 5),
  body_q3 INTEGER NOT NULL CHECK (body_q3 BETWEEN 1 AND 5),
  
  -- Space pillar (3 questions, 1-5 scale)
  space_q1 INTEGER NOT NULL CHECK (space_q1 BETWEEN 1 AND 5),
  space_q2 INTEGER NOT NULL CHECK (space_q2 BETWEEN 1 AND 5),
  space_q3 INTEGER NOT NULL CHECK (space_q3 BETWEEN 1 AND 5),
  
  -- Territory pillar (3 questions, 1-5 scale)
  territory_q1 INTEGER NOT NULL CHECK (territory_q1 BETWEEN 1 AND 5),
  territory_q2 INTEGER NOT NULL CHECK (territory_q2 BETWEEN 1 AND 5),
  territory_q3 INTEGER NOT NULL CHECK (territory_q3 BETWEEN 1 AND 5),
  
  -- The Other pillar (3 questions, 1-5 scale)
  other_q1 INTEGER NOT NULL CHECK (other_q1 BETWEEN 1 AND 5),
  other_q2 INTEGER NOT NULL CHECK (other_q2 BETWEEN 1 AND 5),
  other_q3 INTEGER NOT NULL CHECK (other_q3 BETWEEN 1 AND 5),
  
  -- Identity pillar (3 questions, 1-5 scale)
  identity_q1 INTEGER NOT NULL CHECK (identity_q1 BETWEEN 1 AND 5),
  identity_q2 INTEGER NOT NULL CHECK (identity_q2 BETWEEN 1 AND 5),
  identity_q3 INTEGER NOT NULL CHECK (identity_q3 BETWEEN 1 AND 5),
  
  -- AI-generated poetic response
  poetic_response TEXT,
  
  -- Consent for sharing with workplace
  share_with_workplace BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.presence_questionnaires ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own questionnaires" 
ON public.presence_questionnaires 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own questionnaires" 
ON public.presence_questionnaires 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own questionnaires" 
ON public.presence_questionnaires 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own questionnaires" 
ON public.presence_questionnaires 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_presence_questionnaires_user_id ON public.presence_questionnaires(user_id);
CREATE INDEX idx_presence_questionnaires_type ON public.presence_questionnaires(questionnaire_type);
CREATE INDEX idx_presence_questionnaires_created_at ON public.presence_questionnaires(created_at DESC);