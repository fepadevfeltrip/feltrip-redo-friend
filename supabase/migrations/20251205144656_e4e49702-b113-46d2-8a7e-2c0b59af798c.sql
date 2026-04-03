
-- Restringir companies para usuários verem apenas sua própria empresa
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;

CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (
  id = get_user_company_id(auth.uid())
  OR has_role(auth.uid(), 'manager'::app_role)
);
