"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

import { logger } from '@/lib/utils/logger';
import {
  KYC_VIDEO_RECORDING_SECONDS,
  blobToKycVideoFile,
  extractKycPhotoFromVideoBlob,
  getKycCameraAccessError,
  attachStreamToVideoElement,
  getSupportedKycVideoMimeType,
  requestKycCameraStream,
} from '@/features/kyc/utils/kycVideoUtils';

/** CDN first — /public/models is not shipped; local path was causing long timeouts. */
const FACE_MODEL_URLS = [
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights",
  "/models",
];
const MODEL_LOAD_TIMEOUT_MS = 45_000;

interface FaceDetectionKYCProps {
  onVerificationComplete?: (data: {
    faceDetected: boolean;
    age?: number;
    gender?: string;
    confidence?: number;
    capturedImage?: string;
    capturedVideo?: File;
    captureSource?: "camera" | "gallery";
  }) => void;
  onClose?: () => void;
  onRetake?: () => void;
}

const FaceDetectionKYC: React.FC<FaceDetectionKYCProps> = ({ 
  onVerificationComplete, 
  onClose,
  onRetake
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const captureInProgressRef = useRef(false);
  const cameraStartInFlightRef = useRef(false);
  const isVerifiedRef = useRef(false);

  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionData, setDetectionData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [recordingCountdown, setRecordingCountdown] = useState<number | null>(null);
  const [captureInProgress, setCaptureInProgress] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string>('');
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isGalleryValidating, setIsGalleryValidating] = useState(false);

  const isFaceValidRef = useRef(false);
  const detectionDataRef = useRef<any>(null);
  const faceCountRef = useRef(0);

  const stopVideo = useCallback(() => {
    cameraStartInFlightRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        logger.debug('general', 'Camera track stopped:', track.kind);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause();
    }

    logger.debug('general', 'Camera fully stopped');
  }, []);

  const startVideo = useCallback(async () => {
    if (isVerified || cameraStartInFlightRef.current) return;

    const preflightError = getKycCameraAccessError();
    if (preflightError) {
      setCameraError(preflightError.message);
      setIsCameraStarting(false);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    cameraStartInFlightRef.current = true;
    setIsCameraStarting(true);
    setCameraError(null);

    try {
      if (!streamRef.current) {
        const stream = await requestKycCameraStream();
        streamRef.current = stream;
      }

      const attached = await attachStreamToVideoElement(
        video,
        streamRef.current
      );
      if (!attached) {
        throw new Error("Camera preview did not start");
      }

      setCameraError(null);
    } catch (err) {
      logger.error("general", "Error accessing camera:", err);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const accessError = getKycCameraAccessError(err);
      setCameraError(
        accessError?.message ??
          "Could not access the camera. Allow camera permission and try again."
      );
    } finally {
      cameraStartInFlightRef.current = false;
      setIsCameraStarting(false);
    }
  }, [isVerified]);

  const handleVideoRef = useCallback(
    (node: HTMLVideoElement | null) => {
      videoRef.current = node;
      if (node && !isVerified) {
        void startVideo();
      }
    },
    [isVerified, startVideo]
  );

  const handleRetryCamera = useCallback(() => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    void startVideo();
  }, [startVideo]);

  useEffect(() => {
    loadModels();

    return () => {
      stopVideo();
    };
  }, [stopVideo]);

  const loadModels = async () => {
    let lastError: unknown;
    setIsLoadingModels(true);

    for (const modelUrl of FACE_MODEL_URLS) {
      try {
        await Promise.race([
          Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
            faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
            faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
            faceapi.nets.ageGenderNet.loadFromUri(modelUrl),
          ]),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error(`Model load timed out for ${modelUrl}`)),
              MODEL_LOAD_TIMEOUT_MS
            );
          }),
        ]);
        logger.debug("general", "Face models loaded from", modelUrl);
        setIsModelLoaded(true);
        setModelLoadError(null);
        setIsLoadingModels(false);
        return;
      } catch (error) {
        lastError = error;
        logger.warn("general", `Face models failed from ${modelUrl}:`, error);
      }
    }

    logger.error("general", "Error loading face models:", lastError);
    setModelLoadError(
      "Automatic face detection is unavailable. You can still pick a selfie from gallery."
    );
    setIsLoadingModels(false);
  };

  // Validate face using video pixel dimensions (detection boxes are in video space, not UI circle size)
  const validateFullFace = (
    detection: any,
    videoWidth: number,
    videoHeight: number
  ): { isValid: boolean; message: string } => {
    const box = detection.detection.box;
    const landmarks = detection.landmarks;
    const frameWidth = videoWidth || 640;
    const frameHeight = videoHeight || 480;

    const minFaceSize = Math.min(frameWidth, frameHeight) * 0.12;
    const maxFaceSize = Math.min(frameWidth, frameHeight) * 0.85;
    if (box.width < minFaceSize || box.height < minFaceSize) {
      return { isValid: false, message: "Move closer — face too small" };
    }
    if (box.width > maxFaceSize || box.height > maxFaceSize) {
      return { isValid: false, message: "Move back slightly — too close" };
    }

    if (!landmarks || !landmarks.positions || landmarks.positions.length < 68) {
      return { isValid: false, message: 'Full face not detected' };
    }

    const jawLine = landmarks.getJawOutline();
    const nose = landmarks.getNose();
    
    if (jawLine.length < 5 || nose.length < 3) {
      return { isValid: false, message: 'Face not detected properly' };
    }

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const noseTip = landmarks.getNose();
    const mouth = landmarks.getMouth();
    
    if (leftEye.length < 2 || rightEye.length < 2 || noseTip.length < 3 || mouth.length < 5) {
      return { isValid: false, message: 'Face features not detected' };
    }

    const confidence = detection.detection.score;
    if (confidence < 0.2) {
      return { isValid: false, message: "Improve lighting" };
    }

    return { isValid: true, message: "Perfect! Hold still…" };
  };

  const completeCapture = useCallback(
    (
      imageData: string,
      videoFile?: File,
      meta?: { age?: number; gender?: string; confidence?: number },
      captureSource: "camera" | "gallery" = "camera"
    ) => {
      isVerifiedRef.current = true;
      captureInProgressRef.current = true;
      setCountdown(null);
      setRecordingCountdown(null);
      setCapturedImage(imageData);
      setIsVerified(true);
      stopVideo();

      setTimeout(() => {
        onVerificationComplete?.({
          faceDetected: true,
          age: meta?.age,
          gender: meta?.gender,
          confidence: meta?.confidence,
          capturedImage: imageData,
          capturedVideo: videoFile,
          captureSource,
        });
      }, 300);
    },
    [onVerificationComplete, stopVideo]
  );

  const detectFaceInStillImage = useCallback(
    async (imageDataUrl: string) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Could not load image"));
        img.src = imageDataUrl;
      });

      const detections = await faceapi
        .detectAllFaces(
          img,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 416,
            scoreThreshold: 0.2,
          })
        )
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      if (detections.length === 0) {
        return { ok: false as const, message: "No face detected — choose a clear selfie photo" };
      }
      if (detections.length > 1) {
        return {
          ok: false as const,
          message: "Multiple faces detected — use a photo with only your face",
        };
      }

      const validation = validateFullFace(detections[0], img.width, img.height);
      if (!validation.isValid) {
        return { ok: false as const, message: validation.message };
      }

      return { ok: true as const, detection: detections[0] };
    },
    []
  );

  const handleGalleryFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isVerified) return;

    if (!file.type.startsWith("image/")) {
      setValidationStatus("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationStatus("Image must be smaller than 5MB");
      return;
    }
    if (!isModelLoaded) {
      setValidationStatus("Face detection is still loading — please wait");
      return;
    }

    setIsGalleryValidating(true);
    setValidationStatus("Verifying face in selected photo…");

    try {
      const imageData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") resolve(reader.result);
          else reject(new Error("Could not read image"));
        };
        reader.onerror = () => reject(reader.error ?? new Error("Could not read image"));
        reader.readAsDataURL(file);
      });

      const result = await detectFaceInStillImage(imageData);
      if (!result.ok) {
        setValidationStatus(result.message);
        return;
      }

      const { age, gender, genderProbability } = result.detection;
      completeCapture(
        imageData,
        undefined,
        {
          age: Math.round(age),
          gender,
          confidence: Math.round(genderProbability * 100),
        },
        "gallery"
      );
    } catch (error) {
      logger.error("general", "Gallery face verification failed:", error);
      setValidationStatus("Could not verify this photo. Try another clear selfie.");
    } finally {
      setIsGalleryValidating(false);
    }
  };

  const runCaptureSequence = useCallback(async () => {
    if (captureInProgressRef.current || isVerified || isVerifiedRef.current) return;

    const count = faceCountRef.current;
    const valid = isFaceValidRef.current;
    const detection = detectionDataRef.current;

    if (isModelLoaded && count !== 1) {
      setValidationStatus("Center one face in the circle");
      return;
    }

    const stream = streamRef.current;
    if (!stream || !stream.active) {
      setCameraError("Camera is not ready. Please allow camera access and try again.");
      await startVideo();
      return;
    }

    const mimeType = getSupportedKycVideoMimeType();
    if (!mimeType) {
      setValidationStatus("Video recording is not supported in this browser.");
      return;
    }

    captureInProgressRef.current = true;
    setCaptureInProgress(true);
    setCountdown(null);
    setValidationStatus("Preparing to record...");

    try {
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      await new Promise<void>((resolve, reject) => {
        recorder.onerror = () => reject(new Error("Video recording failed"));
        recorder.onstart = () => resolve();
        recorder.start(250);
      });

      for (let remaining = KYC_VIDEO_RECORDING_SECONDS; remaining > 0; remaining--) {
        setRecordingCountdown(remaining);
        setValidationStatus(
          `Stay still on camera until recording finishes (${remaining} s)`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!recorder || recorder.state === "inactive") {
          throw new Error("Video recording stopped unexpectedly");
        }
      }

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });
      mediaRecorderRef.current = null;

      const videoBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      if (videoBlob.size < 1024) {
        throw new Error("Recorded video is too small");
      }

      const videoFile = blobToKycVideoFile(videoBlob, mimeType);
      const imageData = await extractKycPhotoFromVideoBlob(videoBlob);

      if (valid && detection) {
        const { age, gender, genderProbability } = detection;
        completeCapture(imageData, videoFile, {
          age: Math.round(age),
          gender,
          confidence: Math.round(genderProbability * 100),
        });
      } else {
        completeCapture(imageData, videoFile);
      }
    } catch (error) {
      logger.error("general", "KYC capture sequence failed:", error);
      setValidationStatus("Capture failed. Center your face and try again.");
      setCountdown(null);
    } finally {
      if (!isVerifiedRef.current) {
        captureInProgressRef.current = false;
        setCaptureInProgress(false);
        setRecordingCountdown(null);
      }
    }
  }, [completeCapture, isModelLoaded, isVerified, startVideo]);

  const isRecordingVideo = recordingCountdown !== null && recordingCountdown > 0;

  // Auto-capture when VALID face is detected for 3 seconds
  useEffect(() => {
    if (
      faceCount === 1 &&
      detectionData &&
      isFaceValid &&
      !isVerified &&
      !isVerifiedRef.current &&
      !captureInProgress
    ) {
      setCountdown((current) => (current === null ? 3 : current));
    } else if (!captureInProgress && !isVerifiedRef.current) {
      setCountdown(null);
    }
  }, [faceCount, detectionData, isFaceValid, isVerified, captureInProgress]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (
      countdown === 0 &&
      !captureInProgressRef.current &&
      !isVerifiedRef.current
    ) {
      void runCaptureSequence();
    }
  }, [countdown, runCaptureSequence]);

  const detectFaces = async () => {
    if (
      !videoRef.current ||
      !canvasRef.current ||
      !isModelLoaded ||
      isVerified ||
      isVerifiedRef.current ||
      captureInProgressRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      requestAnimationFrame(detectFaces);
      return;
    }

    const canvas = canvasRef.current;
    
    const circleSize = 350;
    canvas.width = circleSize;
    canvas.height = circleSize;

    const displaySize = { width: circleSize, height: circleSize };
    faceapi.matchDimensions(canvas, displaySize);

    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,
        scoreThreshold: 0.2,
      })
    ).withFaceLandmarks().withFaceExpressions().withAgeAndGender();

    setFaceCount(detections.length);
    faceCountRef.current = detections.length;

    if (detections.length === 1) {
      const validation = validateFullFace(
        detections[0],
        video.videoWidth,
        video.videoHeight
      );
      if (!captureInProgressRef.current) {
        setValidationStatus(validation.message);
      }

      if (validation.isValid) {
        setDetectionData(detections[0]);
        detectionDataRef.current = detections[0];
        setIsFaceValid(true);
        isFaceValidRef.current = true;
      } else {
        setDetectionData(null);
        detectionDataRef.current = null;
        setIsFaceValid(false);
        isFaceValidRef.current = false;
      }
    } else if (detections.length === 0) {
      setDetectionData(null);
      detectionDataRef.current = null;
      setIsFaceValid(false);
      isFaceValidRef.current = false;
      if (!captureInProgressRef.current) {
        setValidationStatus("No face detected — center your face in the circle");
      }
    } else {
      setDetectionData(null);
      detectionDataRef.current = null;
      setIsFaceValid(false);
      isFaceValidRef.current = false;
      if (!captureInProgressRef.current) {
        setValidationStatus("Multiple faces detected — only one person");
      }
    }

    // Keep the preview clean — no detection box, landmarks, or labels drawn.
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (!isVerified && !isVerifiedRef.current && !captureInProgressRef.current) {
      requestAnimationFrame(detectFaces);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isModelLoaded || isVerified) return;

    const onPlaying = () => {
      detectFaces();
    };
    video.addEventListener("playing", onPlaying);
    if (!video.paused && video.readyState >= 2) {
      detectFaces();
    }

    return () => {
      video.removeEventListener("playing", onPlaying);
    };
  }, [isModelLoaded, isVerified]);

  useEffect(() => {
    if (isVerified) {
      const timer = setTimeout(() => {
        stopVideo();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isVerified, stopVideo]);

  useEffect(() => {
    if (capturedImage) {
      logger.debug('general', 'Captured image state updated, length:', capturedImage.length);
    }
  }, [capturedImage]);

  return (
    <div className="relative flex flex-col items-center justify-center p-6 bg-[#0a0a0a] rounded-lg">
      {/* Header Info */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">Face Verification</h2>
        <div className="text-lg mb-1">
          Faces Detected: <span className={faceCount === 1 && isFaceValid ? "text-[#4CAF50] font-bold" : "text-[#f44336] font-bold"}>{faceCount}</span>
        </div>
        <div className={`text-sm font-medium ${
          isVerified 
            ? 'text-[#4CAF50]'
            : isRecordingVideo
            ? 'text-[#ff9800]'
            : isFaceValid && countdown !== null
            ? 'text-[#ffeb3b]'
            : isFaceValid 
            ? 'text-[#4CAF50]'
            : 'text-[#f44336]'
        }`}>
          {isVerified 
            ? '✓ Submitting verification...' 
            : isRecordingVideo
            ? `🎥 Recording… ${recordingCountdown}s — stay still`
            : countdown !== null 
            ? `📸 Capturing in ${countdown}...` 
            : validationStatus || 'Please position your face in the camera'}
        </div>
      </div>

      {isCameraStarting && !cameraError && (
        <div className="mb-4 w-full max-w-md rounded-lg border border-[#1D8751]/40 bg-[#1D8751]/10 px-4 py-3 text-sm text-[#a5d6b0]">
          Starting camera…
        </div>
      )}

      {cameraError && (
        <div className="mb-4 w-full max-w-md rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          <p>{cameraError}</p>
          <button
            type="button"
            onClick={handleRetryCamera}
            className="mt-2 text-xs font-medium text-amber-200 underline hover:text-white"
          >
            Retry camera
          </button>
        </div>
      )}

      {modelLoadError && !cameraError && (
        <div className="mb-4 w-full max-w-md rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          <p>{modelLoadError}</p>
        </div>
      )}

      {/* Circular Video and Canvas */}
      <div className="relative flex justify-center items-center mb-6 w-full px-3">
        <div className={`relative w-[min(280px,90vw)] sm:w-[320px] md:w-[350px] aspect-square rounded-full overflow-hidden border-4 transition-colors ${
          isVerified
            ? 'border-[#4CAF50] shadow-[0_0_30px_rgba(76,175,80,0.9)]'
            : isRecordingVideo
            ? 'border-[#ff9800] shadow-[0_0_30px_rgba(255,152,0,0.7)]'
            : isFaceValid && faceCount === 1 
            ? 'border-[#4CAF50] shadow-[0_0_30px_rgba(76,175,80,0.7)]' 
            : 'border-[#f44336] shadow-[0_0_30px_rgba(244,67,54,0.5)]'
        }`}>
          {!isVerified ? (
            <>
              <video
                ref={handleVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 scale-x-[-1]"
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />
              {isLoadingModels && (
                <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white">
                  Loading face detection…
                </div>
              )}
              {isRecordingVideo && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white">
                  REC {recordingCountdown}
                </div>
              )}
            </>
          ) : (
            <div className="absolute top-0 left-0 w-full h-full bg-black">
              {capturedImage ? (
                <img 
                  src={capturedImage} 
                  alt="Captured Face" 
                  className="w-full h-full object-cover"
                  onLoad={() => logger.debug('general', 'Image loaded successfully')}
                  onError={(e) => console.error('Image failed to load:', e)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-white">
                  Processing...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-[rgba(0,0,0,0.8)] p-4 rounded-lg border border-[rgba(76,175,80,0.3)] mb-4 w-full max-w-md">
        <h3 className="text-white font-semibold mb-2">KYC Requirements:</h3>
        <ul className="space-y-2 text-sm">
          <li className={(isVerified || (faceCount === 1 && isFaceValid)) ? "text-[#4CAF50]" : "text-[#f44336]"}>
            {(isVerified || (faceCount === 1 && isFaceValid)) ? '✓' : '✗'} Full face clearly visible
          </li>
          <li className={(isVerified || isFaceValid) ? "text-[#4CAF50]" : "text-[#f44336]"}>
            {(isVerified || isFaceValid) ? '✓' : '✗'} Face in view
          </li>
          <li className={(isVerified || isFaceValid) ? "text-[#4CAF50]" : "text-[#f44336]"}>
            {(isVerified || isFaceValid) ? '✓' : '✗'} All facial features visible
          </li>
          <li className={(isVerified || isRecordingVideo || isFaceValid) ? "text-[#4CAF50]" : "text-[#f44336]"}>
            {(isVerified || isRecordingVideo || isFaceValid) ? '✓' : '✗'} Short verification video recorded (camera only)
          </li>
        </ul>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <div className="flex gap-3">
          {isVerified && (
            <button
              onClick={() => {
                isVerifiedRef.current = false;
                setIsVerified(false);
                setCountdown(null);
                setRecordingCountdown(null);
                setCapturedImage(null);
                setDetectionData(null);
                setValidationStatus('');
                setIsFaceValid(false);
                captureInProgressRef.current = false;
                setCaptureInProgress(false);
                isFaceValidRef.current = false;
                detectionDataRef.current = null;
                faceCountRef.current = 0;
                onRetake?.();
                void startVideo();
              }}
              className="flex-1 px-6 py-3 text-white bg-[#ff9800] hover:bg-[#f57c00] rounded-lg transition-colors"
            >
              Retake Photo
            </button>
          )}
          
          {!isVerified && onClose && (
            <button
              onClick={() => {
                stopVideo();
                onClose();
              }}
              className="flex-1 px-6 py-3 text-white bg-[#f44336] hover:bg-[#d32f2f] rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {!isVerified && (
          <>
            <button
              type="button"
              onClick={() => galleryFileInputRef.current?.click()}
              disabled={!isModelLoaded || isGalleryValidating || captureInProgress}
              className="w-full px-6 py-3 text-sm font-medium text-white border border-[#35353E] hover:bg-[#1a1a1a] rounded-lg transition-colors disabled:opacity-50"
            >
              {isGalleryValidating
                ? "Verifying selected photo…"
                : !isModelLoaded
                ? "Pick selfie from gallery (loading…)"
                : "Pick selfie from gallery"}
            </button>
            <p className="text-xs text-center text-[#f44336]">
              Your photo must show one clear face. Use this if the camera is unavailable.
            </p>
            <input
              ref={galleryFileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGalleryFileChange}
            />
          </>
        )}
      </div>

      {/* Status */}
      <div className="text-center mt-4 text-sm text-gray-400">
        Status: {isModelLoaded ? "Ready" : isLoadingModels ? "Loading models…" : "Models unavailable"}
      </div>
    </div>
  );
};

export default FaceDetectionKYC;
