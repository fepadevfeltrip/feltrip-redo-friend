INSERT INTO concierge_experts (full_name, specialty, city, languages, phone, is_feltrip_indicated, is_community_verified, is_cult_approved, categories, bio, bio_en, bio_es)
VALUES (
  'Ian',
  'Pediatrics',
  'Rio de Janeiro',
  ARRAY['pt'],
  '+5521981830805',
  false,
  false,
  false,
  ARRAY['Health'],
  'Médico pediatra no Rio de Janeiro. Indicado por clientes e parceiros da Feltrip.',
  'Pediatrician in Rio de Janeiro. Referred by Feltrip clients and partners.',
  'Médico pediatra en Río de Janeiro. Indicado por clientes y socios de Feltrip.'
);