import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import FaceCapture from '@/components/FaceCapture';

export default function FaceCapturePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleValidCapture = (base64Image: string) => {
    // TODO: send base64Image to your backend for skin analysis
    toast({
      title: 'Photo captured',
      description: 'Checks passed — sending photo for analysis.',
    });
    console.log('Captured image length:', base64Image.length);
  };

  return (
    <div className="min-h-screen gradient-skinwise-subtle py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <FaceCapture
          onValidCapture={handleValidCapture}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
