CREATE TABLE public.supply_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor text NOT NULL,
  amount numeric NOT NULL,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  category text NOT NULL DEFAULT 'feed',
  supply_id uuid REFERENCES public.supply_inventory(id) ON DELETE SET NULL,
  quantity numeric,
  unit text,
  notes text,
  receipt_image_url text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.supply_receipts TO authenticated;
GRANT ALL ON public.supply_receipts TO service_role;

ALTER TABLE public.supply_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage supply receipts"
ON public.supply_receipts FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER update_supply_receipts_updated_at
BEFORE UPDATE ON public.supply_receipts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_supply_receipts_date ON public.supply_receipts(purchase_date DESC);
CREATE INDEX idx_supply_receipts_supply ON public.supply_receipts(supply_id);