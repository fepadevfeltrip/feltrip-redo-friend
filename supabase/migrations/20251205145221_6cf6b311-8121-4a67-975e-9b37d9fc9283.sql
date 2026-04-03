
-- Corrigir política de companies - Manager só vê SUA empresa
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (
  id = get_user_company_id(auth.uid())
);

-- Owner e Admin podem ver TODAS as empresas
CREATE POLICY "Owner and Admin can view all companies" 
ON public.companies 
FOR SELECT 
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Owner e Admin podem gerenciar empresas (INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Managers can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Managers can update companies" ON public.companies;

CREATE POLICY "Owner and Admin can insert companies" 
ON public.companies 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Owner and Admin can update companies" 
ON public.companies 
FOR UPDATE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'manager'::app_role) AND id = get_user_company_id(auth.uid()))
);

CREATE POLICY "Owner and Admin can delete companies" 
ON public.companies 
FOR DELETE
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Owner e Admin podem ver todos os profiles
DROP POLICY IF EXISTS "Managers can view expatriate profiles" ON public.profiles;

CREATE POLICY "Owner and Admin can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Managers só veem códigos da própria empresa
DROP POLICY IF EXISTS "Managers can view codes" ON public.registration_codes;

CREATE POLICY "Users can view their company codes" 
ON public.registration_codes 
FOR SELECT 
USING (
  company_id = get_user_company_id(auth.uid()) OR
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Managers só podem criar códigos para própria empresa
DROP POLICY IF EXISTS "Managers can create codes" ON public.registration_codes;

CREATE POLICY "Users can create codes for their company" 
ON public.registration_codes 
FOR INSERT 
WITH CHECK (
  company_id = get_user_company_id(auth.uid()) OR
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Managers só podem atualizar códigos da própria empresa
DROP POLICY IF EXISTS "Managers can update codes" ON public.registration_codes;

CREATE POLICY "Users can update their company codes" 
ON public.registration_codes 
FOR UPDATE 
USING (
  company_id = get_user_company_id(auth.uid()) OR
  has_role(auth.uid(), 'owner'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);
