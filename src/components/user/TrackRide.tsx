import { motion } from 'framer-motion';
import { Navigation, Clock, IndianRupee } from 'lucide-react';
import RideMap from '@/components/RideMap';
import RideChat from '@/components/shared/RideChat';
import SOSButton from '@/components/shared/SOSButton';
import { type Profile, type Ride } from '@/lib/rideUtils';

interface TrackRideProps {
  ride: Ride | null;
  driverProfile: Profile | null;
  driverPosition: { lat: number; lng: number } | null;
  userId: string;
}

export default function TrackRide({ ride, driverProfile, driverPosition, userId }: TrackRideProps) {
  const isActive = ride && ['accepted', 'in_progress'].includes(ride.status);

  if (!isActive || !ride) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
          <Navigation className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">No Active Ride</h2>
        <p className="text-muted-foreground max-w-sm">Book a ride first to see live tracking here.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative" style={{ minHeight: '50vh' }}>
        <RideMap
          pickup={{ lat: ride.pickup_lat, lng: ride.pickup_lng }}
          drop={{ lat: ride.drop_lat, lng: ride.drop_lng }}
          driverPosition={driverPosition}
          status={ride.status as any}
        />
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card border-t p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="pulse-dot bg-primary" />
          <p className="font-semibold text-foreground text-sm capitalize">{ride.status.replace(/_/g, ' ')}</p>
        </div>

        {driverProfile && (
          <div className="flex items-center gap-3 ride-card">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {driverProfile.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm text-foreground">{driverProfile.name}</p>
              <p className="text-xs text-muted-foreground">{driverProfile.vehicle_name} • {driverProfile.vehicle_number}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="ride-card bg-secondary/50 py-3">
            <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-bold text-foreground">{ride.eta} min</p>
            <p className="text-xs text-muted-foreground">ETA</p>
          </div>
          <div className="ride-card bg-secondary/50 py-3">
            <Navigation className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-bold text-foreground">{Number(ride.distance_km).toFixed(1)} km</p>
            <p className="text-xs text-muted-foreground">Distance</p>
          </div>
          <div className="ride-card bg-secondary/50 py-3">
            <IndianRupee className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
            <p className="font-bold text-foreground">₹{ride.fare}</p>
            <p className="text-xs text-muted-foreground">Fare</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
            <span className="text-foreground">{ride.pickup_name}</span>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
            <span className="text-foreground">{ride.drop_name}</span>
          </div>
        </div>

        {/* Inline Chat & SOS */}
        {driverProfile && (
          <div className="flex gap-2 pt-1">
            <RideChat rideId={ride.id} userId={userId} otherName={driverProfile.name} inline />
            <SOSButton rideId={ride.id} userId={userId} />
          </div>
        )}
      </motion.div>
    </div>
  );
}
