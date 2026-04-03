-- Create external_partners table for partner directory
CREATE TABLE public.external_partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  website TEXT,
  observations TEXT,
  city TEXT,
  is_remote BOOLEAN NOT NULL DEFAULT false,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.external_partners ENABLE ROW LEVEL SECURITY;

-- Everyone can view active partners (public directory)
CREATE POLICY "Anyone can view active partners"
ON public.external_partners
FOR SELECT
USING (is_active = true);

-- Only managers can manage partners
CREATE POLICY "Managers can insert partners"
ON public.external_partners
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update partners"
ON public.external_partners
FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can delete partners"
ON public.external_partners
FOR DELETE
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_external_partners_updated_at
BEFORE UPDATE ON public.external_partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample partners
INSERT INTO public.external_partners (name, specialty, website, observations, city, is_remote, email, phone) VALUES
('Lisboa Home Finder', 'Housing', 'https://example.com', 'Specialized in expat housing', 'Lisbon', false, 'contact@lisbonhome.com', '+351 912 345 678'),
('Global Education Connect', 'Education', 'https://example.com', 'International school guidance', 'Global', true, 'info@globaledu.com', '+1 555 123 4567'),
('Porto Legal Partners', 'Legal', 'https://example.com', 'Immigration and visa specialists', 'Porto', false, 'legal@portolegal.com', '+351 923 456 789'),
('International Tax Advisors', 'Accounting', 'https://example.com', 'Expat tax consulting', 'Global', true, 'tax@intltax.com', '+44 20 1234 5678'),
('LanguageBridge Lisboa', 'Language', 'https://example.com', 'Portuguese courses for all levels', 'Lisbon', false, 'learn@langbridge.pt', '+351 934 567 890');