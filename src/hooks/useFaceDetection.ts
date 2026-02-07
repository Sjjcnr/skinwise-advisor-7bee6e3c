import { useRef, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

let modelPromise: Promise<blazeface.BlazeFaceModel> | null = null;

function getModel() {
  if (!modelPromise) {
    modelPromise = tf.ready().then(() => blazeface.load());
  }
  return modelPromise;
}

export interface FaceCheckResult {
  passed: boolean;
  message: string;
  tip: string;
}

interface OvalBounds {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/**
 * Compute average luminance (0-255) from RGBA image data.
 */
function computeLuminance(data: Uint8ClampedArray): number {
  let sum = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    // Rec. 709 luminance
    sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  return sum / pixelCount;
}

/**
 * Simple blur detection via variance of Laplacian on grayscale image.
 * For production, replace with OpenCV.js cv.Laplacian for better accuracy.
 */
function computeLaplacianVariance(
  data: Uint8ClampedArray,
  width: number,
  height: number
): number {
  // Convert to grayscale
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }

  // Apply 3x3 Laplacian kernel [0,1,0; 1,-4,1; 0,1,0]
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const lap =
        gray[(y - 1) * width + x] +
        gray[(y + 1) * width + x] +
        gray[y * width + (x - 1)] +
        gray[y * width + (x + 1)] -
        4 * gray[y * width + x];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

function isBboxInsideOval(
  topLeft: [number, number],
  bottomRight: [number, number],
  oval: OvalBounds,
  threshold = 0.7
): boolean {
  const faceW = bottomRight[0] - topLeft[0];
  const faceH = bottomRight[1] - topLeft[1];
  const faceCx = topLeft[0] + faceW / 2;
  const faceCy = topLeft[1] + faceH / 2;

  // Check center of face is inside oval
  const dx = (faceCx - oval.cx) / oval.rx;
  const dy = (faceCy - oval.cy) / oval.ry;
  if (dx * dx + dy * dy > 1) return false;

  // Check corners overlap ratio — simplified: face area vs oval area
  const faceArea = faceW * faceH;
  const ovalArea = Math.PI * oval.rx * oval.ry;
  return faceArea / ovalArea > 0.15 && faceArea / ovalArea < 0.95;
}

export function useFaceDetection() {
  const modelRef = useRef<blazeface.BlazeFaceModel | null>(null);

  const runChecks = useCallback(
    async (
      canvas: HTMLCanvasElement,
      ovalBounds: OvalBounds
    ): Promise<FaceCheckResult> => {
      const ctx = canvas.getContext('2d')!;
      const { width, height } = canvas;

      // 1. Resolution check
      if (width < 800) {
        return {
          passed: false,
          message: 'Low resolution',
          tip: 'Use a higher resolution camera or move closer.',
        };
      }

      const imageData = ctx.getImageData(0, 0, width, height);
      const { data } = imageData;

      // 2. Luminance check
      const lum = computeLuminance(data);
      if (lum < 50) {
        return {
          passed: false,
          message: 'Too dark',
          tip: 'Too dark — move to brighter, indirect light.',
        };
      }
      if (lum > 220) {
        return {
          passed: false,
          message: 'Too bright/overexposed',
          tip: 'Too bright/overexposed — avoid direct sunlight or bright lamps.',
        };
      }

      // 3. Blur check (variance of Laplacian)
      // For production: replace with OpenCV.js cv.Laplacian for better performance
      const blurScore = computeLaplacianVariance(data, width, height);
      if (blurScore < 120) {
        return {
          passed: false,
          message: 'Blurry',
          tip: 'Blurry — hold the phone steady or tap to focus.',
        };
      }

      // 4. Face detection
      try {
        if (!modelRef.current) {
          modelRef.current = await getModel();
        }
        const predictions = await modelRef.current.estimateFaces(canvas, false);

        if (predictions.length === 0) {
          return {
            passed: false,
            message: 'Face not detected',
            tip: 'Area not detected — ensure your face is centered inside the oval.',
          };
        }

        if (predictions.length > 1) {
          return {
            passed: false,
            message: 'Multiple faces detected',
            tip: 'Multiple faces detected — only one person in the frame please.',
          };
        }

        const face = predictions[0];
        if ((face.probability as number) < 0.75) {
          return {
            passed: false,
            message: 'Face partly occluded',
            tip: 'Face partly occluded — remove hands, hair, or accessories covering your face.',
          };
        }

        const topLeft = face.topLeft as [number, number];
        const bottomRight = face.bottomRight as [number, number];

        if (!isBboxInsideOval(topLeft, bottomRight, ovalBounds)) {
          return {
            passed: false,
            message: 'Face not centered',
            tip: 'Area not detected — ensure your face is centered inside the oval.',
          };
        }
      } catch (err) {
        console.error('Face detection error:', err);
        return {
          passed: false,
          message: 'Detection error',
          tip: 'Could not analyze the image. Please try again.',
        };
      }

      return {
        passed: true,
        message: 'Checks passed',
        tip: 'Checks passed — sending photo for analysis.',
      };
    },
    []
  );

  return { runChecks };
}
