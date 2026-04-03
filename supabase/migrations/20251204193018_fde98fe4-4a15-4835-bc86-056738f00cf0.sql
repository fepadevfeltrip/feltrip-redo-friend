-- Create internal_service_requests table for HR to track service requests
CREATE TABLE public.internal_service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  expatriate_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'em_andamento', 'concluido')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.internal_service_requests ENABLE ROW LEVEL SECURITY;

-- Policies: Managers can view and update all requests
CREATE POLICY "Managers can view all requests"
ON public.internal_service_requests
FOR SELECT
USING (has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Managers can update requests"
ON public.internal_service_requests
FOR UPDATE
USING (has_role(auth.uid(), 'manager'::app_role));

-- Users can create their own requests
CREATE POLICY "Users can create requests"
ON public.internal_service_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.internal_service_requests
FOR SELECT
USING (auth.uid() = user_id);