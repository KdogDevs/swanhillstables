
CREATE TABLE public.supply_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_name text NOT NULL,
  category text NOT NULL DEFAULT 'feed',
  quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'bags',
  low_threshold numeric DEFAULT 5,
  notes text,
  last_restocked_at timestamp with time zone,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.supply_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supply inventory"
  ON public.supply_inventory
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TABLE public.supply_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supply_id uuid REFERENCES public.supply_inventory(id) ON DELETE CASCADE NOT NULL,
  change_amount numeric NOT NULL,
  change_type text NOT NULL DEFAULT 'used',
  notes text,
  logged_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.supply_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage supply logs"
  ON public.supply_log
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
