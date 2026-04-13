import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, Clock, MapPin, Navigation, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { haversineDistance, generateOTP, type Profile, type Ride } from '@/lib/rideUtils';

interface RideRequestsPageProps {
  driverProfile: Profile;
  isOnline: boolean;
  driverLat: number | null;
  driverLng: number | null;
  onAcceptRide: (ride: Ride) => void;
}

export default function RideRequestsPage({ driverProfile, isOnline, driverLat, driverLng, onAcceptRide }: RideRequestsPageProps) {
  const [requests, setRequests] = useState<Ride[]>([]);

  // Use refs for lat/lng so the subscription effect doesn't re-run on every GPS update
  const latRef = useRef(driverLat);
  const lngRef = useRef(driverLng);
  latRef.current = driverLat;
  lngRef.current = driverLng;

  const isWithinRadius = useCallback((ride: Ride) => {
    if (latRef.current === null || lngRef.current === null) return true;
    return haversineDistance(latRef.current, lngRef.current, ride.pickup_lat, ride.pickup_lng) <= 5;
  }, []);

  // Fetch pending rides and subscribe — only depends on isOnline and vehicle_type
  useEffect(() => {
    if (!isOnline || !driverProfile.vehicle_type) {
      setRequests([]);
      return;
    }

    const fetchPending = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .eq('vehicle_type', driverProfile.vehicle_type!)
        .is('driver_id', null)
        .order('created_at', { ascending: false });

      if (data) {
        const filtered = (data as unknown as Ride[]).filter(isWithinRadius);
        setRequests(filtered);
      }
    };
    fetchPending();

    const channel = supabase
      .channel('pending-rides')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'rides',
        filter: `status=eq.pending`,
      }, (payload) => {
        const newRide = payload.new as unknown as Ride;
        if (newRide.vehicle_type !== driverProfile.vehicle_type) return;
        if (!isWithinRadius(newRide)) return;
        setRequests(prev => {
          // Avoid duplicates
          if (prev.some(r => r.id === newRide.id)) return prev;
          return [newRide, ...prev];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'rides',
      }, (payload) => {
        const updated = payload.new as unknown as Ride;
        if (updated.status !== 'pending') {
          setRequests(prev => prev.filter(r => r.id !== updated.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isOnline, driverProfile.vehicle_type, isWithinRadius]);

  // Periodically re-filter by distance (every 30s) without tearing down subscription
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(() => {
      setRequests(prev => prev.filter(isWithinRadius));
    }, 30000);
    return () => clearInterval(interval);
  }, [isOnline, isWithinRadius]);

  const handleAccept = async (ride: Ride) => {
    const otp = generateOTP();

    const { error } = await supabase
      .from('rides')
      .update({
        driver_id: driverProfile.id,
        status: 'accepted',
        otp,
      } as any)
      .eq('id', ride.id)
      .eq('status', 'pending');

    if (error) return;

    setRequests(prev => prev.filter(r => r.id !== ride.id));
    onAcceptRide({ ...ride, driver_id: driverProfile.id, status: 'accepted', otp });
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
  };

  if (!isOnline) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Ride Requests</h1>
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">You are offline</p>
          <p className="text-sm mt-1">Go online to receive ride requests</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ride Requests</h1>

      {requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No pending requests</p>
          <p className="text-sm mt-1">New {driverProfile.vehicle_type} ride requests will appear here</p>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Pending {driverProfile.vehicle_type?.charAt(0).toUpperCase()}{driverProfile.vehicle_type?.slice(1)} Requests
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {requests.map((req) => {
                const distFromDriver = latRef.current !== null && lngRef.current !== null
                  ? haversineDistance(latRef.current, lngRef.current, req.pickup_lat, req.pickup_lng)
                  : null;

                return (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="bg-card border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground truncate">
                        {req.pickup_name} → {req.drop_name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{req.eta} min</span>
                        <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{Number(req.distance_km).toFixed(1)} km</span>
                        {distFromDriver !== null && (
                          <span className="text-primary font-medium">{distFromDriver.toFixed(1)} km away</span>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-foreground shrink-0">₹{req.fare}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleDecline(req.id)}
                        className="w-9 h-9 rounded-full border flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleAccept(req)}
                        className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
