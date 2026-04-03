
-- New table for the city adaptation questionnaire (20 questions + city + stay duration)
CREATE TABLE public.city_questionnaires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  city TEXT NOT NULL, -- 'Rio de Janeiro', 'São Paulo', 'Florianópolis'
  stay_duration TEXT NOT NULL, -- 'up_to_15_days', 'up_to_1_month', 'up_to_3_months'
  
  -- Portal: O Outro (questions 1-4)
  other_q1 INTEGER NOT NULL, -- Prioridade vida social/família
  other_q2 INTEGER NOT NULL, -- Disposição para mudar hábitos
  other_q3 INTEGER NOT NULL, -- Necessidade de reconhecimento social
  other_q4 INTEGER NOT NULL, -- Tolerância a multidões
  
  -- Portal: Espaço (questions 5-8)
  space_q1 INTEGER NOT NULL, -- Função da casa
  space_q2 INTEGER NOT NULL, -- Importância trajeto casa-trabalho
  space_q3 INTEGER NOT NULL, -- Necessidade de silêncio
  space_q4 INTEGER NOT NULL, -- Sentimento de posse do espaço
  
  -- Portal: Território (questions 9-12)
  territory_q1 INTEGER NOT NULL, -- Afinidade com ritmo da cidade
  territory_q2 INTEGER NOT NULL, -- Impacto do caos urbano
  territory_q3 INTEGER NOT NULL, -- Desejo de explorar o desconhecido
  territory_q4 INTEGER NOT NULL, -- Sensibilidade ao clima/luz
  
  -- Portal: Identidade (questions 13-16)
  identity_q1 INTEGER NOT NULL, -- Momento de carreira/geração
  identity_q2 INTEGER NOT NULL, -- Grau de desapego vida anterior
  identity_q3 INTEGER NOT NULL, -- Vontade de se dissolver na massa
  identity_q4 INTEGER NOT NULL, -- Reconhecimento de si na nova rotina
  
  -- Portal: Corpo (questions 17-20)
  body_q1 INTEGER NOT NULL, -- Nível de disposição física
  body_q2 INTEGER NOT NULL, -- Preferência ambiente treino/lazer
  body_q3 INTEGER NOT NULL, -- Saturação sensorial
  body_q4 INTEGER NOT NULL, -- Necessidade contato elementos naturais
  
  -- AI generated map content (filled later by Bedrock)
  map_content TEXT, -- The generated 20-page map content
  map_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'error'
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.city_questionnaires ENABLE ROW LEVEL SECURITY;

-- Users can only see their own questionnaires
CREATE POLICY "Users can view their own city questionnaires"
ON public.city_questionnaires FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own city questionnaires"
ON public.city_questionnaires FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own city questionnaires"
ON public.city_questionnaires FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own city questionnaires"
ON public.city_questionnaires FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_city_questionnaires_updated_at
BEFORE UPDATE ON public.city_questionnaires
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint for valid values
ALTER TABLE public.city_questionnaires
ADD CONSTRAINT city_questionnaires_valid_city CHECK (city IN ('Rio de Janeiro', 'São Paulo', 'Florianópolis')),
ADD CONSTRAINT city_questionnaires_valid_duration CHECK (stay_duration IN ('up_to_15_days', 'up_to_1_month', 'up_to_3_months'));
