
-- Email accounts table (stores mail server credentials per account)
CREATE TABLE public.email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_address text NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  imap_host text NOT NULL DEFAULT 'mx440c.netcup.net',
  imap_port integer NOT NULL DEFAULT 993,
  smtp_host text NOT NULL DEFAULT 'mx440c.netcup.net',
  smtp_port integer NOT NULL DEFAULT 465,
  username text NOT NULL,
  password text NOT NULL,
  is_shared boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage email accounts"
ON public.email_accounts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Email account access (maps users to accounts with permissions)
CREATE TABLE public.email_account_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_account_id uuid REFERENCES public.email_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  can_read boolean NOT NULL DEFAULT true,
  can_send boolean NOT NULL DEFAULT true,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email_account_id, user_id)
);

ALTER TABLE public.email_account_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage email access"
ON public.email_account_access FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own email access"
ON public.email_account_access FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Contacts
CREATE TABLE public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  phone text,
  company text,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contacts"
ON public.contacts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Contact groups
CREATE TABLE public.contact_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage contact groups"
ON public.contact_groups FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Contact group members
CREATE TABLE public.contact_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.contact_groups(id) ON DELETE CASCADE NOT NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, contact_id)
);

ALTER TABLE public.contact_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage group members"
ON public.contact_group_members FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Mailing lists
CREATE TABLE public.mailing_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mailing_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mailing lists"
ON public.mailing_lists FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Mailing list subscribers
CREATE TABLE public.mailing_list_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES public.mailing_lists(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  name text,
  subscribed boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  UNIQUE(list_id, email)
);

ALTER TABLE public.mailing_list_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscribers"
ON public.mailing_list_subscribers FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Email signatures
CREATE TABLE public.email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_account_id uuid REFERENCES public.email_accounts(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Default',
  signature_html text NOT NULL DEFAULT '',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own signatures"
ON public.email_signatures FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all signatures"
ON public.email_signatures FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));
