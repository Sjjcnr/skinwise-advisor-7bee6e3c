import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessment } from '@/hooks/useAssessment';
import { ProgressIndicator } from '@/components/quiz/ProgressIndicator';
import { StepBasicInfo } from '@/components/quiz/StepBasicInfo';
import { StepSkinType } from '@/components/quiz/StepSkinType';
import { StepConcerns } from '@/components/quiz/StepConcerns';
import { StepLifestyle } from '@/components/quiz/StepLifestyle';
import { StepPreferences } from '@/components/quiz/StepPreferences';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

export default function Quiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    assessment,
    currentStep,
    totalSteps,
    updateAssessment,
    toggleArrayField,
    nextStep,
    prevStep,
    canProceed,
    isStepValid,
  } = useAssessment();

  const handleSubmit = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save assessment to database
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('skin_assessments')
        .insert({
          user_id: user.id,
          age_range: assessment.ageRange,
          gender: assessment.gender || null,
          skin_type: assessment.skinType,
          skin_concerns: assessment.skinConcerns,
          climate: assessment.climate,
          allergies: assessment.allergies,
          skin_goals: assessment.skinGoals || null,
          budget_range: assessment.budgetRange,
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Navigate to results with assessment ID
      navigate(`/results/${assessmentData.id}`);
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your assessment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasicInfo assessment={assessment} onUpdate={updateAssessment} />;
      case 2:
        return <StepSkinType assessment={assessment} onUpdate={updateAssessment} />;
      case 3:
        return <StepConcerns assessment={assessment} onToggle={toggleArrayField} />;
      case 4:
        return <StepLifestyle assessment={assessment} onUpdate={updateAssessment} onToggle={toggleArrayField} />;
      case 5:
        return <StepPreferences assessment={assessment} onUpdate={updateAssessment} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-skinwise-subtle py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} isStepValid={isStepValid} />
        
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-6 sm:p-8">
            {renderStep()}
            
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              
              {currentStep < totalSteps ? (
                <Button onClick={nextStep} disabled={!canProceed} className="gap-2">
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={!canProceed || isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Get Recommendations
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
