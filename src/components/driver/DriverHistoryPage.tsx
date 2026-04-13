import { useState, useEffect } from 'react';
import { Clock, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { type Ride } from '@/lib/rideUtils';

interface DriverHistoryPageProps {
  driverId: string;
}

export default function DriverHistoryPage({ driverId }: DriverHistoryPageProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);
      if (data) setRides(data as unknown as Ride[]);
      setLoading(false);
    };
    fetchHistory();
  }, [driverId]);

  if (loading) {
    return <div className="p-6 flex justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ride History</h1>

      {rides.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No completed rides yet</p>
          <p className="text-sm mt-1">Your completed rides will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => (
            <div key={ride.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-foreground capitalize">{ride.vehicle_type} ride</p>
                <p className="font-bold text-foreground">₹{ride.fare}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {ride.pickup_name} → {ride.drop_name}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{Number(ride.distance_km).toFixed(1)} km</span>
                {ride.completed_at && <span>{new Date(ride.completed_at).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
