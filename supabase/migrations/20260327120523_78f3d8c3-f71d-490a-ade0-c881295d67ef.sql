
CREATE OR REPLACE FUNCTION public.haversine_distance(lat1 float8, lng1 float8, lat2 float8, lng2 float8)
RETURNS float8 AS $$
BEGIN
  RETURN 6371 * 2 * asin(sqrt(
    sin(radians((lat2 - lat1) / 2)) ^ 2 +
    cos(radians(lat1)) * cos(radians(lat2)) * sin(radians((lng2 - lng1) / 2)) ^ 2
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE
SET search_path = public;
