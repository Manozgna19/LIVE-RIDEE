import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DriverSidebar, type DriverView } from '@/components/DriverSidebar';
import RideRequestsPage from '@/components/driver/RideRequestsPage';
import ActiveRidePage from '@/components/driver/ActiveRidePage';
import DriverHistoryPage from '@/components/driver/DriverHistoryPage';
import EarningsPage from '@/components/driver/EarningsPage';
import RatingsPage from '@/components/driver/RatingsPage';
import { supabase } from '@/integrations/supabase/client';
import { type Profile, type Ride } from '@/lib/rideUtils';
import { toast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';

interface DriverDashboardProps {
  profile: Profile;
  onLogout: () => void;
}

export default function DriverDashboard({ profile, onLogout }: DriverDashboardProps) {
  const [activeView, setActiveView] = useState<DriverView>('requests');
  const [activeRide, setActiveRide] = useState<Ride | null>(null);
  const [isOnline, setIsOnline] = useState(profile.is_available);
  const [driverLat, setDriverLat] = useState<number | null>(null);
  const [driverLng, setDriverLng] = useState<number | null>(null);

  // Get driver's location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setDriverLat(pos.coords.latitude);
          setDriverLng(pos.coords.longitude);
        },
        () => {
          // Fallback to Hyderabad center
          setDriverLat(17.4300);
          setDriverLng(78.4500);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setDriverLat(17.4300);
      setDriverLng(78.4500);
    }
  }, []);

  // Update location in DB when online
  useEffect(() => {
    if (!isOnline || driverLat === null || driverLng === null) return;

    const updateLocation = async () => {
      await supabase.from('driver_locations').upsert({
        driver_id: profile.id,
        latitude: driverLat,
        longitude: driverLng,
        updated_at: new Date().toISOString(),
      } as any, { onConflict: 'driver_id' });
    };
    updateLocation();

    const interval = setInterval(updateLocation, 15000); // Update every 15s
    return () => clearInterval(interval);
  }, [isOnline, driverLat, driverLng, profile.id]);

  // Check for active ride on mount
  useEffect(() => {
    const loadActive = async () => {
      const { data } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', profile.id)
        .in('status', ['accepted', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        setActiveRide(data[0] as unknown as Ride);
        setActiveView('active');
      }
    };
    loadActive();
  }, [profile.id]);

  const toggleOnline = async (online: boolean) => {
    setIsOnline(online);
    await supabase.from('profiles').update({ is_available: online } as any).eq('id', profile.id);

    if (!online) {
      // Remove location when going offline
      await supabase.from('driver_locations').delete().eq('driver_id', profile.id);
    }

    toast({ title: online ? 'You are now online' : 'You are now offline' });
  };

  const handleAcceptRide = async (ride: Ride) => {
    setActiveRide(ride);
    setActiveView('active');
  };

  const handleRideComplete = () => {
    setTimeout(() => {
      setActiveRide(null);
    }, 3000);
  };

  const renderView = () => {
    switch (activeView) {
      case 'requests':
        return <RideRequestsPage driverProfile={profile} isOnline={isOnline} driverLat={driverLat} driverLng={driverLng} onAcceptRide={handleAcceptRide} />;
      case 'active':
        return <ActiveRidePage ride={activeRide} driverProfile={profile} onRideComplete={handleRideComplete} />;
      case 'history':
        return <DriverHistoryPage driverId={profile.id} />;
      case 'earnings':
        return <EarningsPage driverId={profile.id} />;
      case 'ratings':
        return <RatingsPage driverId={profile.id} />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DriverSidebar
          activeView={activeView}
          onViewChange={setActiveView}
          userName={profile.name}
          onLogout={onLogout}
        />
        <main className="flex-1 overflow-auto">
          <div className="border-b bg-card px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="md:hidden" />
              <p className="text-sm text-muted-foreground">Welcome, {profile.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isOnline ? 'text-primary' : 'text-muted-foreground'}`}>
                {isOnline ? '🟢 Online' : '⚫ Offline'}
              </span>
              <Switch checked={isOnline} onCheckedChange={toggleOnline} />
            </div>
          </div>
          {renderView()}
        </main>
      </div>
    </SidebarProvider>
  );
}
