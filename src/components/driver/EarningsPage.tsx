import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Car } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { type Ride } from '@/lib/rideUtils';

interface EarningsPageProps {
  driverId: string;
}

export default function EarningsPage({ driverId }: EarningsPageProps) {
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalRides, setTotalRides] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayRides, setTodayRides] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      const { data } = await supabase
        .from('rides')
        .select('fare, completed_at')
        .eq('driver_id', driverId)
        .eq('status', 'completed');

      if (data) {
        const rides = data as unknown as { fare: number; completed_at: string }[];
        const total = rides.reduce((sum, r) => sum + Number(r.fare), 0);
        setTotalEarnings(total);
        setTotalRides(rides.length);

        const today = new Date().toDateString();
        const todayRides = rides.filter(r => new Date(r.completed_at).toDateString() === today);
        setTodayEarnings(todayRides.reduce((sum, r) => sum + Number(r.fare), 0));
        setTodayRides(todayRides.length);
      }
    };
    fetchEarnings();
  }, [driverId]);

  const avgPerRide = totalRides > 0 ? Math.round(totalEarnings / totalRides) : 0;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Earnings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-card border rounded-xl p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">Today's Earnings</p>
          <p className="text-3xl font-bold text-primary">₹{todayEarnings}</p>
          <p className="text-xs text-muted-foreground mt-1">{todayRides} rides</p>
        </div>
        <div className="bg-card border rounded-xl p-5 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Earnings</p>
          <p className="text-3xl font-bold text-foreground">₹{totalEarnings}</p>
          <p className="text-xs text-muted-foreground mt-1">{totalRides} rides</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <IndianRupee className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg per ride</p>
            <p className="font-bold text-foreground">₹{avgPerRide}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total earned</p>
            <p className="font-bold text-foreground">₹{totalEarnings}</p>
          </div>
        </div>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
            <Car className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total rides</p>
            <p className="font-bold text-foreground">{totalRides}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
