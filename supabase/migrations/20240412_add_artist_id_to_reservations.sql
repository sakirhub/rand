-- Add artist_id column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN artist_id UUID REFERENCES public.artists(id);

-- Add RLS policies for artist_id
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything with artist_id
CREATE POLICY "Admins can do everything with artist_id" ON public.reservations
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow designers to view and set artist_id
CREATE POLICY "Designers can view and set artist_id" ON public.reservations
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'designer');

CREATE POLICY "Designers can update artist_id" ON public.reservations
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'designer')
  WITH CHECK (auth.jwt() ->> 'role' = 'designer');

-- Allow artists to view their own reservations
CREATE POLICY "Artists can view their own reservations" ON public.reservations
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'artist' AND
    artist_id = auth.uid()
  );

-- Create index for better performance
CREATE INDEX idx_reservations_artist_id ON public.reservations(artist_id); 