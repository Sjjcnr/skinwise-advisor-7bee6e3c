import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, SkipForward, CheckCircle2 } from 'lucide-react';
import FaceCapture from '@/components/FaceCapture';

interface StepFacePhotoProps {
  onCapture: (base64: string) => void;
  captured: boolean;
}

export function StepFacePhoto({ onCapture, captured }: StepFacePhotoProps) {
  const [showCamera, setShowCamera] = useState(false);

  if (showCamera) {
    return (
      <div className="animate-fade-in">
        <FaceCapture
          onValidCapture={(img) => {
            onCapture(img);
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-display font-semibold">Face Photo (Optional)</h2>
        <p className="text-muted-foreground">
          Take a photo for more accurate, AI-powered skin analysis. You can skip this step.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4 py-6">
        {captured ? (
          <div className="flex items-center gap-2 text-primary">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Photo captured successfully</span>
          </div>
        ) : null}

        <Button onClick={() => setShowCamera(true)} className="gap-2" size="lg">
          <Camera className="w-5 h-5" />
          {captured ? 'Retake Photo' : 'Take Face Photo'}
        </Button>
      </div>
    </div>
  );
}
