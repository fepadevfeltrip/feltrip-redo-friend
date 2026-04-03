-- Add translated bio columns
ALTER TABLE public.concierge_experts ADD COLUMN IF NOT EXISTS bio_en text;
ALTER TABLE public.concierge_experts ADD COLUMN IF NOT EXISTS bio_es text;

-- Update Claramente
UPDATE public.concierge_experts SET
  categories = ARRAY['Mental Health', 'Rio de Janeiro', 'Online'],
  website = 'https://claramente.com.br',
  bio = 'Atendimento presencial no Rio de Janeiro e online. Suporte em saúde mental e bem-estar para expatriados e pessoas em transição.',
  bio_en = 'In-person sessions in Rio de Janeiro and online. Mental health and wellness support for expatriates and people in transition.',
  bio_es = 'Atención presencial en Río de Janeiro y online. Apoyo en salud mental y bienestar para expatriados y personas en transición.'
WHERE full_name = 'Claramente';

-- Update Luisa
UPDATE public.concierge_experts SET
  categories = ARRAY['Mental Health', 'São Paulo', 'Online'],
  website = 'https://luisapsicologia.com.br',
  bio = 'Psicóloga especializada em saúde mental para expatriados. Atendimento presencial em São Paulo e online para todo o Brasil.',
  bio_en = 'Psychologist specialized in mental health for expatriates. In-person sessions in São Paulo and online for all of Brazil.',
  bio_es = 'Psicóloga especializada en salud mental para expatriados. Atención presencial en São Paulo y online para todo Brasil.'
WHERE full_name = 'Luisa';

-- Update Tekhne
UPDATE public.concierge_experts SET
  categories = ARRAY['Accounting', 'Online'],
  website = 'https://tekhne.com.br',
  bio = 'Contabilidade especializada para expatriados e empresas internacionais. Atendimento 100% online em português e inglês.',
  bio_en = 'Specialized accounting for expatriates and international companies. 100% online service in Portuguese and English.',
  bio_es = 'Contabilidad especializada para expatriados y empresas internacionales. Atención 100% online en portugués e inglés.'
WHERE full_name = 'Tekhne';