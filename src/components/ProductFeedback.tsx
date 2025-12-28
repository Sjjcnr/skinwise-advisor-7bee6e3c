import { useState, useEffect } from 'react';
import { Star, MessageSquare, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProductFeedbackProps {
  recommendationId: string;
  productName: string;
  userId: string;
}

interface FeedbackData {
  rating: number;
  feedback: string;
  tried_product: boolean;
}

export function ProductFeedback({ recommendationId, productName, userId }: ProductFeedbackProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<FeedbackData | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [triedProduct, setTriedProduct] = useState(false);

  useEffect(() => {
    fetchExistingFeedback();
  }, [recommendationId, productName]);

  const fetchExistingFeedback = async () => {
    const { data } = await supabase
      .from('product_feedback')
      .select('rating, feedback, tried_product')
      .eq('recommendation_id', recommendationId)
      .eq('product_name', productName)
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setExistingFeedback(data);
      setRating(data.rating);
      setFeedback(data.feedback || '');
      setTriedProduct(data.tried_product || false);
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: 'Please select a rating', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      if (existingFeedback) {
        await supabase
          .from('product_feedback')
          .update({
            rating,
            feedback: feedback.trim() || null,
            tried_product: triedProduct,
          })
          .eq('recommendation_id', recommendationId)
          .eq('product_name', productName)
          .eq('user_id', userId);
      } else {
        await supabase.from('product_feedback').insert({
          user_id: userId,
          recommendation_id: recommendationId,
          product_name: productName,
          rating,
          feedback: feedback.trim() || null,
          tried_product: triedProduct,
        });
      }

      setExistingFeedback({ rating, feedback, tried_product: triedProduct });
      toast({ title: 'Feedback saved!' });
      setOpen(false);
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({ title: 'Failed to save feedback', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {existingFeedback ? (
            <>
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'w-3 h-3',
                      star <= existingFeedback.rating
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">Edit</span>
            </>
          ) : (
            <>
              <MessageSquare className="w-4 h-4" />
              Rate
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {productName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Your Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      'w-8 h-8 transition-colors',
                      star <= (hoverRating || rating)
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tried"
              checked={triedProduct}
              onCheckedChange={(checked) => setTriedProduct(checked === true)}
            />
            <Label htmlFor="tried" className="text-sm font-normal cursor-pointer">
              I've tried this product
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with this product..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {feedback.length}/500
            </p>
          </div>

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
            {isLoading ? 'Saving...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
