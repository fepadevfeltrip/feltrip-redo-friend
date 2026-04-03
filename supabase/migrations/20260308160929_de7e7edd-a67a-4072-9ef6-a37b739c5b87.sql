INSERT INTO concierge_experts (
  full_name, specialty, city, categories, languages,
  bio, bio_en, bio_es,
  phone, is_active, is_feltrip_indicated, is_community_verified, is_cult_approved
) VALUES (
  'Rafaela Rocha',
  'Culture, Language & Translation',
  'Rio de Janeiro',
  ARRAY['Culture', 'Language & Translation', 'Rio de Janeiro', 'Online'],
  ARRAY['pt', 'en'],
  'Artista e educadora, já trabalhou em projetos de impacto com a Feltrip. Cidadã global, morou em Londres e diversas cidades do Brasil. Oferece mentoria de língua portuguesa, arte, cultura local e sistema educacional brasileiro.',
  'Artist and educator who has worked on impact projects with Feltrip. A global citizen who lived in London and various cities in Brazil. Offers mentoring in Portuguese language, art, local culture, and the Brazilian educational system.',
  'Artista y educadora, trabajó en proyectos de impacto con Feltrip. Ciudadana global, vivió en Londres y diversas ciudades de Brasil. Ofrece mentoría en lengua portuguesa, arte, cultura local y sistema educacional brasileño.',
  '+5521985312818',
  true, true, false, false
);