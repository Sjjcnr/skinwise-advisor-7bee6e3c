import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  Droplets,
  Sun,
  DollarSign,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { Product } from '@/types/skincare';

interface AssessmentWithRecommendation {
  id: string;
  created_at: string;
  skin_type: string;
  skin_concerns: string[];
  age_range: string;
  climate: string | null;
  budget_range: string | null;
  recommendation?: {
    id: string;
    ai_summary: string | null;
    products: Product[];
  };
}

export default function History() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [assessments, setAssessments] = useState<AssessmentWithRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('skin_assessments')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      // Fetch recommendations for each assessment
      const assessmentsWithRecs: AssessmentWithRecommendation[] = [];
      
      for (const assessment of assessmentsData || []) {
        const { data: recData } = await supabase
          .from('recommendations')
          .select('id, ai_summary, products')
          .eq('assessment_id', assessment.id)
          .maybeSingle();

        assessmentsWithRecs.push({
          ...assessment,
          recommendation: recData ? {
            ...recData,
            products: recData.products as unknown as Product[]
          } : undefined
        });
      }

      setAssessments(assessmentsWithRecs);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAssessment = async (assessmentId: string) => {
    setDeletingId(assessmentId);
    try {
      // Delete related recommendations first (cascade not set up)
      await supabase
        .from('recommendations')
        .delete()
        .eq('assessment_id', assessmentId);

      const { error } = await supabase
        .from('skin_assessments')
        .delete()
        .eq('id', assessmentId);

      if (error) throw error;

      setAssessments((prev) => prev.filter((a) => a.id !== assessmentId));
      if (expandedId === assessmentId) setExpandedId(null);

      toast({ title: 'Assessment deleted', description: 'The assessment and its recommendations have been removed.' });
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: 'Could not delete the assessment. Please try again.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const getSkinTypeIcon = (skinType: string) => {
    switch (skinType) {
      case 'oily': return <Droplets className="h-4 w-4" />;
      case 'dry': return <Sun className="h-4 w-4" />;
      default: return <Sparkles className="h-4 w-4" />;
    }
  };

  const formatBudget = (budget: string | null) => {
    if (!budget) return null;
    const budgetMap: Record<string, string> = {
      'budget': '$',
      'mid-range': '$$',
      'premium': '$$$',
      'luxury': '$$$$'
    };
    return budgetMap[budget] || budget;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Assessment History</h1>
              <p className="text-sm text-muted-foreground">
                {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/quiz')}>
            New Assessment
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {assessments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No assessments yet</h3>
              <p className="text-muted-foreground mb-6">
                Take your first skin assessment to get personalized recommendations.
              </p>
              <Button onClick={() => navigate('/quiz')}>
                Start Assessment
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assessments.map((assessment) => (
              <Card 
                key={assessment.id}
                className="overflow-hidden transition-all duration-200 hover:shadow-md"
              >
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => setExpandedId(expandedId === assessment.id ? null : assessment.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(assessment.created_at), 'MMMM d, yyyy • h:mm a')}
                      </div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getSkinTypeIcon(assessment.skin_type)}
                        <span className="capitalize">{assessment.skin_type} Skin</span>
                        <span className="text-muted-foreground font-normal">•</span>
                        <span className="text-muted-foreground font-normal text-base">
                          {assessment.age_range}
                        </span>
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        {assessment.skin_concerns.slice(0, 3).map((concern) => (
                          <Badge key={concern} variant="secondary" className="text-xs">
                            {concern}
                          </Badge>
                        ))}
                        {assessment.skin_concerns.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{assessment.skin_concerns.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {assessment.budget_range && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {formatBudget(assessment.budget_range)}
                        </Badge>
                      )}
                      <ChevronRight 
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          expandedId === assessment.id ? 'rotate-90' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </CardHeader>

                {expandedId === assessment.id && (
                  <CardContent className="border-t border-border pt-4 space-y-4">
                    {assessment.recommendation ? (
                      <>
                        {assessment.recommendation.ai_summary && (
                          <div className="bg-muted/50 rounded-lg p-4">
                            <h4 className="font-medium text-sm text-foreground mb-2">AI Summary</h4>
                            <p className="text-sm text-muted-foreground">
                              {assessment.recommendation.ai_summary}
                            </p>
                          </div>
                        )}

                        <div>
                          <h4 className="font-medium text-sm text-foreground mb-3">
                            Recommended Products ({assessment.recommendation.products.length})
                          </h4>
                          <div className="grid gap-3">
                            {assessment.recommendation.products.map((product, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center justify-between p-3 bg-card border border-border rounded-lg"
                              >
                                <div>
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                                </div>
                                <Badge variant="outline">{product.priceRange}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => navigate(`/results/${assessment.id}`)}
                        >
                          View Full Results
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          No recommendations generated for this assessment.
                        </p>
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/results/${assessment.id}`)}
                        >
                          Generate Recommendations
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
