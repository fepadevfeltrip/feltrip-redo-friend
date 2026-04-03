
INSERT INTO concierge_experts (
  full_name, specialty, city, languages, bio,
  bio_en, bio_es,
  website, is_feltrip_indicated, is_active, categories
) VALUES (
  'Ana Karenina Riehl',
  'Culture, Language & Translation',
  'Belo Horizonte',
  ARRAY['pt', 'es'],
  'Mentora em artes e cultura local. Multiartista, multiprofissional, multilinguagens. Graduação e vivência em artes da cena com estudo multidisciplinar em Ciências Políticas, Sociologia, Artes Cênicas, História Oral e Documental.',
  'Mentor in local arts and culture. Multi-artist, multi-professional, multi-language. Background in performing arts with multidisciplinary studies in Political Sciences, Sociology, Performing Arts, Oral and Documentary History.',
  'Mentora en artes y cultura local. Multiartista, multiprofesional, multilenguajes. Graduación y vivencia en artes escénicas con estudio multidisciplinar en Ciencias Políticas, Sociología, Artes Escénicas, Historia Oral y Documental.',
  'https://www.linkedin.com/in/kareninariehl/',
  true,
  true,
  ARRAY['Culture', 'Language & Translation']
);
