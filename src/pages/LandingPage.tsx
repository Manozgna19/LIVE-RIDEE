import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Car, MapPin, Navigation, ArrowRight, Star, ChevronRight,
  CalendarCheck, Users, CreditCard, Shield, Clock, Check, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';

interface LandingPageProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

const features = [
  { icon: MapPin, title: 'Real-Time Tracking', desc: 'Track your ride live on the map. Know exactly when your vehicle arrives.', color: 'bg-primary/10 text-primary' },
  { icon: CalendarCheck, title: 'Ride Scheduling', desc: 'Schedule rides in advance for your daily commute. Never miss a pickup.', color: 'bg-accent/10 text-accent' },
  { icon: Users, title: 'Smart Carpooling', desc: 'Share rides with commuters on similar routes. Save up to 60% on fares.', color: 'bg-primary/10 text-primary' },
  { icon: CreditCard, title: 'Subscription Plans', desc: 'Monthly plans for regular commuters with flat-rate pricing and priority booking.', color: 'bg-accent/10 text-accent' },
  { icon: Shield, title: 'Secure Verification', desc: 'OTP-based ride verification and driver background checks for safety.', color: 'bg-primary/10 text-primary' },
  { icon: Clock, title: 'Fare Estimation', desc: 'Get instant fare estimates before booking. No surprise charges, ever.', color: 'bg-accent/10 text-accent' },
];

const steps = [
  { num: '01', icon: MapPin, title: 'Set Your Route', desc: 'Enter pickup and drop-off locations. Choose one-time ride or subscribe to a daily route.' },
  { num: '02', icon: Car, title: 'Get Matched', desc: 'Our system finds the nearest driver or carpool match on your route instantly.' },
  { num: '03', icon: Navigation, title: 'Track Live', desc: 'Watch your vehicle approach in real-time. Share your trip with family for safety.' },
  { num: '04', icon: Star, title: 'Ride & Rate', desc: 'Verify with OTP, enjoy your ride, and rate the experience when you arrive.' },
];

const plans = [
  {
    name: 'Pay-Per-Ride',
    subtitle: 'Perfect for occasional commuters',
    price: '₹49',
    per: 'per ride',
    features: ['Instant booking', 'Real-time tracking', 'Fare estimation', 'Ride history'],
    popular: false,
    dark: false,
  },
  {
    name: 'Daily Commuter',
    subtitle: 'Best for daily office & college travel',
    price: '₹1,499',
    per: 'per month',
    features: ['Unlimited scheduled rides', 'Fixed-route pricing', 'Priority pickup', 'Carpool access', '24/7 support'],
    popular: true,
    dark: true,
  },
  {
    name: 'Family Plan',
    subtitle: "Cover the whole family's commute",
    price: '₹2,999',
    per: 'per month',
    features: ['Up to 4 members', 'All Commuter features', 'Shared ride tracking', 'School pickup alerts', 'Dedicated driver option'],
    popular: false,
    dark: true,
  },
];

export default function LandingPage({ onSignIn, onGetStarted }: LandingPageProps) {
  const [mobileMenu, setMobileMenu] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-sidebar/95 backdrop-blur-md border-b border-sidebar-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">LiveRide</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'How It Works', 'Pricing', 'Safety'].map(item => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase().replace(/\s+/g, '-'))} className="text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
                {item}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={onSignIn}>Sign In</Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6" onClick={onGetStarted}>Get Started</Button>
          </div>
          <button className="md:hidden text-sidebar-foreground" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-sidebar border-t border-sidebar-border p-4 space-y-3">
            {['Features', 'How It Works', 'Pricing', 'Safety'].map(item => (
              <button key={item} onClick={() => scrollTo(item.toLowerCase().replace(/\s+/g, '-'))} className="block w-full text-left text-sm text-sidebar-foreground/70 py-2">
                {item}
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={onSignIn}>Sign In</Button>
              <Button className="flex-1 bg-accent text-accent-foreground" onClick={onGetStarted}>Get Started</Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center pt-16" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-sidebar/90 via-sidebar/70 to-transparent" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Tracking Available
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Your Daily<br />Commute,<br /><span className="text-primary">Simplified</span>
            </h1>
            <p className="text-lg text-white/70 max-w-md mb-10">
              Book rides, track vehicles in real-time, and save with subscription plans & carpooling. Built for daily commuters.
            </p>

            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-5 max-w-lg shadow-xl">
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-3">
                <MapPin className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Pickup location</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl mb-4">
                <Navigation className="w-5 h-5 text-muted-foreground" />
                <span className="text-muted-foreground text-sm">Drop-off location</span>
              </div>
              <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-base font-semibold rounded-xl" onClick={onGetStarted}>
                Book a Ride <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-10 mt-12">
            {[{ val: '50K+', label: 'Daily Rides' }, { val: '4.9★', label: 'User Rating' }, { val: '120+', label: 'Cities' }].map(s => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.val}</p>
                <p className="text-sm text-white/60">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">Everything You Need for<br />Daily Travel</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Purpose-built for commuters who need reliable, affordable rides every single day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">From Booking to Destination</h2>
            <p className="text-muted-foreground">A seamless experience in four simple steps.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center">
                <div className="relative inline-block mb-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sidebar to-primary/80 flex items-center justify-center">
                    <s.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">{s.num}</span>
                </div>
                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">Plans That Fit Your Commute</h2>
            <p className="text-muted-foreground">Save more with subscription plans designed for regular travelers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-6 flex flex-col ${plan.dark ? 'bg-gradient-to-br from-sidebar to-primary/90 text-white' : 'bg-card border'} ${plan.popular ? 'ring-2 ring-accent' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full">Most Popular</span>
                )}
                <h3 className={`text-lg font-bold ${plan.dark ? 'text-white' : 'text-foreground'}`}>{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.dark ? 'text-white/60' : 'text-muted-foreground'}`}>{plan.subtitle}</p>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ml-1 ${plan.dark ? 'text-white/60' : 'text-muted-foreground'}`}>{plan.per}</span>
                </div>
                <ul className="space-y-3 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className={`w-4 h-4 shrink-0 ${plan.dark ? 'text-primary' : 'text-primary'}`} />
                      <span className={plan.dark ? 'text-white/90' : 'text-foreground'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className={`w-full rounded-xl h-11 font-semibold ${plan.popular ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : plan.dark ? 'bg-sidebar-accent hover:bg-sidebar-accent/80 text-white' : 'bg-foreground text-background hover:bg-foreground/90'}`}
                  onClick={onGetStarted}>
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety */}
      <section id="safety" className="py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-3">Safety First</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-6">Your Safety, Our Priority</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">Every ride is OTP-verified, every driver is background-checked, and every trip is tracked in real-time.</p>
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Shield, title: 'OTP Verified Rides', desc: 'Every ride starts with a unique OTP shared between rider and driver.' },
              { icon: Star, title: 'Rated Drivers', desc: 'Only top-rated drivers with verified profiles and vehicles.' },
              { icon: MapPin, title: 'Live GPS Tracking', desc: 'Share your live trip with family and friends for peace of mind.' },
            ].map(s => (
              <div key={s.title} className="bg-card border rounded-2xl p-6">
                <s.icon className="w-8 h-8 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar py-12 border-t border-sidebar-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Car className="w-4 h-4 text-accent-foreground" />
              </div>
              <span className="font-bold text-sidebar-foreground">LiveRide</span>
            </div>
            <p className="text-sm text-sidebar-foreground/50">© 2026 LiveRide. All rights reserved. Demo version.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
