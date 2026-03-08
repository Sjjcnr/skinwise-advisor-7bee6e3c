import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, X, RotateCcw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useFaceDetection, type FaceCheckResult } from '@/hooks/useFaceDetection';

interface FaceCaptureProps {
  onValidCapture: (base64Image: string) => void;
  onCancel?: () => void;
}

export default function FaceCapture({ onValidCapture, onCancel }: FaceCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<FaceCheckResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { runChecks } = useFaceDetection();

  // Compute oval bounds relative to video dimensions
  const getOvalBounds = useCallback((w: number, h: number) => ({
    cx: w / 2,
    cy: h / 2,
    rx: w * 0.32,
    ry: h * 0.42,
  }), []);

  const startCamera = useCallback(async () => {
    setError(null);
    setResult(null);
    setCapturedImage(null);

    // Mount video immediately so stream can be attached as soon as it's ready
    setCameraActive(true);

    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
        });
      } catch {
        // Fallback for devices/browsers that can't satisfy preferred constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;
      setCameraStream(stream);
    } catch {
      setCameraActive(false);
      setCameraStream(null);
      setError('Could not access camera. Please allow camera permissions.');
    }
  }, []);

  // Attach stream to video element when both are ready
  useEffect(() => {
    const video = videoRef.current;
    if (!cameraActive || !cameraStream || !video) return;

    video.srcObject = cameraStream;

    const startPlayback = async () => {
      try {
        await video.play();
      } catch {
        // Ignore autoplay interruptions; user can retry capture
      }
    };

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      void startPlayback();
    } else {
      video.onloadedmetadata = () => {
        void startPlayback();
      };
    }

    return () => {
      video.onloadedmetadata = null;
    };
  }, [cameraActive, cameraStream]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraStream(null);
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setChecking(true);
    setResult(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    const oval = getOvalBounds(canvas.width, canvas.height);
    const checkResult = await runChecks(canvas, oval);
    setResult(checkResult);

    if (checkResult.passed) {
      const base64 = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(base64);
      stopCamera();
    }
    setChecking(false);
  }, [runChecks, getOvalBounds, stopCamera]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setChecking(true);
      setResult(null);
      setError(null);

      const img = new Image();
      img.onload = async () => {
        const canvas = canvasRef.current!;
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        const oval = getOvalBounds(canvas.width, canvas.height);
        const checkResult = await runChecks(canvas, oval);
        setResult(checkResult);

        if (checkResult.passed) {
          setCapturedImage(canvas.toDataURL('image/jpeg', 0.92));
          stopCamera();
        }
        setChecking(false);
      };
      img.onerror = () => {
        setError('Could not load image file.');
        setChecking(false);
      };
      img.src = URL.createObjectURL(file);
    },
    [runChecks, getOvalBounds, stopCamera]
  );

  const handleSubmit = useCallback(() => {
    if (capturedImage && consentGiven) {
      onValidCapture(capturedImage);
    }
  }, [capturedImage, consentGiven, onValidCapture]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setResult(null);
    startCamera();
  }, [startCamera]);

  return (
    <Card className="max-w-lg mx-auto shadow-soft border-border/50 overflow-hidden">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-5 pb-3 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            Take a face photo for skin analysis
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Center your face inside the oval. No filters, jewelry, or heavy makeup.
          </p>
        </div>

        {/* Camera / captured view */}
        <div className="relative bg-muted aspect-[3/4] w-full overflow-hidden">
          {cameraActive && !capturedImage && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover mirror"
                style={{ transform: 'scaleX(-1)' }}
                aria-label="Live camera feed"
              />
              {/* Oval overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 133"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <mask id="oval-mask">
                    <rect width="100" height="133" fill="white" />
                    <ellipse cx="50" cy="66.5" rx="32" ry="42" fill="black" />
                  </mask>
                </defs>
                <rect
                  width="100"
                  height="133"
                  fill="hsl(var(--foreground) / 0.45)"
                  mask="url(#oval-mask)"
                />
                <ellipse
                  cx="50"
                  cy="66.5"
                  rx="32"
                  ry="42"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="0.6"
                  strokeDasharray="3 2"
                />
              </svg>

              {/* Live tip badges */}
              <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5">
                <Badge variant="secondary" className="text-[11px] bg-background/80 backdrop-blur-sm">
                  Good lighting — face lit evenly
                </Badge>
                <Badge variant="secondary" className="text-[11px] bg-background/80 backdrop-blur-sm">
                  Hold steady — avoid motion
                </Badge>
              </div>
            </>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured face photo"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}

          {!cameraActive && !capturedImage && (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
              <Camera className="w-12 h-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Start camera or upload a photo
              </p>
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>

        {/* Result feedback */}
        {result && (
          <div
            className={`flex items-start gap-2 px-5 py-3 text-sm ${
              result.passed
                ? 'bg-primary/10 text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}
            role="alert"
          >
            {result.passed ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span>{result.tip}</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 px-5 py-3 text-sm bg-destructive/10 text-destructive" role="alert">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Consent + actions */}
        <div className="p-5 space-y-4">
          {capturedImage && result?.passed && (
            <div className="flex items-start gap-2">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(v) => setConsentGiven(v === true)}
                aria-label="Privacy consent"
              />
              <Label htmlFor="consent" className="text-xs text-muted-foreground leading-snug cursor-pointer">
                I agree to upload this photo for skin analysis. Photo will be removed after analysis.
              </Label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {!cameraActive && !capturedImage && (
              <>
                <Button onClick={startCamera} className="flex-1 gap-2">
                  <Camera className="w-4 h-4" />
                  Capture
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload a photo
                </Button>
              </>
            )}

            {cameraActive && !capturedImage && (
              <>
                <Button onClick={capture} disabled={checking} className="flex-1 gap-2">
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Capture
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={stopCamera} className="gap-2">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </>
            )}

            {capturedImage && result?.passed && (
              <>
                <Button
                  onClick={handleSubmit}
                  disabled={!consentGiven}
                  className="flex-1 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Send for analysis
                </Button>
                <Button variant="outline" onClick={retake} className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </Button>
              </>
            )}

            {capturedImage && result && !result.passed && (
              <Button onClick={retake} className="flex-1 gap-2">
                <RotateCcw className="w-4 h-4" />
                Retake
              </Button>
            )}

            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleFileUpload}
          aria-label="Upload a photo for skin analysis"
        />
      </CardContent>
    </Card>
  );
}
