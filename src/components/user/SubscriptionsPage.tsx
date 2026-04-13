import { useState, useMemo } from 'react';
import { CreditCard, Check, CheckCircle2, MapPin, Navigation, Clock, Bell, Zap, Shield, ArrowRight, ArrowLeft, PauseCircle, SkipForward, CalendarClock, Route, Timer, TrendingDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGeocoding, type GeocodedLocation } from '@/hooks/useGeocoding';
import { haversineDistance, calculateETA } from '@/lib/rideUtils';

const ZONES = [
  { name: 'Central', areas: ['ameerpet', 'begumpet', 'punjagutta', 'somajiguda', 'banjara hills', 'jubilee hills', 'nampally', 'abids', 'koti'], baseRate: 1.0 },
  { name: 'Hitech', areas: ['hitech city', 'madhapur', 'gachibowli', 'kondapur', 'financial district', 'raidurg', 'nanakramguda'], baseRate: 1.2 },
  { name: 'North', areas: ['kukatpally', 'kphb', 'jntu', 'miyapur', 'bachupally', 'nizampet', 'secunderabad', 'tarnaka', 'paradise'], baseRate: 1.0 },
  { name: 'South', areas: ['dilsukhnagar', 'malakpet', 'lb nagar', 'nagole', 'uppal', 'charminar'], baseRate: 0.9 },
  { name: 'Extended', areas: [], baseRate: 1.3 },
];

function getZone(area: string) {
  const normalized = area.toLowerCase();
  return ZONES.find(z => z.areas.some(a => normalized.includes(a))) || ZONES[ZONES.length - 1];
}

const MORNING_SLOTS = ['7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM'];
const EVENING_SLOTS = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'];
const FLEX_WINDOWS = ['Exact time', '± 10 mins', '± 15 mins', '± 30 mins'];

function calculatePlans(distKm: number, homeArea: string, officeArea: string) {
  const homeZone = getZone(homeArea);
  const officeZone = getZone(officeArea);
  const crossZone = homeZone.name !== officeZone.name;
  const avgRate = (homeZone.baseRate + officeZone.baseRate) / 2;
  const baseCost = distKm * 30 * avgRate * (crossZone ? 1.15 : 1.0);
  const perRideCost = distKm * 14; // avg car fare per ride
  const monthlyWithoutSub = perRideCost * 44;

  return {
    homeZone: homeZone.name,
    officeZone: officeZone.name,
    crossZone,
    plans: [
      {
        id: 'basic',
        name: 'Basic',
        icon: '🚌',
        subtitle: 'Fixed schedule, maximum savings',
        price: Math.round(baseCost * 0.55),
        savings: Math.round(monthlyWithoutSub - baseCost * 0.55),
        savingsPercent: Math.round(((monthlyWithoutSub - baseCost * 0.55) / monthlyWithoutSub) * 100),
        features: ['Fixed morning & evening rides', `${distKm.toFixed(1)} km route`, 'Bike & auto included', 'Real-time tracking', 'Monthly billing'],
        missing: ['No skip/reschedule', 'No priority pickup'],
        color: 'bg-primary/10 text-primary border-primary/20',
        popular: false,
      },
      {
        id: 'flexible',
        name: 'Flexible',
        icon: '⚡',
        subtitle: 'Skip, reschedule anytime',
        price: Math.round(baseCost * 0.85),
        savings: Math.round(monthlyWithoutSub - baseCost * 0.85),
        savingsPercent: Math.round(((monthlyWithoutSub - baseCost * 0.85) / monthlyWithoutSub) * 100),
        features: ['All vehicle types', `${distKm.toFixed(1)} km route`, 'Skip up to 5 rides/month', 'Reschedule anytime', 'Pause subscription', 'Carpool access', 'Free cancellations'],
        missing: [],
        color: 'bg-accent/10 text-accent border-accent/30',
        popular: true,
      },
      {
        id: 'premium',
        name: 'Premium',
        icon: '👑',
        subtitle: 'Priority rides, VIP experience',
        price: Math.round(baseCost * 1.5),
        savings: Math.round(monthlyWithoutSub - baseCost * 1.5),
        savingsPercent: Math.round(((monthlyWithoutSub - baseCost * 1.5) / monthlyWithoutSub) * 100),
        features: ['Premium cars only', `${distKm.toFixed(1)} km route`, 'Unlimited skip & reschedule', 'Priority pickup (< 3 min)', 'Dedicated driver option', 'Airport transfers included', '24/7 concierge support', 'Pause anytime'],
        missing: [],
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        popular: false,
      },
    ],
  };
}

export default function SubscriptionsPage() {
  const [step, setStep] = useState(1);
  const [subscribed, setSubscribed] = useState<string | null>(null);

  // Step 1: Route
  const [home, setHome] = useState('');
  const [office, setOffice] = useState('');
  const [homeLocation, setHomeLocation] = useState<GeocodedLocation | null>(null);
  const [officeLocation, setOfficeLocation] = useState<GeocodedLocation | null>(null);
  const homeGeo = useGeocoding();
  const officeGeo = useGeocoding();

  // Step 2: Time
  const [morningTime, setMorningTime] = useState('');
  const [eveningTime, setEveningTime] = useState('');
  const [flexWindow, setFlexWindow] = useState('± 10 mins');

  const routeInfo = useMemo(() => {
    if (!homeLocation || !officeLocation) return null;
    const distKm = Math.round(haversineDistance(homeLocation.lat, homeLocation.lng, officeLocation.lat, officeLocation.lng) * 10) / 10;
    const eta = calculateETA(distKm);
    return { distKm, eta };
  }, [homeLocation, officeLocation]);

  const pricing = useMemo(() => {
    if (!homeLocation || !officeLocation || !routeInfo) return null;
    return calculatePlans(routeInfo.distKm, homeLocation.area, officeLocation.area);
  }, [homeLocation, officeLocation, routeInfo]);

  const canProceedStep1 = !!homeLocation && !!officeLocation;
  const canProceedStep2 = !!morningTime && !!eveningTime;

  const steps = [
    { num: 1, label: 'Route', icon: Route },
    { num: 2, label: 'Schedule', icon: Clock },
    { num: 3, label: 'Plans', icon: CreditCard },
    { num: 4, label: 'Confirm', icon: CheckCircle2 },
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" /> Smart Commute Planner
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Set up your daily commute in 4 easy steps</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8 max-w-2xl">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <button
              onClick={() => {
                if (s.num <= step) setStep(s.num);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full
                ${step === s.num ? 'bg-primary text-primary-foreground shadow-md' : step > s.num ? 'bg-primary/10 text-primary cursor-pointer' : 'bg-secondary text-muted-foreground'}`}
            >
              <s.icon className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1: Route */}
      {step === 1 && (
        <div className="max-w-2xl space-y-4 animate-in fade-in duration-300">
          <div className="bg-card border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">📍 Enter your daily route</h3>

            {/* Home input */}
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <Input placeholder="Home (e.g., Ameerpet)" value={home}
                  onChange={(e) => { setHome(e.target.value); setHomeLocation(null); homeGeo.search(e.target.value); }}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground" />
              </div>
              {homeGeo.results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-xl mt-1 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {homeGeo.results.map((s, i) => (
                    <button key={`${s.lat}-${i}`} onClick={() => { setHome(s.name); setHomeLocation(s); homeGeo.clear(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-left transition-colors">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Office input */}
            <div className="relative">
              <div className="flex items-center gap-3 p-3 bg-secondary rounded-xl">
                <Navigation className="w-5 h-5 text-accent shrink-0" />
                <Input placeholder="Office / College (e.g., Hitech City)" value={office}
                  onChange={(e) => { setOffice(e.target.value); setOfficeLocation(null); officeGeo.search(e.target.value); }}
                  className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-foreground" />
              </div>
              {officeGeo.results.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-xl mt-1 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                  {officeGeo.results.map((s, i) => (
                    <button key={`${s.lat}-${i}`} onClick={() => { setOffice(s.name); setOfficeLocation(s); officeGeo.clear(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary text-left transition-colors">
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.area}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Real-time route feedback */}
          {routeInfo && pricing && (
            <div className="bg-card border rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
              <h4 className="font-semibold text-foreground flex items-center gap-2"><Route className="w-4 h-4 text-primary" /> Route Summary</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{routeInfo.distKm} km</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{routeInfo.eta} min</p>
                  <p className="text-xs text-muted-foreground">Est. commute</p>
                </div>
                <div className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{pricing.homeZone} → {pricing.officeZone}</p>
                  <p className="text-xs text-muted-foreground">Zones</p>
                </div>
              </div>
              {pricing.crossZone && (
                <p className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full inline-block">⚡ Cross-zone route — pricing adjusted</p>
              )}
            </div>
          )}

          <Button onClick={() => setStep(2)} disabled={!canProceedStep1} className="w-full h-12 text-base gap-2">
            Continue to Schedule <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Step 2: Time Selection */}
      {step === 2 && (
        <div className="max-w-2xl space-y-4 animate-in fade-in duration-300">
          <div className="bg-card border rounded-2xl p-6 space-y-5">
            <h3 className="font-semibold text-foreground text-lg">🕐 Choose your commute schedule</h3>

            {/* Morning */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">🌅</span> Morning Pickup
              </p>
              <div className="flex flex-wrap gap-2">
                {MORNING_SLOTS.map(t => (
                  <button key={t} onClick={() => setMorningTime(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                      ${morningTime === t ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-secondary text-foreground border-transparent hover:border-primary/30'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Evening */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <span className="text-lg">🌆</span> Evening Return
              </p>
              <div className="flex flex-wrap gap-2">
                {EVENING_SLOTS.map(t => (
                  <button key={t} onClick={() => setEveningTime(t)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                      ${eveningTime === t ? 'bg-accent text-accent-foreground border-accent shadow-md' : 'bg-secondary text-foreground border-transparent hover:border-accent/30'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Flex window */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" /> Flexibility Window
              </p>
              <div className="flex flex-wrap gap-2">
                {FLEX_WINDOWS.map(w => (
                  <button key={w} onClick={() => setFlexWindow(w)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border
                      ${flexWindow === w ? 'bg-foreground text-background border-foreground' : 'bg-secondary text-foreground border-transparent hover:border-foreground/20'}`}>
                    {w}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">A wider window increases your chances of getting matched with nearby drivers.</p>
            </div>
          </div>

          {/* Controls Preview */}
          <div className="bg-card border rounded-2xl p-5">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-accent" /> What you can do anytime</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: SkipForward, label: 'Skip a ride', desc: 'Not going today? Skip with one tap' },
                { icon: PauseCircle, label: 'Pause plan', desc: 'Going on leave? Pause & resume' },
                { icon: CalendarClock, label: 'Change time', desc: 'Late start? Shift your pickup' },
              ].map(c => (
                <div key={c.label} className="bg-secondary rounded-xl p-3 text-center space-y-1">
                  <c.icon className="w-5 h-5 mx-auto text-primary" />
                  <p className="text-sm font-medium text-foreground">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canProceedStep2} className="flex-1 h-12 text-base gap-2">
              View Plans <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Plans */}
      {step === 3 && pricing && routeInfo && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Summary bar */}
          <div className="bg-card border rounded-2xl p-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm max-w-4xl">
            <span className="text-muted-foreground">🗺️ {routeInfo.distKm} km · {routeInfo.eta} min</span>
            <span className="text-muted-foreground">🌅 {morningTime}</span>
            <span className="text-muted-foreground">🌆 {eveningTime}</span>
            <span className="text-muted-foreground">⏱️ {flexWindow}</span>
            <button onClick={() => setStep(1)} className="text-primary text-xs underline ml-auto">Edit route</button>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl">
            {pricing.plans.map((plan) => (
              <div key={plan.id}
                className={`bg-card border-2 rounded-2xl p-6 relative flex flex-col transition-all hover:shadow-lg
                  ${plan.popular ? 'border-accent ring-2 ring-accent/20 shadow-md' : 'border-border'}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                    BEST VALUE
                  </span>
                )}

                <div className="text-3xl mb-2">{plan.icon}</div>
                <h3 className="font-bold text-xl text-foreground">{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.subtitle}</p>

                <div className="mb-1">
                  <span className="text-4xl font-extrabold text-foreground">₹{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/month</span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">≈ ₹{Math.round(plan.price / 44)}/ride</p>

                {plan.savings > 0 && (
                  <div className="flex items-center gap-1.5 mb-4 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-semibold w-fit">
                    <TrendingDown className="w-3.5 h-3.5" />
                    Save ₹{plan.savings}/mo ({plan.savingsPercent}%)
                  </div>
                )}

                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground/50 line-through">
                      <span className="w-4 h-4 shrink-0 mt-0.5 text-center">✗</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {subscribed === plan.id ? (
                  <Button variant="outline" className="w-full gap-2 border-primary text-primary" disabled>
                    <CheckCircle2 className="w-4 h-4" /> Subscribed
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? 'default' : 'outline'}
                    className={`w-full h-11 ${plan.popular ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
                    onClick={() => { setSubscribed(plan.id); setStep(4); }}>
                    Subscribe Now
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Schedule
          </Button>
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && subscribed && pricing && routeInfo && (
        <div className="max-w-lg mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-card border-2 border-primary/30 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">You're all set! 🎉</h3>
            <p className="text-muted-foreground">
              Your <span className="font-semibold text-foreground capitalize">{subscribed}</span> plan is active.
            </p>
            <div className="bg-secondary rounded-xl p-4 text-left space-y-2 text-sm">
              <p><span className="text-muted-foreground">Route:</span> <span className="font-medium text-foreground">{home} → {office}</span></p>
              <p><span className="text-muted-foreground">Distance:</span> <span className="font-medium text-foreground">{routeInfo.distKm} km</span></p>
              <p><span className="text-muted-foreground">Pickup:</span> <span className="font-medium text-foreground">{morningTime}</span></p>
              <p><span className="text-muted-foreground">Return:</span> <span className="font-medium text-foreground">{eveningTime}</span></p>
              <p><span className="text-muted-foreground">Flexibility:</span> <span className="font-medium text-foreground">{flexWindow}</span></p>
            </div>
          </div>

          {/* Notifications preview */}
          <div className="bg-card border rounded-2xl p-5 space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-accent" /> Smart Notifications</h4>
            <p className="text-sm text-muted-foreground">You'll receive alerts for:</p>
            <div className="space-y-2">
              {[
                '🚗 Driver assigned & on the way',
                '📍 Driver arrived at pickup',
                '⏰ 10-minute departure reminder',
                '🔄 Delay or route change alerts',
                '📊 Weekly commute summary',
              ].map(n => (
                <div key={n} className="flex items-center gap-2 text-sm text-foreground bg-secondary rounded-lg px-3 py-2">
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>

          <Button variant="outline" onClick={() => { setSubscribed(null); setStep(3); }} className="w-full">
            Change Plan
          </Button>
        </div>
      )}

      {/* Empty state for step 3 without route */}
      {step === 3 && !pricing && (
        <div className="text-center py-16 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Complete steps 1 & 2 first</p>
          <Button variant="outline" onClick={() => setStep(1)} className="mt-4">Go to Route</Button>
        </div>
      )}
    </div>
  );
}
