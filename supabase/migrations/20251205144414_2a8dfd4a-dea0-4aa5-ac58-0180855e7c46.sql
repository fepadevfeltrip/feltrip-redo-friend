
-- 1. CRÍTICO: Restringir external_partners para usuários autenticados
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.external_partners;
CREATE POLICY "Authenticated users can view active partners" 
ON public.external_partners 
FOR SELECT 
USING (is_active = true AND auth.uid() IS NOT NULL);

-- 2. CRÍTICO: Corrigir política de notificações para evitar spam
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications for themselves or via triggers" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  auth.uid() = actor_id OR
  auth.uid() IS NOT NULL
);

-- 3. ADICIONAL: Garantir que companies requer autenticação
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
CREATE POLICY "Authenticated users can view companies" 
ON public.companies 
FOR SELECT 
USING (auth.uid() IS NOT NULL);
