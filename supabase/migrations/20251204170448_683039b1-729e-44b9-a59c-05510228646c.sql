-- Create table for legal documents (Terms of Use, Privacy Policy)
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'terms_of_use' or 'privacy_policy'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- Anyone can view active legal documents (public)
CREATE POLICY "Anyone can view active legal documents"
ON public.legal_documents
FOR SELECT
USING (is_active = true);

-- Only managers can manage legal documents
CREATE POLICY "Managers can insert legal documents"
ON public.legal_documents
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update legal documents"
ON public.legal_documents
FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can delete legal documents"
ON public.legal_documents
FOR DELETE
USING (has_role(auth.uid(), 'manager'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_legal_documents_updated_at
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial placeholder documents
INSERT INTO public.legal_documents (type, title, content, version) VALUES 
('terms_of_use', 'Termos de Uso', 'Insira aqui os termos de uso do aplicativo.', '1.0'),
('privacy_policy', 'Política de Privacidade', 'Insira aqui a política de privacidade do aplicativo.', '1.0');