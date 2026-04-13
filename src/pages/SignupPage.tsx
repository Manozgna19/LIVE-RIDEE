import { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, User, ArrowLeft, Mail, Lock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SignupPageProps {
  onBack: () => void;
}

export default function SignupPage({ onBack }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'rider' | 'driver'>('rider');
  const [vehicleType, setVehicleType] = useState<'bike' | 'auto' | 'car'>('car');
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (role === 'driver' && (!vehicleName.trim() || !vehicleNumber.trim())) return;
    setLoading(true);
    try {
      await signUp(email.trim(), password.trim(), {
        name: name.trim(),
        phone: phone.trim(),
        role,
        ...(role === 'driver' && {
          vehicle_type: vehicleType,
          vehicle_name: vehicleName.trim(),
          vehicle_number: vehicleNumber.trim(),
        }),
      });
      toast({ title: 'Account created!', description: 'Welcome to LiveRide' });
    } catch (err: any) {
      toast({ title: 'Signup failed', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
        </div>
        <div className="ride-card">
          <div className="flex gap-2 mb-6 p-1 bg-secondary rounded-lg">
            <button type="button" onClick={() => setRole('rider')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${role === 'rider' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <User className="w-4 h-4" /> Rider
            </button>
            <button type="button" onClick={() => setRole('driver')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${role === 'driver' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              <Bike className="w-4 h-4" /> Driver
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Full Name</label>
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Min 6 characters" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="+91 98765 43210" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
              </div>
            </div>
            {role === 'driver' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-2 border-t">
                <label className="text-sm font-medium text-foreground block">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { type: 'bike' as const, label: 'Bike', icon: '🏍️' },
                    { type: 'auto' as const, label: 'Auto', icon: '🛺' },
                    { type: 'car' as const, label: 'Car', icon: '🚗' },
                  ]).map(v => (
                    <button key={v.type} type="button" onClick={() => setVehicleType(v.type)}
                      className={`p-3 rounded-xl border text-center transition-all ${vehicleType === v.type ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:border-primary/30'}`}>
                      <span className="text-2xl">{v.icon}</span>
                      <p className="text-xs font-medium mt-1">{v.label}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Vehicle Name</label>
                  <Input placeholder="e.g. Maruti Swift" value={vehicleName} onChange={(e) => setVehicleName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Vehicle Number</label>
                  <Input placeholder="e.g. TS 09 AB 1234" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
                </div>
              </motion.div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !name.trim() || !email.trim() || !password.trim() || (role === 'driver' && (!vehicleName.trim() || !vehicleNumber.trim()))}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : `Sign Up as ${role === 'driver' ? 'Driver' : 'Rider'}`}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
