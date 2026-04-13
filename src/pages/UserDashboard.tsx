import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Search, Star, Clock, IndianRupee, History, Car, Bike, CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeocoding, type GeocodedLocation } from '@/hooks/useGeocoding';
import { haversineDistance, calculateFare, calculateETA, generateOTP, type Profile, type Ride, type VehicleType } from '@/lib/rideUtils';
import { supabase } from '@/integrations/supabase/client';
import RideMap from '@/components/RideMap';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { UserSidebar, type UserView } from '@/components/UserSidebar';
import TrackRide from '@/components/user/TrackRide';
import RideHistoryPage from '@/components/user/RideHistoryPage';
import CarpoolPage from '@/components/user/CarpoolPage';
import SubscriptionsPage from '@/components/user/SubscriptionsPage';
import ScheduledRidesPage from '@/components/user/ScheduledRidesPage';
import RatingDialog from '@/components/user/RatingDialog';
import FavoriteLocations from '@/components/user/FavoriteLocations';
import RideChat from '@/components/shared/RideChat';
import SOSButton from '@/components/shared/SOSButton';
import { toast } from '@/hooks/use-toast';

interface LocationOption {
  name: string;
  lat: number;
  lng: number;
  area: string;
}

interface UserDashboardProps {
  profile: Profile;
  onLogout: () => void;
}

export default function UserDashboard({ profile, onLogout }: UserDashboardProps) {
  const [activeView, setActiveView] = useState<UserView>('book');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupLocation, setPickupLocation] = useState<LocationOption | null>(null);
  const [dropLocation, setDropLocation] = useState<LocationOption | null>(null);
  const pickupGeo = useGeocoding();
  const dropGeo = useGeocoding();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('car');
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [driverProfile, setDriverProfile] = useState<Profile | null>(null);
  const [driverPosition, setDriverPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState<{ lat: number; lng: number }[]>([]);
  const [showRating, setShowRating] = useState(false);
  const [rideToRate, setRideToRate] = useState<Ride | null>(null);

  // Check for active ride on mount
  useEffect(() => {
    const loadActiveRide = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('rider_id', profile.id)
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const ride = data[0] as unknown as Ride;
        setCurrentRide(ride);
        if (ride.driver_id) {
          fetchDriverInfo(ride.driver_id);
        }
      }
    };
    loadActiveRide();
  }, [profile.id]);

  // Subscribe to ALL ride changes for this rider
  useEffect(() => {
    const channel = supabase
      .channel(`rider-rides-${profile.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rides',
        filter: `rider_id=eq.${profile.id}`,
      }, (payload) => {
        const updated = payload.new as unknown as Ride;
        if (!updated || !updated.id) return;
        
        if (['pending', 'accepted', 'in_progress', 'completed'].includes(updated.status)) {
          setCurrentRide(prev => {
            if (prev && prev.id === updated.id) return updated;
            if (!prev && updated.status === 'pending') return updated;
            return prev;
          });
        }
        
        if (updated.driver_id && !driverProfile) {
          fetchDriverInfo(updated.driver_id);
        }
        if (updated.status === 'accepted') {
          fetchDriverInfo(updated.driver_id!);
          toast({ title: 'Driver found!', description: 'A driver has accepted your ride' });
          setActiveView('book');
        }
        if (updated.status === 'in_progress') {
          toast({ title: 'Ride started!', description: 'Your ride is now in progress 🚗' });
          setActiveView('book');
        }
        if (updated.status === 'completed') {
          toast({ title: 'Ride completed!', description: `Fare: ₹${updated.fare}` });
          // Show rating dialog
          setRideToRate(updated);
          setShowRating(true);
        }
        if (updated.status === 'cancelled') {
          setCurrentRide(null);
          setDriverProfile(null);
          setDriverPosition(null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile.id]);

  // Subscribe to driver location updates
  useEffect(() => {
    if (!currentRide?.driver_id) return;

    const channel = supabase
      .channel(`driver-loc-${currentRide.driver_id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'driver_locations',
        filter: `driver_id=eq.${currentRide.driver_id}`,
      }, (payload) => {
        const loc = payload.new as any;
        if (loc.latitude && loc.longitude) {
          setDriverPosition({ lat: loc.latitude, lng: loc.longitude });
        }
      })
      .subscribe();

    supabase.from('driver_locations').select('*').eq('driver_id', currentRide.driver_id).single()
      .then(({ data }) => {
        if (data) setDriverPosition({ lat: (data as any).latitude, lng: (data as any).longitude });
      });

    return () => { supabase.removeChannel(channel); };
  }, [currentRide?.driver_id]);

  const fetchDriverInfo = async (driverId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', driverId).single();
    if (data) setDriverProfile(data as unknown as Profile);
  };

  // Fetch nearby available drivers when pickup is set
  useEffect(() => {
    if (!pickupLocation) { setNearbyDrivers([]); return; }

    const fetchNearby = async () => {
      const { data } = await supabase
        .from('driver_locations')
        .select('latitude, longitude, driver_id, profiles!inner(is_available, vehicle_type)')
        .eq('profiles.is_available', true);

      if (data) {
        const nearby = (data as any[])
          .filter(d => {
            const dist = haversineDistance(pickupLocation.lat, pickupLocation.lng, d.latitude, d.longitude);
            return dist <= 5;
          })
          .map(d => ({ lat: d.latitude as number, lng: d.longitude as number }));
        setNearbyDrivers(nearby);
      }
    };
    fetchNearby();
  }, [pickupLocation]);

  const handlePickupChange = (val: string) => {
    setPickup(val);
    setPickupLocation(null);
    pickupGeo.search(val);
  };

  const handleDropChange = (val: string) => {
    setDrop(val);
    setDropLocation(null);
    dropGeo.search(val);
  };

  const selectPickup = (loc: GeocodedLocation) => {
    setPickup(loc.name);
    setPickupLocation({ name: loc.name, lat: loc.lat, lng: loc.lng, area: loc.area });
    pickupGeo.clear();
  };

  const selectDrop = (loc: GeocodedLocation) => {
    setDrop(loc.name);
    setDropLocation({ name: loc.name, lat: loc.lat, lng: loc.lng, area: loc.area });
    dropGeo.clear();
  };

  const handleFavoriteSelect = (loc: { name: string; lat: number; lng: number }) => {
    if (!pickupLocation) {
      setPickup(loc.name);
      setPickupLocation({ name: loc.name, lat: loc.lat, lng: loc.lng, area: '' });
    } else {
      setDrop(loc.name);
      setDropLocation({ name: loc.name, lat: loc.lat, lng: loc.lng, area: '' });
    }
  };

  const requestRide = async () => {
    if (!pickupLocation || !dropLocation) {
      toast({ title: 'Select locations', description: 'Please select both pickup and drop from the suggestions', variant: 'destructive' });
      return;
    }
    setLoading(true);

    const distKm = haversineDistance(pickupLocation.lat, pickupLocation.lng, dropLocation.lat, dropLocation.lng);
    const fare = calculateFare(distKm, selectedVehicle);
    const eta = calculateETA(distKm);
    const otp = generateOTP();

    const { data, error } = await supabase.from('rides').insert({
      rider_id: profile.id,
      pickup_name: pickupLocation.name,
      drop_name: dropLocation.name,
      pickup_lat: pickupLocation.lat,
      pickup_lng: pickupLocation.lng,
      drop_lat: dropLocation.lat,
      drop_lng: dropLocation.lng,
      vehicle_type: selectedVehicle,
      fare,
      distance_km: distKm,
      eta,
      otp,
      status: 'pending',
    } as any).select().single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setCurrentRide(data as unknown as Ride);
      toast({ title: 'Ride requested!', description: 'Finding nearby drivers...' });
    }
    setLoading(false);
  };

  const cancelRide = async () => {
    if (!currentRide) return;
    await supabase.from('rides').update({ status: 'cancelled' } as any).eq('id', currentRide.id);
    resetRide();
  };

  const resetRide = () => {
    setCurrentRide(null);
    setDriverProfile(null);
    setDriverPosition(null);
    setPickup('');
    setDrop('');
    setPickupLocation(null);
    setDropLocation(null);
    setNearbyDrivers([]);
  };

  const handleRatingComplete = () => {
    setShowRating(false);
    setRideToRate(null);
    resetRide();
  };

  const distKm = pickupLocation && dropLocation
    ? haversineDistance(pickupLocation.lat, pickupLocation.lng, dropLocation.lat, dropLocation.lng)
    : 0;

  const vehicleOptions: { type: VehicleType; label: string; icon: string; fare: number }[] = distKm > 0
    ? [
        { type: 'bike', label: 'Bike', icon: '🏍️', fare: calculateFare(distKm, 'bike') },
        { type: 'auto', label: 'Auto', icon: '🛺', fare: calculateFare(distKm, 'auto') },
        { type: 'car', label: 'Car', icon: '🚗', fare: calculateFare(distKm, 'car') },
      ]
    : [];

  const isActiveRide = currentRide && ['accepted', 'in_progress'].includes(currentRide.status);

  const renderBookRide = () => (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative" style={{ minHeight: '45vh' }}>
        <RideMap
          pickup={pickupLocation ? { lat: pickupLocation.lat, lng: pickupLocation.lng } : null}
          drop={dropLocation ? { lat: dropLocation.lat, lng: dropLocation.lng } : null}
          driverPosition={driverPosition}
          status={currentRide?.status || 'idle'}
        />
      </div>

      <motion.div layout className="bg-card border-t rounded-t-2xl shadow-lg" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        <div className="p-4 space-y-4">
          <AnimatePresence mode="wait">
            {!currentRide && !showRating && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                {/* Favorite locations quick select */}
                <FavoriteLocations userId={profile.id} onSelect={handleFavoriteSelect} />

                {/* Pickup input */}
                <div className="relative">
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                    <Input placeholder="Pickup location" value={pickup} onChange={(e) => handlePickupChange(e.target.value)}
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground" />
                  </div>
                  {pickupGeo.results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-xl mt-1 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {pickupGeo.results.map((s, i) => (
                        <button key={`${s.lat}-${s.lng}-${i}`} onClick={() => selectPickup(s)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-left transition-colors">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{s.area}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Drop input */}
                <div className="relative">
                  <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                    <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />
                    <Input placeholder="Drop location" value={drop} onChange={(e) => handleDropChange(e.target.value)}
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground" />
                  </div>
                  {dropGeo.results.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-xl mt-1 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {dropGeo.results.map((s, i) => (
                        <button key={`${s.lat}-${s.lng}-${i}`} onClick={() => selectDrop(s)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-left transition-colors">
                          <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{s.area}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vehicle selection */}
                {pickupLocation && dropLocation && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className="text-sm font-semibold text-foreground">Choose your ride</p>
                    <div className="grid grid-cols-3 gap-2">
                      {vehicleOptions.map(v => (
                        <button key={v.type} onClick={() => setSelectedVehicle(v.type)}
                          className={`p-3 rounded-xl border text-center transition-all ${selectedVehicle === v.type ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}>
                          <span className="text-2xl">{v.icon}</span>
                          <p className="text-xs font-medium mt-1">{v.label}</p>
                          <p className="text-sm font-bold text-foreground">₹{v.fare}</p>
                          <p className="text-[10px] text-muted-foreground">{calculateETA(distKm)} min</p>
                        </button>
                      ))}
                    </div>

                    <div className="ride-card bg-secondary/50">
                      <div className="flex justify-between items-center text-sm">
                        <div>
                          <p className="text-muted-foreground">Distance</p>
                          <p className="font-semibold text-foreground">{distKm.toFixed(1)} km</p>
                        </div>
                        <div className="text-right">
                          <p className="text-muted-foreground">Est. Fare</p>
                          <p className="font-semibold text-foreground">₹{calculateFare(distKm, selectedVehicle)}</p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" size="lg" onClick={requestRide} disabled={loading}>
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Requesting...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Search className="w-4 h-4" /> Request {selectedVehicle === 'bike' ? 'Bike' : selectedVehicle === 'auto' ? 'Auto' : 'Car'} Ride
                        </span>
                      )}
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {currentRide?.status === 'pending' && (
              <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6 space-y-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                <p className="font-medium text-foreground">Finding nearby {currentRide.vehicle_type} drivers...</p>
                <p className="text-sm text-muted-foreground">Your ride request is live</p>
                <Button variant="outline" onClick={cancelRide} className="text-destructive">Cancel Request</Button>
              </motion.div>
            )}

            {currentRide && ['accepted', 'in_progress'].includes(currentRide.status) && driverProfile && (
              <motion.div key="active" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Status Banner */}
                {currentRide.status === 'accepted' && (
                  <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
                    <Car className="w-5 h-5 text-accent" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{driverProfile.name} is on the way!</p>
                      <p className="text-xs text-muted-foreground">Share the OTP with your driver to start the ride</p>
                    </div>
                  </div>
                )}
                {currentRide.status === 'in_progress' && (
                  <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Ride Verified ✅ • In Progress 🚗</p>
                      <p className="text-xs text-muted-foreground">Enjoy your ride!</p>
                    </div>
                  </div>
                )}

                <div className="ride-card">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {driverProfile.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{driverProfile.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Star className="w-3.5 h-3.5 text-accent fill-accent" /> {Number(driverProfile.rating).toFixed(1)}</span>
                        <span>•</span>
                        <span>{driverProfile.vehicle_name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{driverProfile.vehicle_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">ETA</p>
                      <p className="font-bold text-foreground">{currentRide.eta} min</p>
                    </div>
                  </div>
                </div>

                {/* OTP shown only when accepted (before driver verifies) */}
                {currentRide.status === 'accepted' && (
                  <div className="flex gap-3">
                    <div className="flex-1 ride-card bg-primary/5 text-center">
                      <p className="text-xs text-muted-foreground">Share OTP with Driver</p>
                      <p className="text-2xl font-bold tracking-widest text-primary">{currentRide.otp}</p>
                    </div>
                    <div className="flex-1 ride-card bg-secondary text-center">
                      <p className="text-xs text-muted-foreground">Fare</p>
                      <p className="text-xl font-bold text-foreground">₹{currentRide.fare}</p>
                    </div>
                  </div>
                )}

                {/* Fare only when in progress (OTP already verified) */}
                {currentRide.status === 'in_progress' && (
                  <div className="ride-card bg-secondary text-center">
                    <p className="text-xs text-muted-foreground">Fare</p>
                    <p className="text-xl font-bold text-foreground">₹{currentRide.fare}</p>
                  </div>
                )}

                {/* Chat & SOS */}
                <div className="flex gap-2">
                  <RideChat rideId={currentRide.id} userId={profile.id} otherName={driverProfile.name} inline />
                  <SOSButton rideId={currentRide.id} userId={profile.id} />
                </div>

                {/* Cancel ride option */}
                <Button variant="outline" onClick={cancelRide} className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">
                  Cancel Ride
                </Button>
              </motion.div>
            )}

            {showRating && rideToRate && rideToRate.driver_id && (
              <motion.div key="rating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RatingDialog
                  rideId={rideToRate.id}
                  raterId={profile.id}
                  rateeId={rideToRate.driver_id}
                  rateeName={driverProfile?.name || 'Driver'}
                  onComplete={handleRatingComplete}
                />
              </motion.div>
            )}

            {currentRide?.status === 'completed' && !showRating && (
              <motion.div key="completed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Ride Completed!</h3>
                  <p className="text-muted-foreground text-sm">{Number(currentRide.distance_km).toFixed(1)} km • ₹{currentRide.fare}</p>
                </div>
                <Button onClick={resetRide} className="w-full">Book Another Ride</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

    </div>
  );

  const renderFavorites = () => (
    <div className="flex-1 p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-foreground mb-6">Saved Places</h2>
      <FavoriteLocations userId={profile.id} onSelect={(loc) => {
        handleFavoriteSelect(loc);
        setActiveView('book');
      }} />
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'book': return renderBookRide();
      case 'track': return (
        <TrackRide
          ride={currentRide}
          driverProfile={driverProfile}
          driverPosition={driverPosition}
          userId={profile.id}
        />
      );
      case 'history': return <RideHistoryPage userId={profile.id} />;
      case 'favorites': return renderFavorites();
      case 'carpool': return <CarpoolPage userId={profile.id} />;
      case 'subscriptions': return <SubscriptionsPage />;
      case 'scheduled': return <ScheduledRidesPage />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <UserSidebar activeView={activeView} onViewChange={setActiveView} onLogout={onLogout} />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b bg-card px-4 gap-3">
            <SidebarTrigger />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Hello, {profile.name}</p>
            </div>
          </header>
          <main className="flex-1 flex flex-col">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
