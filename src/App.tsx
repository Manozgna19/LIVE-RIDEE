import { useAuth } from '@/hooks/useAuth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UserDashboard from './pages/UserDashboard';
import DriverDashboard from './pages/DriverDashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useState } from 'react';

const queryClient = new QueryClient();

type AppView = 'landing' | 'login' | 'signup' | 'dashboard';

const App = () => {
  const { user, profile, loading, signOut } = useAuth();
  const [view, setView] = useState<AppView>('landing');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // If authenticated with profile, show dashboard
  if (user && profile) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {profile.role === 'driver' ? (
            <DriverDashboard profile={profile} onLogout={signOut} />
          ) : (
            <UserDashboard profile={profile} onLogout={signOut} />
          )}
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {view === 'landing' && (
          <LandingPage onSignIn={() => setView('login')} onGetStarted={() => setView('signup')} />
        )}
        {view === 'login' && <LoginPage onBack={() => setView('landing')} />}
        {view === 'signup' && <SignupPage onBack={() => setView('landing')} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
