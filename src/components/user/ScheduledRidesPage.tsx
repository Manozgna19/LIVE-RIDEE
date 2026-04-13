import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, MapPin, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
interface LocationOption { name: string; lat: number; lng: number; area: string; }
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScheduledRide {
  id: string;
  pickupName: string;
  dropName: string;
  date: string;
  time: string;
  createdAt: string;
}

const STORAGE_KEY = 'scheduled_rides';

function getScheduledRides(): ScheduledRide[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function saveScheduledRides(rides: ScheduledRide[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
}

export default function ScheduledRidesPage() {
  const [rides, setRides] = useState<ScheduledRide[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<LocationOption[]>([]);
  const [dropSuggestions, setDropSuggestions] = useState<LocationOption[]>([]);
  const [selectedPickup, setSelectedPickup] = useState<LocationOption | null>(null);
  const [selectedDrop, setSelectedDrop] = useState<LocationOption | null>(null);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('09:00');

  useEffect(() => { setRides(getScheduledRides()); }, []);

  const filter = (_q: string): LocationOption[] => [];

  const addRide = () => {
    if (!selectedPickup || !selectedDrop || !date) return;
    const newRide: ScheduledRide = {
      id: `sched_${Date.now()}`,
      pickupName: selectedPickup.name,
      dropName: selectedDrop.name,
      date: date.toISOString(),
      time,
      createdAt: new Date().toISOString(),
    };
    const updated = [newRide, ...rides];
    setRides(updated);
    saveScheduledRides(updated);
    resetForm();
  };

  const deleteRide = (id: string) => {
    const updated = rides.filter(r => r.id !== id);
    setRides(updated);
    saveScheduledRides(updated);
  };

  const resetForm = () => {
    setShowForm(false);
    setPickup('');
    setDrop('');
    setSelectedPickup(null);
    setSelectedDrop(null);
    setDate(undefined);
    setTime('09:00');
    setPickupSuggestions([]);
    setDropSuggestions([]);
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="w-6 h-6" /> Scheduled Rides
        </h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Schedule
        </Button>
      </div>

      {showForm && (
        <div className="ride-card mb-6 max-w-lg space-y-3">
          {/* Pickup */}
          <div className="relative">
            <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              <Input
                placeholder="Pickup location"
                value={pickup}
                onChange={(e) => {
                  setPickup(e.target.value);
                  setSelectedPickup(null);
                  setPickupSuggestions(e.target.value.length > 1 ? filter(e.target.value) : []);
                }}
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
              />
            </div>
            {pickupSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg overflow-hidden">
                {pickupSuggestions.map(s => (
                  <button key={s.name} onClick={() => { setPickup(s.name); setSelectedPickup(s); setPickupSuggestions([]); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-left text-sm">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Drop */}
          <div className="relative">
            <div className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive shrink-0" />
              <Input
                placeholder="Drop location"
                value={drop}
                onChange={(e) => {
                  setDrop(e.target.value);
                  setSelectedDrop(null);
                  setDropSuggestions(e.target.value.length > 1 ? filter(e.target.value) : []);
                }}
                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
              />
            </div>
            {dropSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg overflow-hidden">
                {dropSuggestions.map(s => (
                  <button key={s.name} onClick={() => { setDrop(s.name); setSelectedDrop(s); setDropSuggestions([]); }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-secondary text-left text-sm">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-foreground">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {date ? format(date, 'PPP') : 'Pick date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-32"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={addRide} disabled={!selectedPickup || !selectedDrop || !date} className="flex-1">
              Confirm Schedule
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {rides.length === 0 && !showForm ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No scheduled rides yet</p>
          <Button onClick={() => setShowForm(true)} variant="outline" className="gap-1">
            <Plus className="w-4 h-4" /> Schedule your first ride
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 max-w-2xl">
          {rides.map((r) => (
            <div key={r.id} className="ride-card flex items-center gap-4">
              <div className="flex-1 space-y-1.5">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground">{r.pickupName}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-destructive mt-1.5 shrink-0" />
                  <span className="text-foreground">{r.dropName}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(r.date), 'EEE, dd MMM yyyy')} at {r.time}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteRide(r.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
