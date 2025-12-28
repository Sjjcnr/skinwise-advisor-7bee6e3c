import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/skincare';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Leaf, ExternalLink, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ShareButton } from '@/components/ShareButton';
import { ProductFeedback } from '@/components/ProductFeedback';

export default function Results() {
  const { assessmentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchRecommendations();
  }, [assessmentId, user]);

  const fetchRecommendations = async () => {
    if (!assessmentId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Check if recommendations already exist
      const { data: existing } = await supabase
        .from('recommendations')
        .select('*')
        .eq('assessment_id', assessmentId)
        .maybeSingle();

      if (existing) {
        setRecommendationId(existing.id);
        setProducts(existing.products as unknown as Product[]);
        setAiSummary(existing.ai_summary || '');
        setIsLoading(false);
        return;
      }

      // Fetch assessment data
      const { data: assessment, error: assessmentError } = await supabase
        .from('skin_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Call edge function for AI recommendations
      const { data, error: fnError } = await supabase.functions.invoke('get-recommendations', {
        body: { assessment },
      });

      if (fnError) throw fnError;

      setProducts(data.products || []);
      setAiSummary(data.summary || '');

      // Save recommendations
      const { data: savedRec } = await supabase.from('recommendations').insert({
        assessment_id: assessmentId,
        user_id: user!.id,
        products: data.products,
        ai_summary: data.summary,
      }).select('id').single();

      if (savedRec) {
        setRecommendationId(savedRec.id);
      }

    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to generate recommendations. Please try again.');
      toast({ title: 'Error', description: 'Failed to load recommendations', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gradient-skinwise-subtle">
        <div className="text-center space-y-4">
          <div className="relative">
            <Leaf className="w-16 h-16 text-primary animate-pulse-gentle" />
          </div>
          <h2 className="text-xl font-display font-semibold">Analyzing Your Skin Profile</h2>
          <p className="text-muted-foreground">Finding the perfect products for you...</p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-skinwise-subtle p-4">
        <Card className="max-w-md w-full shadow-soft">
          <CardContent className="p-6 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-muted-foreground">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/quiz')}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Retake Quiz
              </Button>
              <Button onClick={fetchRecommendations}>
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-skinwise-subtle py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold">Your Personalized Routine</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{aiSummary}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {products.map((product, index) => (
            <Card key={index} className="shadow-soft border-border/50 overflow-hidden animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-primary font-medium">{product.brand}</p>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                  </div>
                  <Badge variant="secondary">{product.priceRange}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{product.whySuitable}</p>
                
                {product.keyIngredients?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.keyIngredients.map((ing, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{ing}</Badge>
                    ))}
                  </div>
                )}
                
                {product.productUrl && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                      View Product <ExternalLink className="w-3 h-3 ml-2" />
                    </a>
                  </Button>
                )}
                
                {recommendationId && user && (
                  <div className="pt-2 border-t border-border/50">
                    <ProductFeedback
                      recommendationId={recommendationId}
                      productName={product.name}
                      userId={user.id}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/50 border-dashed">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            These are AI-generated suggestions. Please consult a dermatologist for personalized medical advice.
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4 flex-wrap">
          <Button variant="outline" asChild>
            <Link to="/quiz"><ArrowLeft className="w-4 h-4 mr-2" /> Take New Quiz</Link>
          </Button>
          <ShareButton 
            title="My Skincare Routine" 
            text="Check out my personalized skincare routine from SkinWise!" 
          />
          <Button asChild>
            <Link to="/history">View History</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
