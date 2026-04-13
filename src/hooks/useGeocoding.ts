import { useState, useCallback, useRef } from 'react';

export interface GeocodedLocation {
  name: string;
  lat: number;
  lng: number;
  area: string;
}

export function useGeocoding() {
  const [results, setResults] = useState<GeocodedLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<number>();

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 3) {
      setResults([]);
      return;
    }

    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=6&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        const locations: GeocodedLocation[] = data.map((item: any) => ({
          name: item.display_name.split(',').slice(0, 3).join(', '),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          area: item.address?.suburb || item.address?.neighbourhood || item.address?.city || item.address?.state_district || '',
        }));
        setResults(locations);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, search, clear };
}
