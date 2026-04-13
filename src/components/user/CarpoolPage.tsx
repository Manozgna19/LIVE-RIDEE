import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, ArrowRight, MapPin, Clock, User, CheckCircle2, Plus, Search,
  Car, Navigation, IndianRupee, Calendar, X, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useGeocoding, type GeocodedLocation } from '@/hooks/useGeocoding';
import { haversineDistance, calculateFare } from '@/lib/rideUtils';
import { toast } from '@/hooks/use-toast';

interface Carpool {
  id: string;
  host_id: string;
  pickup_name: string;
  pickup_lat: number;
  pickup_lng: number;
  drop_name: string;
  drop_lat: number;
  drop_lng: number;
  departure_time: string;
  total_seats: number;
  available_seats: number;
  fare_per_person: number;
  distance_km: number;
  vehicle_name: string | null;
  vehicle_number: string | null;
  status: string;
  created_at: string;
  host_profile?: { name: string; rating: number | null };
  passenger_count?: number;
  has_joined?: boolean;
}

interface CarpoolPageProps {
  userId: string;
}

type Tab = 'find' | 'offer' | 'my';

export default function CarpoolPage({ userId }: CarpoolPageProps) {
  const [tab, setTab] = useState<Tab>('find');
  const [carpools, setCarpools] = useState<Carpool[]>([]);
  const [myCarpools, setMyCarpools] = useState<Carpool[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);

  // Offer form state
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupLoc, setPickupLoc] = useState<GeocodedLocation | null>(null);
  const [dropLoc, setDropLoc] = useState<GeocodedLocation | null>(null);
  const [seats, setSeats] = useState(3);
  const [departureTime, setDepartureTime] = useState('');
  const [offering, setOffering] = useState(false);

  const pickupGeo = useGeocoding();
  const dropGeo = useGeocoding();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [totalAvailable, setTotalAvailable] = useState(0);

  const fetchCarpools = useCallback(async () => {
    setLoading(true);
    const { data: carpoolData } = await supabase
      .from('carpools')
      .select('*')
      .eq('status', 'active')
      .gt('available_seats', 0)
      .gte('departure_time', new Date().toISOString())
      .order('departure_time', { ascending: true });

    if (carpoolData) {
      setTotalAvailable(carpoolData.length);
      // Fetch host profiles and passenger data
      const enriched = await Promise.all(
        (carpoolData as any[]).map(async (c) => {
          const { data: hostData } = await supabase
            .from('profiles')
            .select('name, rating')
            .eq('id', c.host_id)
            .single();

          const { count } = await supabase
            .from('carpool_passengers')
            .select('*', { count: 'exact', head: true })
            .eq('carpool_id', c.id);

          const { data: myJoin } = await supabase
            .from('carpool_passengers')
            .select('id')
            .eq('carpool_id', c.id)
            .eq('passenger_id', userId)
            .maybeSingle();

          return {
            ...c,
            host_profile: hostData ? { name: hostData.name, rating: hostData.rating } : undefined,
            passenger_count: count || 0,
            has_joined: !!myJoin,
          } as Carpool;
        })
      );
      setCarpools(enriched.filter(c => c.host_id !== userId));
    } else {
      setTotalAvailable(0);
    }
    setLoading(false);
  }, [userId]);

  const fetchMyCarpools = useCallback(async () => {
    // Carpools I host
    const { data: hosted } = await supabase
      .from('carpools')
      .select('*')
      .eq('host_id', userId)
      .order('created_at', { ascending: false });

    // Carpools I joined
    const { data: joined } = await supabase
      .from('carpool_passengers')
      .select('carpool_id')
      .eq('passenger_id', userId);

    const joinedIds = (joined || []).map((j: any) => j.carpool_id);

    let joinedCarpools: any[] = [];
    if (joinedIds.length > 0) {
      const { data } = await supabase
        .from('carpools')
        .select('*')
        .in('id', joinedIds);
      joinedCarpools = data || [];
    }

    const all = [...(hosted || []), ...joinedCarpools];
    const unique = Array.from(new Map(all.map((c: any) => [c.id, c])).values());

    const enriched = await Promise.all(
      (unique as any[]).map(async (c) => {
        const { data: hostData } = await supabase
          .from('profiles')
          .select('name, rating')
          .eq('id', c.host_id)
          .single();
        const { count } = await supabase
          .from('carpool_passengers')
          .select('*', { count: 'exact', head: true })
          .eq('carpool_id', c.id);
        return {
          ...c,
          host_profile: hostData ? { name: hostData.name, rating: hostData.rating } : undefined,
          passenger_count: count || 0,
          has_joined: joinedIds.includes(c.id),
        } as Carpool;
      })
    );

    setMyCarpools(enriched);
  }, [userId]);

  useEffect(() => {
    fetchCarpools();
    fetchMyCarpools().then(() => {
      // Will update myCarpools state
    });
  }, [fetchCarpools, fetchMyCarpools]);

  // Auto-switch to My Rides if user has carpools but none in Find tab
  useEffect(() => {
    if (!loading && myCarpools.length > 0 && carpools.length === 0 && tab === 'find') {
      setTab('my');
    }
  }, [loading, myCarpools.length, carpools.length]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('carpools-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carpools' }, () => {
        fetchCarpools();
        fetchMyCarpools();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'carpool_passengers' }, () => {
        fetchCarpools();
        fetchMyCarpools();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchCarpools, fetchMyCarpools]);

  const handleJoin = async (carpoolId: string) => {
    setJoining(carpoolId);
    const { error } = await supabase.from('carpool_passengers').insert({
      carpool_id: carpoolId,
      passenger_id: userId,
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      // Decrement available seats
      const carpool = carpools.find(c => c.id === carpoolId);
      if (carpool) {
        await supabase.from('carpools').update({
          available_seats: carpool.available_seats - 1,
        } as any).eq('id', carpoolId);
      }
      toast({ title: 'Joined!', description: 'You\'ve joined this carpool ride' });
    }
    setJoining(null);
  };

  const handleLeave = async (carpoolId: string) => {
    await supabase.from('carpool_passengers')
      .delete()
      .eq('carpool_id', carpoolId)
      .eq('passenger_id', userId);

    const carpool = [...carpools, ...myCarpools].find(c => c.id === carpoolId);
    if (carpool) {
      await supabase.from('carpools').update({
        available_seats: carpool.available_seats + 1,
      } as any).eq('id', carpoolId);
    }
    toast({ title: 'Left carpool', description: 'You\'ve left this ride' });
  };

  const handleOffer = async () => {
    if (!pickupLoc || !dropLoc || !departureTime) {
      toast({ title: 'Fill all fields', variant: 'destructive' });
      return;
    }
    setOffering(true);

    const distKm = haversineDistance(pickupLoc.lat, pickupLoc.lng, dropLoc.lat, dropLoc.lng);
    const totalFare = calculateFare(distKm, 'car');
    const farePerPerson = Math.round(totalFare / (seats + 1)); // split among host + passengers

    const { data: profile } = await supabase
      .from('profiles')
      .select('vehicle_name, vehicle_number')
      .eq('id', userId)
      .single();

    const { error } = await supabase.from('carpools').insert({
      host_id: userId,
      pickup_name: pickupLoc.name,
      pickup_lat: pickupLoc.lat,
      pickup_lng: pickupLoc.lng,
      drop_name: dropLoc.name,
      drop_lat: dropLoc.lat,
      drop_lng: dropLoc.lng,
      departure_time: new Date(departureTime).toISOString(),
      total_seats: seats,
      available_seats: seats,
      fare_per_person: farePerPerson,
      distance_km: distKm,
      vehicle_name: profile?.vehicle_name || null,
      vehicle_number: profile?.vehicle_number || null,
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Carpool created!', description: 'Others can now join your ride' });
      setPickup(''); setDrop(''); setPickupLoc(null); setDropLoc(null);
      setSeats(3); setDepartureTime('');
      setTab('my');
    }
    setOffering(false);
  };

  const handleCancelCarpool = async (carpoolId: string) => {
    await supabase.from('carpools').update({ status: 'cancelled' } as any).eq('id', carpoolId);
    toast({ title: 'Carpool cancelled' });
  };

  const filteredCarpools = searchQuery
    ? carpools.filter(c =>
        c.pickup_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.drop_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : carpools;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' · ' +
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Carpool
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Share rides, split fares, save money</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { val: '50%', label: 'Savings' },
          { val: 'CO₂', label: 'Reduced' },
          { val: `${totalAvailable}`, label: 'Available' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl text-center py-3">
            <p className="text-lg font-bold text-primary">{s.val}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary rounded-xl p-1 mb-5">
        {([
          { key: 'find' as Tab, label: 'Find Ride', icon: Search },
          { key: 'offer' as Tab, label: 'Offer Ride', icon: Plus },
          { key: 'my' as Tab, label: 'My Rides', icon: Car },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* FIND TAB */}
        {tab === 'find' && (
          <motion.div key="find" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="relative">
              <Input
                placeholder="Search by route..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredCarpools.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No carpools available right now</p>
                <Button size="sm" variant="outline" onClick={() => setTab('offer')}>Offer a ride</Button>
              </div>
            ) : (
              filteredCarpools.map(c => (
                <motion.div
                  key={c.id}
                  layout
                  className="bg-card border border-border rounded-xl p-4 space-y-3"
                >
                  {/* Host info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {c.host_profile?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{c.host_profile?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        ⭐ {Number(c.host_profile?.rating || 5).toFixed(1)}
                        {c.vehicle_name && <span>· {c.vehicle_name}</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">₹{c.fare_per_person}</p>
                      <p className="text-[10px] text-muted-foreground">per person</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-start gap-3 pl-1">
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <div className="w-px h-6 bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-foreground truncate">{c.pickup_name}</p>
                      <p className="text-sm text-foreground truncate">{c.drop_name}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatTime(c.departure_time)}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.available_seats} seat{c.available_seats !== 1 ? 's' : ''} left</span>
                    <span>{Number(c.distance_km).toFixed(1)} km</span>
                  </div>

                  {/* Action */}
                  {c.has_joined ? (
                    <div className="flex gap-2">
                      <div className="flex-1 flex items-center gap-1.5 justify-center text-primary text-sm font-medium">
                        <CheckCircle2 className="w-4 h-4" /> Joined
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleLeave(c.id)} className="text-destructive">
                        Leave
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={joining === c.id}
                      onClick={() => handleJoin(c.id)}
                    >
                      {joining === c.id ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <ArrowRight className="w-4 h-4 mr-1" />
                      )}
                      Join Ride
                    </Button>
                  )}
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* OFFER TAB */}
        {tab === 'offer' && (
          <motion.div key="offer" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-foreground">Offer a Ride</h3>

              {/* Pickup */}
              <div className="relative">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                  <Input
                    placeholder="Pickup location"
                    value={pickup}
                    onChange={e => { setPickup(e.target.value); setPickupLoc(null); pickupGeo.search(e.target.value); }}
                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                </div>
                {pickupGeo.results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {pickupGeo.results.map((s, i) => (
                      <button key={i} onClick={() => { setPickup(s.name); setPickupLoc(s); pickupGeo.clear(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-left">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.area}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Drop */}
              <div className="relative">
                <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                  <div className="w-3 h-3 rounded-full bg-destructive shrink-0" />
                  <Input
                    placeholder="Drop location"
                    value={drop}
                    onChange={e => { setDrop(e.target.value); setDropLoc(null); dropGeo.search(e.target.value); }}
                    className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                  />
                </div>
                {dropGeo.results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-xl mt-1 shadow-lg max-h-40 overflow-y-auto">
                    {dropGeo.results.map((s, i) => (
                      <button key={i} onClick={() => { setDrop(s.name); setDropLoc(s); dropGeo.clear(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-left">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-sm text-foreground">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.area}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Seats & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Available seats</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map(n => (
                      <button
                        key={n}
                        onClick={() => setSeats(n)}
                        className={`w-10 h-10 rounded-lg border text-sm font-semibold transition-all ${
                          seats === n ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-foreground border-border'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Departure time</label>
                  <Input
                    type="datetime-local"
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                    className="text-sm"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>

              {/* Fare preview */}
              {pickupLoc && dropLoc && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-secondary rounded-xl p-3 flex justify-between text-sm">
                  <div>
                    <p className="text-muted-foreground">Distance</p>
                    <p className="font-semibold text-foreground">{haversineDistance(pickupLoc.lat, pickupLoc.lng, dropLoc.lat, dropLoc.lng).toFixed(1)} km</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Fare per person</p>
                    <p className="font-semibold text-foreground">
                      ₹{Math.round(calculateFare(haversineDistance(pickupLoc.lat, pickupLoc.lng, dropLoc.lat, dropLoc.lng), 'car') / (seats + 1))}
                    </p>
                  </div>
                </motion.div>
              )}

              <Button className="w-full" onClick={handleOffer} disabled={offering || !pickupLoc || !dropLoc || !departureTime}>
                {offering ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Offer Ride
              </Button>
            </div>
          </motion.div>
        )}

        {/* MY RIDES TAB */}
        {tab === 'my' && (
          <motion.div key="my" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {myCarpools.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Car className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">No carpool rides yet</p>
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={() => setTab('find')}>Find a ride</Button>
                  <Button size="sm" onClick={() => setTab('offer')}>Offer a ride</Button>
                </div>
              </div>
            ) : (
              myCarpools.map(c => (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {c.host_id === userId ? (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Host</span>
                      ) : (
                        <span className="text-[10px] bg-accent/10 text-accent-foreground px-2 py-0.5 rounded-full font-medium">Passenger</span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        c.status === 'active' ? 'bg-green-500/10 text-green-600' :
                        c.status === 'cancelled' ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTime(c.departure_time)}</p>
                  </div>

                  <div className="flex items-start gap-3 pl-1">
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <div className="w-px h-5 bg-border" />
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <p className="text-sm text-foreground truncate">{c.pickup_name}</p>
                      <p className="text-sm text-foreground truncate">{c.drop_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{c.passenger_count}/{c.total_seats} passengers</span>
                    <span>₹{c.fare_per_person}/person</span>
                    <span>{Number(c.distance_km).toFixed(1)} km</span>
                  </div>

                  {c.status === 'active' && (
                    <div className="flex gap-2">
                      {c.host_id === userId ? (
                        <Button size="sm" variant="outline" className="text-destructive w-full" onClick={() => handleCancelCarpool(c.id)}>
                          Cancel Carpool
                        </Button>
                      ) : c.has_joined ? (
                        <Button size="sm" variant="outline" className="text-destructive w-full" onClick={() => handleLeave(c.id)}>
                          Leave Ride
                        </Button>
                      ) : null}
                    </div>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
