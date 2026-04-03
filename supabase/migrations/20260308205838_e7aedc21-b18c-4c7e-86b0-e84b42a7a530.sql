-- Remove from external_partners (wrong table)
DELETE FROM public.external_partners WHERE name = 'José Magno dos Santos';

-- Insert into concierge_experts
INSERT INTO public.concierge_experts (
  full_name, specialty, city, phone, languages, categories, is_active,
  bio, bio_en, bio_es,
  is_feltrip_indicated, is_cult_approved, is_community_verified
) VALUES (
  'José Magno dos Santos',
  'Fisioterapia Musculoesquelética',
  'São Paulo',
  '+55 11 99438-8518',
  ARRAY['pt', 'es'],
  ARRAY['Saúde'],
  true,
  'Fisioterapeuta com atuação na área de fisioterapia musculoesquelética, com abordagem terapêutica fundamentada em educação em dor, terapia manual e exercícios terapêuticos. Objetivo: redução da dor, melhora da função e retorno seguro às atividades da vida diária, por meio de estratégias baseadas em evidências científicas.',
  'Physiotherapist specializing in musculoskeletal physiotherapy, with a therapeutic approach based on pain education, manual therapy and therapeutic exercises. Goal: pain reduction, functional improvement and safe return to daily activities through evidence-based strategies.',
  'Fisioterapeuta con actuación en el área de fisioterapia musculoesquelética, con abordaje terapéutico fundamentado en educación en dolor, terapia manual y ejercicios terapéuticos. Objetivo: reducción del dolor, mejora de la función y retorno seguro a las actividades de la vida diaria, mediante estrategias basadas en evidencias científicas.',
  false, false, false
);