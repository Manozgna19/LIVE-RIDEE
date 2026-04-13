CREATE POLICY "Drivers can delete own location"
ON public.driver_locations
FOR DELETE
TO authenticated
USING (auth.uid() = driver_id);