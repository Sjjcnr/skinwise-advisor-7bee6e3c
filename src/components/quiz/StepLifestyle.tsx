import { SkinAssessment, CLIMATES, COMMON_ALLERGIES } from '@/types/skincare';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface StepLifestyleProps {
  assessment: SkinAssessment;
  onUpdate: (field: keyof SkinAssessment, value: string) => void;
  onToggle: (field: 'skinConcerns' | 'allergies', value: string) => void;
}

export function StepLifestyle({ assessment, onUpdate, onToggle }: StepLifestyleProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">Your Environment</h2>
        <p className="text-muted-foreground">Help us understand your lifestyle factors</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base">What's your climate like?</Label>
          <RadioGroup
            value={assessment.climate}
            onValueChange={(value) => onUpdate('climate', value)}
            className="grid gap-2"
          >
            {CLIMATES.map((climate) => (
              <div key={climate.value}>
                <RadioGroupItem
                  value={climate.value}
                  id={`climate-${climate.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`climate-${climate.value}`}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all',
                    'hover:border-primary/50 hover:bg-primary/5',
                    assessment.climate === climate.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  )}
                >
                  {climate.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-base">Any ingredient sensitivities? (optional)</Label>
          <div className="grid grid-cols-2 gap-2">
            {COMMON_ALLERGIES.map((allergy) => {
              const isSelected = assessment.allergies.includes(allergy.value);
              
              return (
                <div
                  key={allergy.value}
                  onClick={() => onToggle('allergies', allergy.value)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                    'hover:border-primary/50 hover:bg-primary/5',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle('allergies', allergy.value)}
                    className="pointer-events-none"
                  />
                  <span className="text-sm">{allergy.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base">What are your skincare goals? (optional)</Label>
          <Textarea
            placeholder="E.g., I want to reduce acne scars and have a glowing complexion..."
            value={assessment.skinGoals}
            onChange={(e) => onUpdate('skinGoals', e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>
      </div>
    </div>
  );
}
