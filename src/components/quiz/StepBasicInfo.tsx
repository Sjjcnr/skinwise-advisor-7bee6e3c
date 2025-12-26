import { SkinAssessment, AGE_RANGES } from '@/types/skincare';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface StepBasicInfoProps {
  assessment: SkinAssessment;
  onUpdate: (field: keyof SkinAssessment, value: string) => void;
}

export function StepBasicInfo({ assessment, onUpdate }: StepBasicInfoProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">Let's Get Started</h2>
        <p className="text-muted-foreground">Tell us a bit about yourself</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <Label className="text-base">What's your age range?</Label>
          <RadioGroup
            value={assessment.ageRange}
            onValueChange={(value) => onUpdate('ageRange', value)}
            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {AGE_RANGES.map((range) => (
              <div key={range.value}>
                <RadioGroupItem
                  value={range.value}
                  id={range.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={range.value}
                  className={cn(
                    'flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                    'hover:border-primary/50 hover:bg-primary/5',
                    assessment.ageRange === range.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  )}
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label className="text-base">Gender (optional)</Label>
          <RadioGroup
            value={assessment.gender}
            onValueChange={(value) => onUpdate('gender', value)}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'other', label: 'Other' },
            ].map((option) => (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={`gender-${option.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`gender-${option.value}`}
                  className={cn(
                    'flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all',
                    'hover:border-primary/50 hover:bg-primary/5',
                    assessment.gender === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border'
                  )}
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
