
-- Allow all authenticated users to view community-shared pins (public Dores & Delícias)
CREATE POLICY "Anyone authenticated can view community pins"
ON public.map_pins
FOR SELECT
TO authenticated
USING (is_shared_to_community = true);

-- Allow all authenticated users to create pins (public community dores/delicias)
CREATE POLICY "Authenticated users can create community pins"
ON public.map_pins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND is_shared_to_community = true);

-- Allow all authenticated users to view community posts (public feed)
CREATE POLICY "Authenticated users can view all community posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to create community posts (public feed)
CREATE POLICY "Authenticated users can create community posts"
ON public.community_posts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow all authenticated users to view community events (public)
CREATE POLICY "Authenticated users can view all community events"
ON public.community_events
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated to view all community groups (public browsing)
CREATE POLICY "Authenticated users can view all community groups"
ON public.community_groups
FOR SELECT
TO authenticated
USING (true);

-- Allow admin to create groups (info@feltrip.com has admin role)
CREATE POLICY "Admins can create groups"
ON public.community_groups
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') AND auth.uid() = created_by);
