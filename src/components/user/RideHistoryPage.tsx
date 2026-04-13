import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { type Ride } from '@/lib/rideUtils';

interface RideHistoryPageProps {
  userId: string;
}

export default function RideHistoryPage({ userId }: RideHistoryPageProps) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('rider_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(50);
      if (data) setRides(data as unknown as Ride[]);
      setLoading(false);
    };
    fetchHistory();
  }, [userId]);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="flex-1 p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <History className="w-6 h-6" /> Ride History
      </h2>

      {rides.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <History className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No rides yet. Book your first ride!</p>
        </div>
      ) : (
        <div className="grid gap-3 max-w-2xl">
          {rides.map((r) => (
            <div key={r.id} className="ride-card">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-sm text-foreground capitalize">{r.vehicle_type} ride</p>
                  <p className="text-xs text-muted-foreground">₹{r.fare}</p>
                </div>
                <span className="status-badge status-completed">Completed</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground">{r.pickup_name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                  <span className="text-foreground">{r.drop_name}</span>
                </div>
              </div>
              <div className="flex justify-between mt-3 pt-3 border-t text-xs text-muted-foreground">
                <span>{Number(r.distance_km).toFixed(1)} km</span>
                <span className="font-semibold text-foreground">₹{r.fare}</span>
              </div>
              {r.completed_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(r.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
