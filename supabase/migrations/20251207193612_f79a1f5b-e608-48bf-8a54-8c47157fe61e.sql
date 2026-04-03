-- Fix community_invite_links - require authentication for viewing
DROP POLICY IF EXISTS "Users can view specific active link by slug" ON public.community_invite_links;

-- Only allow viewing invite links via RPC function (validate_invite_link)
-- This prevents enumeration while still allowing link validation
-- The RPC function is SECURITY DEFINER and handles validation securely

-- Add MRP-WORKPLACE questionnaire support
-- Need to add columns for the 6th block (self-responsibility with 5 questions)
ALTER TABLE public.presence_questionnaires 
ADD COLUMN IF NOT EXISTS responsibility_q1 integer,
ADD COLUMN IF NOT EXISTS responsibility_q2 integer,
ADD COLUMN IF NOT EXISTS responsibility_q3 integer,
ADD COLUMN IF NOT EXISTS responsibility_q4 integer,
ADD COLUMN IF NOT EXISTS responsibility_q5 integer;