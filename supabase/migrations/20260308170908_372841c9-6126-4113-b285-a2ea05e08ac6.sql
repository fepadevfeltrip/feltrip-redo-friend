INSERT INTO concierge_experts (full_name, specialty, city, languages, phone, is_feltrip_indicated, is_community_verified, is_cult_approved, categories, bio, bio_en, bio_es)
VALUES (
  'Dr. Rowan',
  'Dentistry',
  'Rio de Janeiro',
  ARRAY['pt', 'en'],
  NULL,
  false,
  true,
  false,
  ARRAY['Health'],
  'Dentista no Rio de Janeiro. Indicado pela comunidade Feltrip.',
  'Dentist in Rio de Janeiro. Community indicated.',
  'Dentista en Río de Janeiro. Indicado por la comunidad Feltrip.'
);