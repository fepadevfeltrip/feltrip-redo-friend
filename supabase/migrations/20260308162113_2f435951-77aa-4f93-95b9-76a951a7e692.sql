-- Insert Luís Márcio
INSERT INTO concierge_experts (
  full_name, specialty, city, categories, languages,
  bio, bio_en, bio_es,
  website, is_active, is_feltrip_indicated, is_community_verified, is_cult_approved
) VALUES (
  'Luís Márcio Bellotti Alvim',
  'Legal & Accounting',
  'Online',
  ARRAY['Legal', 'Tax Law', 'Corporate Governance', 'Online'],
  ARRAY['pt', 'en', 'es'],
  'Sócio da LNCAM, advogado tributarista especialista em Direito Tributário e Governança Corporativa. MBA em Finanças e Gestão Tributária, membro do IBGC e conselheiro.',
  'Partner at LNCAM, tax attorney specializing in Tax Law and Corporate Governance. MBA in Finance and Tax Management, member of IBGC and board advisor.',
  'Socio de LNCAM, abogado tributarista especialista en Derecho Tributario y Gobernanza Corporativa. MBA en Finanzas y Gestión Tributaria, miembro del IBGC y consejero.',
  'https://limanetto.adv.br',
  true, true, false, false
);

-- Update Luiz Araújo: add city Online and languages es
UPDATE concierge_experts 
SET city = 'Online',
    languages = ARRAY['pt', 'en', 'es']
WHERE full_name = 'Luiz Araújo';

-- Update Rafaela: add es to languages
UPDATE concierge_experts 
SET languages = ARRAY['pt', 'en', 'es']
WHERE full_name = 'Rafaela Rocha';