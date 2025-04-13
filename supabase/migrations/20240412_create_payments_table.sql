-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  payment_method TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins can do everything with payments" ON public.payments
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow designers to view and create payments
CREATE POLICY "Designers can view and create payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'designer');

CREATE POLICY "Designers can insert payments" ON public.payments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' = 'designer');

-- Allow tattoo artists to view payments for their reservations
CREATE POLICY "Tattoo artists can view payments for their reservations" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'tattoo_artist' AND
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = payments.reservation_id
      AND reservations.artist_id = auth.uid()
    )
  );

-- Allow info users to view payments for their referred customers
CREATE POLICY "Info users can view payments for their referred customers" ON public.payments
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'info' AND
    EXISTS (
      SELECT 1 FROM public.reservations
      WHERE reservations.id = payments.reservation_id
      AND reservations.referred_by = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at(); 