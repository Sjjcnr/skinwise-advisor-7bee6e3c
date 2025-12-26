import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  isStepValid: (step: number) => boolean;
}

const STEP_LABELS = ['Basic Info', 'Skin Type', 'Concerns', 'Lifestyle', 'Preferences'];

export function ProgressIndicator({ currentStep, totalSteps, isStepValid }: ProgressIndicatorProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isComplete = step < currentStep && isStepValid(step);
          const isCurrent = step === currentStep;
          
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
                    isComplete && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? <Check className="w-5 h-5" /> : step}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    (isComplete || isCurrent) ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {STEP_LABELS[step - 1]}
                </span>
              </div>
              
              {step < totalSteps && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2 rounded-full transition-all duration-300',
                    step < currentStep ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
