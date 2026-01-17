-- Add DocuSign tracking columns to client_documents
ALTER TABLE public.client_documents 
ADD COLUMN IF NOT EXISTS envelope_id text,
ADD COLUMN IF NOT EXISTS docusign_status text,
ADD COLUMN IF NOT EXISTS signing_url text,
ADD COLUMN IF NOT EXISTS recipient_email text;

-- Create index for envelope lookups
CREATE INDEX IF NOT EXISTS idx_client_documents_envelope_id ON public.client_documents(envelope_id);

-- Create table to store DocuSign OAuth tokens for the admin
CREATE TABLE IF NOT EXISTS public.docusign_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  account_id text,
  base_uri text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on docusign_tokens
ALTER TABLE public.docusign_tokens ENABLE ROW LEVEL SECURITY;

-- Only admins can manage DocuSign tokens
CREATE POLICY "Admins can manage docusign tokens"
ON public.docusign_tokens
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_docusign_tokens_updated_at
  BEFORE UPDATE ON public.docusign_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();