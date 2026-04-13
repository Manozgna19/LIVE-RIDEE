
-- Carpools table
CREATE TABLE public.carpools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id),
  pickup_name text NOT NULL,
  pickup_lat double precision NOT NULL,
  pickup_lng double precision NOT NULL,
  drop_name text NOT NULL,
  drop_lat double precision NOT NULL,
  drop_lng double precision NOT NULL,
  departure_time timestamptz NOT NULL,
  total_seats integer NOT NULL DEFAULT 3,
  available_seats integer NOT NULL DEFAULT 3,
  fare_per_person numeric NOT NULL,
  distance_km numeric NOT NULL,
  vehicle_name text,
  vehicle_number text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Carpool passengers
CREATE TABLE public.carpool_passengers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carpool_id uuid NOT NULL REFERENCES public.carpools(id) ON DELETE CASCADE,
  passenger_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'confirmed',
  joined_at timestamptz DEFAULT now(),
  UNIQUE(carpool_id, passenger_id)
);

-- Enable RLS
ALTER TABLE public.carpools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carpool_passengers ENABLE ROW LEVEL SECURITY;

-- Carpools policies
CREATE POLICY "Anyone authenticated can read carpools" ON public.carpools FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create carpools" ON public.carpools FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
CREATE POLICY "Hosts can update own carpools" ON public.carpools FOR UPDATE TO authenticated USING (auth.uid() = host_id);

-- Carpool passengers policies
CREATE POLICY "Anyone authenticated can read passengers" ON public.carpool_passengers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join carpools" ON public.carpool_passengers FOR INSERT TO authenticated WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Users can leave carpools" ON public.carpool_passengers FOR DELETE TO authenticated USING (auth.uid() = passenger_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.carpools;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carpool_passengers;
