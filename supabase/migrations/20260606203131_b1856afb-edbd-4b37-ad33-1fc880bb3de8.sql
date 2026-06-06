CREATE POLICY "Users can view accounts they have access to"
ON public.email_accounts FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.email_account_access
    WHERE email_account_access.email_account_id = email_accounts.id
      AND email_account_access.user_id = auth.uid()
  )
);