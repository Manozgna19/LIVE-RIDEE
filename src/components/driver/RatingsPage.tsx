import { Star } from 'lucide-react';

interface RatingsPageProps {
  driverId: string;
}

export default function RatingsPage({ driverId }: RatingsPageProps) {
  // Ratings would come from a ratings table in a full implementation
  // For now, show the driver's profile rating
  const rating = 5.0;

  const breakdown = [
    { stars: 5, pct: 100 },
    { stars: 4, pct: 0 },
    { stars: 3, pct: 0 },
    { stars: 2, pct: 0 },
    { stars: 1, pct: 0 },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ratings</h1>

      <div className="bg-card border rounded-xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-bold text-foreground">{rating.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 mt-1 justify-center">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? 'text-accent fill-accent' : 'text-muted'}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your rating</p>
          </div>
          <div className="flex-1 space-y-2">
            {breakdown.map(b => (
              <div key={b.stars} className="flex items-center gap-2 text-sm">
                <span className="w-4 text-muted-foreground">{b.stars}</span>
                <Star className="w-3 h-3 text-accent fill-accent" />
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="w-8 text-xs text-muted-foreground text-right">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Feedback</h3>
        <p className="text-sm text-muted-foreground">Ratings from riders will appear here after you complete rides.</p>
      </div>
    </div>
  );
}
