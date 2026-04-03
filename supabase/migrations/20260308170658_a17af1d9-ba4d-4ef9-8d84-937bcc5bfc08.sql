INSERT INTO concierge_experts (full_name, specialty, city, languages, phone, is_feltrip_indicated, is_community_verified, is_cult_approved, categories, bio, bio_en, bio_es)
VALUES (
  'Maria Cristina Maiolino',
  'Gynecology & Anthroposophic Medicine',
  'Rio de Janeiro',
  ARRAY[]::text[],
  '+5521988957024',
  true,
  false,
  false,
  ARRAY['Health'],
  'Ginecologista com abordagem em medicina antroposófica no Rio de Janeiro. Indicada pela Feltrip.',
  'Gynecologist with an anthroposophic medicine approach in Rio de Janeiro. Feltrip indicated.',
  'Ginecóloga con enfoque en medicina antroposófica en Río de Janeiro. Indicada por Feltrip.'
);