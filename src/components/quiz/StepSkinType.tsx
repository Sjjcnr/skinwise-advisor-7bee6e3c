import { SkinAssessment, SKIN_TYPES } from '@/types/skincare';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { Droplets, Sun, Leaf, Heart, Sparkles } from 'lucide-react';

interface StepSkinTypeProps {
  assessment: SkinAssessment;
  onUpdate: (field: keyof SkinAssessment, value: string) => void;
}

const SKIN_TYPE_ICONS = {
  oily: Droplets,
  dry: Sun,
  combination: Leaf,
  sensitive: Heart,
  normal: Sparkles,
};

export function StepSkinType({ assessment, onUpdate }: StepSkinTypeProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">Know Your Skin Type</h2>
        <p className="text-muted-foreground">Select the option that best describes your skin</p>
      </div>

      <RadioGroup
        value={assessment.skinType}
        onValueChange={(value) => onUpdate('skinType', value)}
        className="grid gap-4"
      >
        {SKIN_TYPES.map((type) => {
          const Icon = SKIN_TYPE_ICONS[type.value as keyof typeof SKIN_TYPE_ICONS];
          
          return (
            <div key={type.value}>
              <RadioGroupItem
                value={type.value}
                id={`skin-${type.value}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`skin-${type.value}`}
                className={cn(
                  'flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all',
                  'hover:border-primary/50 hover:bg-primary/5',
                  assessment.skinType === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                )}
              >
                <div className={cn(
                  'p-2 rounded-lg',
                  assessment.skinType === type.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{type.label}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
