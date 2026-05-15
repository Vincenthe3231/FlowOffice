import { useState, useRef, useCallback } from "react";
 
interface CameraState {
  photo: string | null;
  error: string | null;
  isOpen: boolean;
  stream: MediaStream | null;
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({
    photo: null,
    error: null,
    isOpen: false,
    stream: null,
  });
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      
      setState((prev) => ({
        ...prev,
        stream,
        isOpen: true,
        error: null,
      }));

      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      let errorMessage = "Failed to access camera";
      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please enable camera access.";
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device";
      }
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isOpen: false,
      }));
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return null;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Mirror the image for selfie mode
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoRef.current, 0, 0);

    const photoData = canvas.toDataURL("image/jpeg", 0.8);
    
    setState((prev) => ({
      ...prev,
      photo: photoData,
    }));

    return photoData;
  }, []);

  const closeCamera = useCallback(() => {
    if (state.stream) {
      state.stream.getTracks().forEach((track) => track.stop());
    }
   setState((prev) => ({
     ...prev,
      isOpen: false,
      stream: null,
   }));
  }, [state.stream]);

  const clearPhoto = useCallback(() => {
    setState((prev) => ({
      ...prev,
      photo: null,
    }));
  }, []);

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    if (element && state.stream) {
      element.srcObject = state.stream;
    }
  }, [state.stream]);

  return {
    ...state,
    videoRef: setVideoRef,
    openCamera,
    capturePhoto,
    closeCamera,
    clearPhoto,
    hasPhoto: !!state.photo,
  };
}