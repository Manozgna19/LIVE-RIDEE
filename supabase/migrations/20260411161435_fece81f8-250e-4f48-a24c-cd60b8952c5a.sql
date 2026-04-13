
-- RATINGS TABLE
CREATE TABLE public.ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  rater_id UUID NOT NULL,
  ratee_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX idx_ratings_unique ON public.ratings (ride_id, rater_id);

CREATE POLICY "Users can read ratings they gave or received" ON public.ratings FOR SELECT TO authenticated USING (auth.uid() = rater_id OR auth.uid() = ratee_id);
CREATE POLICY "Users can create own ratings" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);

-- MESSAGES TABLE
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_messages_ride ON public.messages (ride_id, created_at);

CREATE POLICY "Ride participants can read messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_id AND (rides.rider_id = auth.uid() OR rides.driver_id = auth.uid()))
);
CREATE POLICY "Ride participants can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.rides WHERE rides.id = ride_id AND (rides.rider_id = auth.uid() OR rides.driver_id = auth.uid()))
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- FAVORITE LOCATIONS TABLE
CREATE TABLE public.favorite_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  address_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.favorite_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own favorites" ON public.favorite_locations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own favorites" ON public.favorite_locations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own favorites" ON public.favorite_locations FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.favorite_locations FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- SOS ALERTS TABLE
CREATE TABLE public.sos_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL,
  user_id UUID NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own SOS" ON public.sos_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated can read SOS alerts" ON public.sos_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can resolve own SOS" ON public.sos_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
