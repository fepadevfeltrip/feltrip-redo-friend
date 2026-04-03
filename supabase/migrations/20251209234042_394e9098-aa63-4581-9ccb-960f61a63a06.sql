-- Fix Tatiana's company_id
UPDATE profiles 
SET company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1' 
WHERE user_id = 'e87bb47a-3408-4396-865d-ce811b100a36' AND company_id IS NULL;