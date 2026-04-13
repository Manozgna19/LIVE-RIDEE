
-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  role text NOT NULL DEFAULT 'rider' CHECK (role IN ('rider', 'driver')),
  vehicle_type text CHECK (vehicle_type IN ('bike', 'auto', 'car')),
  vehicle_name text,
  vehicle_number text,
  seats integer DEFAULT 4,
  is_available boolean DEFAULT false,
  rating numeric DEFAULT 5.0,
  total_rides integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Driver locations table
CREATE TABLE public.driver_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  latitude float8 NOT NULL,
  longitude float8 NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read driver locations" ON public.driver_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Drivers can insert own location" ON public.driver_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = driver_id);
CREATE POLICY "Drivers can update own location" ON public.driver_locations FOR UPDATE TO authenticated USING (auth.uid() = driver_id);

-- Rides table
CREATE TABLE public.rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_name text NOT NULL,
  drop_name text NOT NULL,
  pickup_lat float8 NOT NULL,
  pickup_lng float8 NOT NULL,
  drop_lat float8 NOT NULL,
  drop_lng float8 NOT NULL,
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('bike', 'auto', 'car')),
  fare numeric NOT NULL,
  distance_km numeric NOT NULL,
  eta integer,
  otp text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read relevant rides" ON public.rides FOR SELECT TO authenticated USING (rider_id = auth.uid() OR driver_id = auth.uid() OR status = 'pending');
CREATE POLICY "Riders can insert rides" ON public.rides FOR INSERT TO authenticated WITH CHECK (rider_id = auth.uid());
CREATE POLICY "Participants can update rides" ON public.rides FOR UPDATE TO authenticated USING (rider_id = auth.uid() OR driver_id = auth.uid() OR (status = 'pending' AND driver_id IS NULL));

-- Haversine distance function
CREATE OR REPLACE FUNCTION public.haversine_distance(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
RETURNS float8 AS $$
BEGIN
  RETURN 6371 * 2 * asin(sqrt(
    sin(radians((lat2 - lat1) / 2)) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians((lng2 - lng1) / 2)) ^ 2
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;
