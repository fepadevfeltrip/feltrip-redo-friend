-- Fix fepa dev profile - associate with FELTRIP company
UPDATE public.profiles 
SET company_id = 'f7a8cf09-40ad-40c4-b073-525c3356c4e1'
WHERE user_id = 'd895c71c-74d7-45a1-a365-a81f7489814c';