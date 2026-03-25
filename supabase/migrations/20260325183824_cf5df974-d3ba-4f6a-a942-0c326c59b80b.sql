
-- Drop the overly permissive ALL policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Separate SELECT policy for admins (already exists, keep it)
-- "Admins can view all roles" and "Users can view their own roles" already handle SELECT

-- Admin-only INSERT with WITH CHECK
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admin-only UPDATE
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Admin-only DELETE
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);
