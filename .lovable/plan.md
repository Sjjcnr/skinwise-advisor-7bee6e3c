
## Fix: Camera Feed Not Displaying

### Problem
The camera stream is obtained successfully, but the video feed shows nothing. This is a **race condition**:

1. `startCamera()` calls `getUserMedia()` and gets a stream
2. It tries to assign `videoRef.current.srcObject = stream` -- but `videoRef` is `null` because the `<video>` element only renders when `cameraActive === true`
3. Then it sets `setCameraActive(true)` -- now the video element renders, but the stream was never attached to it

### Solution
Refactor `startCamera` to set `cameraActive` first (so the video element mounts), then use a `useEffect` to attach the stream once the video element is available.

### Changes

**File: `src/components/FaceCapture.tsx`**

1. Store the stream in state instead of only in a ref, so we can react to it
2. Reorder `startCamera`: set `setCameraActive(true)` first, store the stream in the ref
3. Add a `useEffect` that watches `cameraActive` -- when the video element is in the DOM and a stream exists, attach `srcObject` and call `play()`

Specifically:
- In `startCamera`: move `setCameraActive(true)` and state resets **before** getting the stream, or better: get the stream, store it, set `cameraActive(true)`, and use an effect to wire it up
- Add a new `useEffect` that runs when `cameraActive` changes: if `cameraActive && streamRef.current && videoRef.current`, set `videoRef.current.srcObject = streamRef.current` and call `play()`
- Remove the `videoRef.current.srcObject` and `play()` calls from `startCamera` since the effect handles it

This ensures the video element exists in the DOM before we try to attach the stream to it, fixing the blank camera on both desktop and mobile.
