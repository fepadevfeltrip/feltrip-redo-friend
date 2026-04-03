-- Create community_groups table
CREATE TABLE public.community_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.community_group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create group_posts table
CREATE TABLE public.community_group_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_group_posts ENABLE ROW LEVEL SECURITY;

-- RLS for community_groups
CREATE POLICY "Users can view groups from their company"
ON public.community_groups FOR SELECT
USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Managers can create groups"
ON public.community_groups FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'manager'::app_role) 
  AND company_id = get_user_company_id(auth.uid())
  AND auth.uid() = created_by
);

CREATE POLICY "Managers can update their company groups"
ON public.community_groups FOR UPDATE
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND company_id = get_user_company_id(auth.uid())
);

CREATE POLICY "Managers can delete their company groups"
ON public.community_groups FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role) 
  AND company_id = get_user_company_id(auth.uid())
);

-- RLS for community_group_members
CREATE POLICY "Users can view members of groups they can see"
ON public.community_group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id AND g.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can join groups from their company"
ON public.community_group_members FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = group_id AND g.company_id = get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can leave groups"
ON public.community_group_members FOR DELETE
USING (auth.uid() = user_id);

-- RLS for community_group_posts
CREATE POLICY "Members can view group posts"
ON public.community_group_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = community_group_posts.group_id AND m.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = community_group_posts.group_id 
    AND g.company_id = get_user_company_id(auth.uid())
    AND has_role(auth.uid(), 'manager'::app_role)
  )
);

CREATE POLICY "Members can create posts in their groups"
ON public.community_group_posts FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_group_members m
    WHERE m.group_id = community_group_posts.group_id AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own posts"
ON public.community_group_posts FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Managers can delete any post in their company groups"
ON public.community_group_posts FOR DELETE
USING (
  has_role(auth.uid(), 'manager'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.community_groups g
    WHERE g.id = community_group_posts.group_id AND g.company_id = get_user_company_id(auth.uid())
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_community_groups_updated_at
  BEFORE UPDATE ON public.community_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_community_group_posts_updated_at
  BEFORE UPDATE ON public.community_group_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();