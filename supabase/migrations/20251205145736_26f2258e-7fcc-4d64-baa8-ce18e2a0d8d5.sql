
-- ============================================
-- CORREÇÃO COMPLETA DE PERMISSÕES
-- Owner: acesso total
-- Admin: acesso arquitetura (não deleta empresas)
-- Manager: só sua empresa/comunidade, só painel RH
-- Expatriate: só seus dados
-- ============================================

-- 1. ENGAGEMENT TRACKING - Owner/Admin veem tudo, Manager só sua empresa
DROP POLICY IF EXISTS "Managers can view engagement data" ON public.engagement_tracking;

CREATE POLICY "Owner and Admin can view all engagement" 
ON public.engagement_tracking FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their company engagement" 
ON public.engagement_tracking FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = engagement_tracking.user_id AND p2.user_id = auth.uid()
  )
);

-- 2. EXTERNAL PARTNERS - Owner/Admin gerenciam, Manager só vê
DROP POLICY IF EXISTS "Managers can delete partners" ON public.external_partners;
DROP POLICY IF EXISTS "Managers can insert partners" ON public.external_partners;
DROP POLICY IF EXISTS "Managers can update partners" ON public.external_partners;

CREATE POLICY "Owner and Admin can manage partners" 
ON public.external_partners FOR ALL 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 3. FAMILY MEMBERS - Owner/Admin veem tudo, Manager só sua empresa
DROP POLICY IF EXISTS "Managers can view all family members" ON public.family_members;

CREATE POLICY "Owner and Admin can view all family members" 
ON public.family_members FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their company family members" 
ON public.family_members FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.id = family_members.primary_user_id AND p2.user_id = auth.uid()
  )
);

-- 4. HR SHARED DATA - Owner/Admin veem tudo, Manager só sua empresa
DROP POLICY IF EXISTS "Managers can view shared data" ON public.hr_shared_data;

CREATE POLICY "Owner and Admin can view all HR data" 
ON public.hr_shared_data FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their company HR data" 
ON public.hr_shared_data FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = hr_shared_data.user_id AND p2.user_id = auth.uid()
  )
);

-- 5. INTERNAL SERVICE REQUESTS - Owner/Admin veem tudo, Manager só sua empresa
DROP POLICY IF EXISTS "Managers can view all requests" ON public.internal_service_requests;
DROP POLICY IF EXISTS "Managers can update requests" ON public.internal_service_requests;

CREATE POLICY "Owner and Admin can view all requests" 
ON public.internal_service_requests FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner and Admin can update all requests" 
ON public.internal_service_requests FOR UPDATE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their company requests" 
ON public.internal_service_requests FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = internal_service_requests.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can update their company requests" 
ON public.internal_service_requests FOR UPDATE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = internal_service_requests.user_id AND p2.user_id = auth.uid()
  )
);

-- 6. LEGAL DOCUMENTS - Só Owner/Admin gerenciam
DROP POLICY IF EXISTS "Managers can delete legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Managers can insert legal documents" ON public.legal_documents;
DROP POLICY IF EXISTS "Managers can update legal documents" ON public.legal_documents;

CREATE POLICY "Owner and Admin can manage legal documents" 
ON public.legal_documents FOR ALL 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 7. MAP PINS - Manager só vê da sua empresa
DROP POLICY IF EXISTS "Managers can view pins shared with HR" ON public.map_pins;
DROP POLICY IF EXISTS "Managers can delete pins from their company" ON public.map_pins;

CREATE POLICY "Owner and Admin can view all HR pins" 
ON public.map_pins FOR SELECT 
USING (is_shared_with_hr = true AND (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Managers can view their company HR pins" 
ON public.map_pins FOR SELECT 
USING (
  is_shared_with_hr = true AND 
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pins.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Owner and Admin can delete any pins" 
ON public.map_pins FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can delete their company pins" 
ON public.map_pins FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pins.user_id AND p2.user_id = auth.uid()
  )
);

-- 8. PROFILES - Manager só vê da sua empresa
DROP POLICY IF EXISTS "Managers can view all company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Managers can update profiles in their company" ON public.profiles;

CREATE POLICY "Owner and Admin can update any profile" 
ON public.profiles FOR UPDATE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can update their company profiles" 
ON public.profiles FOR UPDATE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  company_id = get_user_company_id(auth.uid())
);

-- 9. USAGE LOG - Owner/Admin veem tudo, Manager só sua empresa
DROP POLICY IF EXISTS "Managers can view all logs" ON public.usage_log;

CREATE POLICY "Owner and Admin can view all logs" 
ON public.usage_log FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their company logs" 
ON public.usage_log FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = usage_log.user_id AND p2.user_id = auth.uid()
  )
);

-- 10. USER USAGE - Owner/Admin veem tudo, Manager só sua empresa
DROP POLICY IF EXISTS "Managers can view all usage" ON public.user_usage;
DROP POLICY IF EXISTS "Managers can update usage" ON public.user_usage;

CREATE POLICY "Owner and Admin can view all usage" 
ON public.user_usage FOR SELECT 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owner and Admin can update all usage" 
ON public.user_usage FOR UPDATE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can view their company usage" 
ON public.user_usage FOR SELECT 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = user_usage.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can update their company usage" 
ON public.user_usage FOR UPDATE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = user_usage.user_id AND p2.user_id = auth.uid()
  )
);

-- 11. COMMUNITY EVENTS/POSTS - Manager só administra sua comunidade
DROP POLICY IF EXISTS "Managers can delete events from their company" ON public.community_events;
DROP POLICY IF EXISTS "Managers can delete posts from their company" ON public.community_posts;

CREATE POLICY "Owner and Admin can delete any events" 
ON public.community_events FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can delete their community events" 
ON public.community_events FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = community_events.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Owner and Admin can delete any posts" 
ON public.community_posts FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can delete their community posts" 
ON public.community_posts FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = community_posts.user_id AND p2.user_id = auth.uid()
  )
);

-- 12. MAP PIN COMMENTS/LIKES - Manager só sua comunidade
DROP POLICY IF EXISTS "Managers can delete comments from their company" ON public.map_pin_comments;
DROP POLICY IF EXISTS "Managers can delete likes from their company" ON public.map_pin_likes;

CREATE POLICY "Owner and Admin can delete any comments" 
ON public.map_pin_comments FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can delete their community comments" 
ON public.map_pin_comments FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pin_comments.user_id AND p2.user_id = auth.uid()
  )
);

CREATE POLICY "Owner and Admin can delete any likes" 
ON public.map_pin_likes FOR DELETE 
USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can delete their community likes" 
ON public.map_pin_likes FOR DELETE 
USING (
  has_role(auth.uid(), 'manager'::app_role) AND 
  EXISTS (
    SELECT 1 FROM profiles p1 
    JOIN profiles p2 ON p1.company_id = p2.company_id
    WHERE p1.user_id = map_pin_likes.user_id AND p2.user_id = auth.uid()
  )
);
