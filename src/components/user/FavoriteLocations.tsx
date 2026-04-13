import { useState, useEffect } from 'react';
import { Home, Briefcase, MapPin, Plus, Trash2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useGeocoding, type GeocodedLocation } from '@/hooks/useGeocoding';
import { toast } from '@/hooks/use-toast';

interface FavoriteLocation {
  id: string;
  user_id: string;
  label: string;
  address_name: string;
  latitude: number;
  longitude: number;
}

interface FavoriteLocationsProps {
  userId: string;
  onSelect: (loc: { name: string; lat: number; lng: number }) => void;
}

const ICONS: Record<string, React.ElementType> = {
  Home: Home,
  Office: Briefcase,
  Other: MapPin,
};

const PRESETS = ['Home', 'Office', 'Other'];

export default function FavoriteLocations({ userId, onSelect }: FavoriteLocationsProps) {
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('Home');
  const [searchText, setSearchText] = useState('');
  const geo = useGeocoding();

  useEffect(() => {
    fetchFavorites();
  }, [userId]);

  const fetchFavorites = async () => {
    const { data } = await supabase
      .from('favorite_locations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at');
    if (data) setFavorites(data as unknown as FavoriteLocation[]);
  };

  const saveFavorite = async (loc: GeocodedLocation) => {
    const { error } = await supabase.from('favorite_locations').insert({
      user_id: userId,
      label: newLabel,
      address_name: loc.name,
      latitude: loc.lat,
      longitude: loc.lng,
    } as any);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${newLabel} saved!` });
      setAdding(false);
      setSearchText('');
      geo.clear();
      fetchFavorites();
    }
  };

  const deleteFavorite = async (id: string) => {
    await supabase.from('favorite_locations').delete().eq('id', id);
    fetchFavorites();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Saved Places</p>
        {!adding && (
          <button onClick={() => setAdding(true)} className="text-xs text-primary flex items-center gap-1 hover:underline">
            <Plus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {/* Quick-select buttons */}
      {favorites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {favorites.map((fav) => {
            const Icon = ICONS[fav.label] || MapPin;
            return (
              <button
                key={fav.id}
                onClick={() => onSelect({ name: fav.address_name, lat: fav.latitude, lng: fav.longitude })}
                className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all text-sm"
              >
                <Icon className="w-4 h-4 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground text-xs">{fav.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{fav.address_name}</p>
                </div>
                <Trash2
                  className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all ml-1"
                  onClick={(e) => { e.stopPropagation(); deleteFavorite(fav.id); }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="bg-secondary/50 rounded-xl p-3 space-y-2">
          <div className="flex gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setNewLabel(p)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  newLabel === p ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="relative">
            <Input
              placeholder="Search address..."
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); geo.search(e.target.value); }}
              className="text-sm"
            />
            {geo.results.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-card border rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                {geo.results.map((r, i) => (
                  <button
                    key={`${r.lat}-${r.lng}-${i}`}
                    onClick={() => saveFavorite(r)}
                    className="w-full text-left px-3 py-2 hover:bg-secondary text-sm flex items-center gap-2"
                  >
                    <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="text-foreground truncate">{r.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setAdding(false); geo.clear(); }}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
