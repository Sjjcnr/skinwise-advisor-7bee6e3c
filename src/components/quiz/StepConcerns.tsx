import { SkinAssessment, SKIN_CONCERNS } from '@/types/skincare';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface StepConcernsProps {
  assessment: SkinAssessment;
  onToggle: (field: 'skinConcerns' | 'allergies', value: string) => void;
}

export function StepConcerns({ assessment, onToggle }: StepConcernsProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">What Are Your Concerns?</h2>
        <p className="text-muted-foreground">Select all that apply to you</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {SKIN_CONCERNS.map((concern) => {
          const isSelected = assessment.skinConcerns.includes(concern.value);
          
          return (
            <div
              key={concern.value}
              onClick={() => onToggle('skinConcerns', concern.value)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
                'hover:border-primary/50 hover:bg-primary/5',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border'
              )}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggle('skinConcerns', concern.value)}
                className="pointer-events-none"
              />
              <Label className="cursor-pointer text-sm font-medium">
                {concern.label}
              </Label>
            </div>
          );
        })}
      </div>

      {assessment.skinConcerns.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {assessment.skinConcerns.length} concern{assessment.skinConcerns.length !== 1 && 's'} selected
        </p>
      )}
    </div>
  );
}
