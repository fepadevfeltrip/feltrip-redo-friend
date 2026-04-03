-- Criar perfil para serpenteconsultoria@gmail.com (Maiara Pavei - colaboradora Feltrip)
INSERT INTO profiles (user_id, full_name, company_id)
VALUES ('3e30bed1-9c2b-4057-9c19-86d39803fb35', 'Maiara Pavei', 'f7a8cf09-40ad-40c4-b073-525c3356c4e1')
ON CONFLICT (user_id) DO UPDATE SET 
  full_name = 'Maiara Pavei',
  company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1';

-- Atribuir papel de expatriado
INSERT INTO user_roles (user_id, role)
VALUES ('3e30bed1-9c2b-4057-9c19-86d39803fb35', 'expatriate')
ON CONFLICT (user_id, role) DO NOTHING;