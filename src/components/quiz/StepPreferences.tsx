import { SkinAssessment, BUDGET_RANGES } from '@/types/skincare';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Wallet, CreditCard, Gem, Crown } from 'lucide-react';

interface StepPreferencesProps {
  assessment: SkinAssessment;
  onUpdate: (field: keyof SkinAssessment, value: string) => void;
}

const BUDGET_ICONS = {
  budget: Wallet,
  mid: CreditCard,
  premium: Gem,
  luxury: Crown,
};

export function StepPreferences({ assessment, onUpdate }: StepPreferencesProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">Almost There!</h2>
        <p className="text-muted-foreground">Let us know your budget preferences</p>
      </div>

      <RadioGroup
        value={assessment.budgetRange}
        onValueChange={(value) => onUpdate('budgetRange', value)}
        className="grid gap-4"
      >
        {BUDGET_RANGES.map((budget) => {
          const Icon = BUDGET_ICONS[budget.value as keyof typeof BUDGET_ICONS];
          
          return (
            <div key={budget.value}>
              <RadioGroupItem
                value={budget.value}
                id={`budget-${budget.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`budget-${budget.value}`}
                className={cn(
                  'flex items-center gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  assessment.budgetRange === budget.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                )}
              >
                <div className={cn(
                  'p-3 rounded-lg',
                  assessment.budgetRange === budget.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{budget.label}</div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
