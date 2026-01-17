-- Create documents/paperwork tracking table
CREATE TABLE public.client_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('liability_waiver', 'boarding_agreement', 'lesson_registration', 'emergency_contact_form', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'signed', 'expired')),
  sent_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

-- Users can view their own documents
CREATE POLICY "Users can view own documents"
ON public.client_documents
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can do everything with documents
CREATE POLICY "Admins can manage all documents"
ON public.client_documents
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all profiles  
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_client_documents_updated_at
BEFORE UPDATE ON public.client_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();