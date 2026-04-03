INSERT INTO concierge_experts (
  full_name, specialty, city, categories, languages,
  bio, bio_en, bio_es,
  email, is_active, is_feltrip_indicated, is_community_verified, is_cult_approved
) VALUES (
  'Luiz Araújo',
  'Culture, Language & Translation',
  'Online',
  ARRAY['Language & Translation', 'Sworn Translation', 'Online'],
  ARRAY['pt', 'en', 'es'],
  'Tradutor juramentado com mais de 20 anos de experiência em traduções de inglês e espanhol para diversos tipos de documentos oficiais.',
  'Sworn translator with over 20 years of experience translating English and Spanish for various types of official documents.',
  'Traductor juramentado con más de 20 años de experiencia en traducciones de inglés y español para diversos tipos de documentos oficiales.',
  'luiz@supernovasci.com.br',
  true, true, false, false
);