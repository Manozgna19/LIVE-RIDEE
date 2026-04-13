import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SOSButtonProps {
  rideId: string;
  userId: string;
}

export default function SOSButton({ rideId, userId }: SOSButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [sent, setSent] = useState(false);

  const triggerSOS = async () => {
    let lat: number | undefined;
    let lng: number | undefined;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {}
    }

    await supabase.from('sos_alerts').insert({
      ride_id: rideId,
      user_id: userId,
      latitude: lat || null,
      longitude: lng || null,
    } as any);

    setSent(true);
    setShowConfirm(false);
    toast({ title: '🚨 SOS Alert Sent', description: 'Emergency services have been notified with your location.' });
  };

  if (sent) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 rounded-xl text-sm">
        <ShieldAlert className="w-4 h-4 text-destructive" />
        <span className="text-destructive font-medium">SOS Alert Active</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowConfirm(!showConfirm)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors text-sm font-medium"
      >
        <ShieldAlert className="w-4 h-4" />
        SOS
      </button>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                  <ShieldAlert className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Emergency SOS</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  This will alert emergency services with your current location and ride details.
                </p>
              </div>

              <div className="space-y-2">
                <a
                  href="tel:112"
                  className="flex items-center gap-3 p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Call 112</p>
                    <p className="text-xs text-muted-foreground">National Emergency Number</p>
                  </div>
                </a>
                <a
                  href="tel:100"
                  className="flex items-center gap-3 p-3 bg-secondary rounded-xl hover:bg-secondary/80 transition-colors"
                >
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Call 100</p>
                    <p className="text-xs text-muted-foreground">Police</p>
                  </div>
                </a>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button variant="destructive" className="flex-1" onClick={triggerSOS}>
                  <ShieldAlert className="w-4 h-4 mr-1" /> Send SOS
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
