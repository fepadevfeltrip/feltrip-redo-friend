-- Add Dúnia Valle
INSERT INTO concierge_experts (full_name, specialty, city, languages, phone, is_feltrip_indicated, is_community_verified, is_cult_approved, categories, bio, bio_en, bio_es, website)
VALUES (
  'Dúnia Valle',
  'Gynecology, Obstetrics & Sexology',
  'São Paulo',
  ARRAY['pt'],
  NULL,
  true,
  false,
  false,
  ARRAY['Health'],
  'Ginecologista, obstetra e sexóloga com foco em ginecologia natural. Indicada pela Feltrip.',
  'Gynecologist, obstetrician and sexologist focused on natural gynecology. Feltrip indicated.',
  'Ginecóloga, obstetra y sexóloga con enfoque en ginecología natural. Indicada por Feltrip.',
  'https://ventrevivo.com.br'
);

-- Update Lorenza Preto languages to include es and en
UPDATE concierge_experts
SET languages = ARRAY['pt', 'es', 'en']
WHERE full_name = 'Lorenza Preto';