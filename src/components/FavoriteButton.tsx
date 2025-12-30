import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/skincare';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
  product: Product;
  userId: string;
}

export function FavoriteButton({ product, userId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkIfFavorite();
  }, [product.name, userId]);

  const checkIfFavorite = async () => {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_name', product.name)
      .maybeSingle();
    
    setIsFavorite(!!data);
  };

  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_name', product.name);

        if (error) throw error;
        setIsFavorite(false);
        toast({ title: 'Removed from favorites' });
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: userId,
            product_name: product.name,
            product_brand: product.brand,
            product_data: product as unknown as Record<string, unknown>,
          } as any);

        if (error) throw error;
        setIsFavorite(true);
        toast({ title: 'Added to favorites!' });
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast({ title: 'Error', description: 'Failed to update favorites', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={isLoading}
      className="h-8 w-8"
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
        )}
      />
    </Button>
  );
}
