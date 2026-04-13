import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface RatingDialogProps {
  rideId: string;
  raterId: string;
  rateeId: string;
  rateeName: string;
  onComplete: () => void;
}

export default function RatingDialog({ rideId, raterId, rateeId, rateeName, onComplete }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

  const submit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('ratings').insert({
      ride_id: rideId,
      rater_id: raterId,
      ratee_id: rateeId,
      rating,
      feedback: feedback.trim() || null,
    } as any);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Thanks for your feedback!' });
    }
    setSubmitting(false);
    onComplete();
  };

  const displayRating = hoveredStar || rating;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-4 py-2"
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Star className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">Rate {rateeName}</h3>
        <p className="text-sm text-muted-foreground">How was your experience?</p>
      </div>

      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHoveredStar(s)}
            onMouseLeave={() => setHoveredStar(0)}
            onClick={() => setRating(s)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-10 h-10 transition-colors ${
                s <= displayRating
                  ? 'text-accent fill-accent'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
      {displayRating > 0 && (
        <p className="text-sm font-medium text-accent">{labels[displayRating]}</p>
      )}

      <Textarea
        placeholder="Leave a comment (optional)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        className="resize-none"
        rows={3}
      />

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onComplete}>
          Skip
        </Button>
        <Button className="flex-1" onClick={submit} disabled={submitting || rating === 0}>
          <Send className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </div>
    </motion.div>
  );
}
