
-- Concierge Experts table
CREATE TABLE public.concierge_experts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  slug text UNIQUE,
  specialty text NOT NULL,
  bio text,
  avatar_url text,
  city text NOT NULL,
  languages text[] DEFAULT '{}',
  categories text[] DEFAULT '{}',
  website text,
  email text,
  phone text,
  instagram text,
  is_active boolean NOT NULL DEFAULT true,
  is_cult_approved boolean NOT NULL DEFAULT false,
  is_feltrip_indicated boolean NOT NULL DEFAULT false,
  is_community_verified boolean NOT NULL DEFAULT false,
  verification_date timestamptz,
  total_reviews integer NOT NULL DEFAULT 0,
  avg_rating numeric(3,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.concierge_experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active experts" ON public.concierge_experts
  FOR SELECT USING (is_active = true);

CREATE POLICY "Owner and Admin can manage experts" ON public.concierge_experts
  FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Expert Referrals table
CREATE TABLE public.expert_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL REFERENCES public.concierge_experts(id) ON DELETE CASCADE,
  referrer_name text NOT NULL,
  referrer_type text NOT NULL DEFAULT 'client', -- 'feltrip', 'client', 'partner'
  referrer_email text,
  referral_note text,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.expert_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view verified referrals" ON public.expert_referrals
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Owner and Admin can manage referrals" ON public.expert_referrals
  FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Expert Reviews table
CREATE TABLE public.expert_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id uuid NOT NULL REFERENCES public.concierge_experts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(expert_id, user_id)
);

ALTER TABLE public.expert_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public reviews" ON public.expert_reviews
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own reviews" ON public.expert_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.expert_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owner and Admin can manage reviews" ON public.expert_reviews
  FOR ALL USING (has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on experts
CREATE TRIGGER update_concierge_experts_updated_at
  BEFORE UPDATE ON public.concierge_experts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
