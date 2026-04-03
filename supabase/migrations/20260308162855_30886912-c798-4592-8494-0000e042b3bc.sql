INSERT INTO concierge_experts (
  full_name, specialty, city, categories, languages,
  bio, bio_en, bio_es,
  website, is_active, is_feltrip_indicated, is_community_verified, is_cult_approved
) VALUES (
  'Aloísio Ferreira',
  'Legal & Accounting',
  'Belo Horizonte / Lagoa Santa',
  ARRAY['Accounting', 'Belo Horizonte', 'Lagoa Santa'],
  ARRAY['pt'],
  'Sócio da ELO Inteligência Contábil, com unidades em BH e Lagoa Santa. Especialista em contabilidade e gestão financeira.',
  'Partner at ELO Inteligência Contábil, with offices in BH and Lagoa Santa. Specialist in accounting and financial management.',
  'Socio de ELO Inteligência Contábil, con oficinas en BH y Lagoa Santa. Especialista en contabilidad y gestión financiera.',
  'https://elo.cnt.br',
  true, false, true, false
);