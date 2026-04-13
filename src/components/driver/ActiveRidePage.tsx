import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigation, CheckCircle2, ShieldCheck, Clock, MapPin, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { type Profile, type Ride } from '@/lib/rideUtils';
import RideChat from '@/components/shared/RideChat';
import SOSButton from '@/components/shared/SOSButton';
import { toast } from '@/hooks/use-toast';

interface ActiveRidePageProps {
  ride: Ride | null;
  driverProfile: Profile;
  onRideComplete: () => void;
}

export default function ActiveRidePage({ ride, driverProfile, onRideComplete }: ActiveRidePageProps) {
  const [riderProfile, setRiderProfile] = useState<Profile | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [tripStartTime, setTripStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!ride) return;
    const fetchRider = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', ride.rider_id).single();
      if (data) setRiderProfile(data as unknown as Profile);
    };
    fetchRider();
  }, [ride?.rider_id]);

  // Trip timer
  useEffect(() => {
    if (ride?.status === 'in_progress' && !tripStartTime) {
      setTripStartTime(new Date());
    }
    if (ride?.status !== 'in_progress') {
      setTripStartTime(null);
      setElapsed(0);
    }
  }, [ride?.status]);

  useEffect(() => {
    if (!tripStartTime) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - tripStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [tripStartTime]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const verifyOtpAndStart = async () => {
    if (!ride) return;
    if (otpInput.trim() !== ride.otp) {
      setOtpError('Invalid OTP. Please ask the rider for the correct code.');
      toast({ title: 'Wrong OTP', description: 'The OTP does not match.', variant: 'destructive' });
      return;
    }
    setOtpError('');
    setUpdating(true);
    await supabase.from('rides').update({ status: 'in_progress' } as any).eq('id', ride.id);
    setUpdating(false);
    setOtpInput('');
    toast({ title: 'Ride Verified & Started! 🚗', description: 'OTP verified successfully. Ride is now in progress.' });
  };

  const completeRide = async () => {
    if (!ride) return;
    setUpdating(true);
    await supabase.from('rides').update({ status: 'completed', completed_at: new Date().toISOString() } as any).eq('id', ride.id);
    setUpdating(false);
    toast({ title: 'Ride Completed! ✅', description: `You earned ₹${ride.fare}` });
    onRideComplete();
  };

  if (!ride) {
    return (
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-foreground mb-6">Active Ride</h1>
        <div className="text-center py-16 text-muted-foreground">
          <Navigation className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No active ride</p>
          <p className="text-sm mt-1">Accept a ride request to start</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Active Ride</h1>

      <div className="bg-card border rounded-xl p-6 space-y-5">
        {/* Status Banner */}
        {ride.status === 'accepted' && (
          <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-4 py-3">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <span className="font-semibold text-foreground">Waiting for OTP Verification</span>
          </div>
        )}

        {ride.status === 'in_progress' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Ride Verified ✅ • In Progress 🚗</p>
                <p className="text-xs text-muted-foreground">OTP verified successfully</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-card rounded-lg px-3 py-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono font-bold text-foreground">{formatTime(elapsed)}</span>
            </div>
          </motion.div>
        )}

        {ride.status === 'completed' && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-4 py-3">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Ride Completed ✅</span>
          </div>
        )}

        {/* Rider info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold text-foreground text-lg">
            {riderProfile?.name.charAt(0) || '?'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{riderProfile?.name || 'Rider'}</p>
            <p className="text-sm text-muted-foreground">{Number(ride.distance_km).toFixed(1)} km • ₹{ride.fare}</p>
          </div>
        </div>

        {/* Route */}
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <span className="text-foreground">{ride.pickup_name}</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive mt-1.5 shrink-0" />
            <span className="text-foreground">{ride.drop_name}</span>
          </div>
        </div>

        {/* OTP verification - only when accepted */}
        {ride.status === 'accepted' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="bg-primary/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">Verify Rider OTP</p>
              </div>
              <p className="text-xs text-muted-foreground text-center">Ask the rider for their 4-digit OTP to start the ride</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter 4-digit OTP"
                  value={otpInput}
                  onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 4)); setOtpError(''); }}
                  className="text-center text-xl font-bold tracking-[0.3em]"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              {otpError && <p className="text-xs text-destructive text-center">{otpError}</p>}
              <Button className="w-full" onClick={verifyOtpAndStart} disabled={otpInput.length !== 4 || updating}>
                {updating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify & Start Ride'
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Complete ride - only when in_progress */}
        {ride.status === 'in_progress' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <Button className="w-full" size="lg" variant="default" onClick={completeRide} disabled={updating}>
              {updating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Completing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> End Ride
                </span>
              )}
            </Button>
          </motion.div>
        )}

        {/* Chat & SOS - shown during active ride */}
        {['accepted', 'in_progress'].includes(ride.status) && riderProfile && (
          <div className="flex gap-2">
            <RideChat rideId={ride.id} userId={driverProfile.id} otherName={riderProfile.name} inline />
            <SOSButton rideId={ride.id} userId={driverProfile.id} />
          </div>
        )}

        {/* Completed summary */}
        {ride.status === 'completed' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center pt-2">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-lg font-bold text-foreground">₹{ride.fare} earned</p>
            <p className="text-sm text-muted-foreground">Ride completed successfully</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
