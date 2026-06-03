"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';

import { logger } from '@/lib/utils/logger';

/** Local path first; CDN fallback — weights are not shipped under /public/models in this repo. */
const FACE_MODEL_URLS = [
  "/models",
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights",
];

interface FaceDetectionKYCProps {
  onVerificationComplete?: (data: {
    faceDetected: boolean;
    age?: number;
    gender?: string;
    confidence?: number;
    capturedImage?: string;
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
  const manualFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionData, setDetectionData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string>('');
  const [isFaceValid, setIsFaceValid] = useState(false);
  const [isManualUploadInProgress, setIsManualUploadInProgress] = useState(false);
  const [modelLoadError, setModelLoadError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const isFaceValidRef = useRef(false);
  const detectionDataRef = useRef<any>(null);
  const faceCountRef = useRef(0);

  useEffect(() => {
    loadModels();
    
    return () => {
      // Cleanup: stop camera stream on unmount
      stopVideo();
    };
  }, []);

  useEffect(() => {
    startVideo();
  }, []);

  const loadModels = async () => {
    let lastError: unknown;
    for (const modelUrl of FACE_MODEL_URLS) {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
          faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
          faceapi.nets.faceExpressionNet.loadFromUri(modelUrl),
          faceapi.nets.ageGenderNet.loadFromUri(modelUrl),
        ]);
        logger.debug("general", "Face models loaded from", modelUrl);
        setIsModelLoaded(true);
        setModelLoadError(null);
        setIsLoading(false);
        return;
      } catch (error) {
        lastError = error;
        logger.warn("general", `Face models failed from ${modelUrl}:`, error);
      }
    }
    logger.error("general", "Error loading face models:", lastError);
    setModelLoadError(
      "Automatic face detection is unavailable. Use “Upload Selfie” or “Capture photo” below."
    );
    setIsLoading(false);
  };

  const startVideo = () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      })
      .then(async (stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          logger.warn("general", "video.play() failed:", playErr);
        }
        setCameraError(null);
      })
      .catch((err) => {
        logger.error("general", "Error accessing camera:", err);
        setCameraError(
          "Could not access the camera. Allow camera permission or upload a selfie below."
        );
      });
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      
      // Stop all tracks (video and audio if any)
      tracks.forEach(track => {
        track.stop();
        logger.debug('general', 'Camera track stopped:', track.kind);
      });
      
      // Clear the video source
      videoRef.current.srcObject = null;
      
      // Pause the video element
      videoRef.current.pause();
      
      logger.debug('general', 'Camera fully stopped');
    }
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

    // 2. Centering check DISABLED - face can be positioned anywhere
    // (No centering requirement at all)

    // 3. Edge check DISABLED - face can be anywhere, even partially cut off
    // (No edge restriction at all - this check is completely disabled)

    // 4. Validate all key facial landmarks are detected
    if (!landmarks || !landmarks.positions || landmarks.positions.length < 68) {
      return { isValid: false, message: 'Full face not detected' };
    }

    // 5. Check face alignment - MINIMAL CHECK (almost disabled)
    const jawLine = landmarks.getJawOutline();
    const nose = landmarks.getNose();
    
    if (jawLine.length < 5 || nose.length < 3) {
      return { isValid: false, message: 'Face not detected properly' };
    }

    // 6. Landmark position check DISABLED
    // (Landmarks can be anywhere - this check is completely disabled)

    // 7. Verify critical landmarks (eyes, nose, mouth) - MINIMAL REQUIREMENTS
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const noseTip = landmarks.getNose();
    const mouth = landmarks.getMouth();
    
    if (leftEye.length < 2 || rightEye.length < 2 || noseTip.length < 3 || mouth.length < 5) {
      return { isValid: false, message: 'Face features not detected' };
    }

    // 8. Check detection confidence - EXTREMELY LENIENT
    const confidence = detection.detection.score;
    if (confidence < 0.2) {
      return { isValid: false, message: "Improve lighting" };
    }

    return { isValid: true, message: "Perfect! Hold still…" };
  };

  const completeCapture = useCallback(
    (imageData: string, meta?: { age?: number; gender?: string; confidence?: number }) => {
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
        });
      }, 300);
    },
    [onVerificationComplete]
  );

  const captureFromRefs = useCallback((force = false) => {
    const detection = detectionDataRef.current;
    const valid = isFaceValidRef.current;
    const count = faceCountRef.current;

    if (!videoRef.current) return;
    if (!force && isModelLoaded && count !== 1) {
      setValidationStatus("Center one face in the circle, or tap Capture photo");
      return;
    }

    const circleSize = 350;
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = circleSize;
    captureCanvas.height = circleSize;
    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, circleSize, circleSize);
    const imageData = captureCanvas.toDataURL("image/jpeg", 0.92);

    if (valid && detection) {
      const { age, gender, genderProbability } = detection;
      completeCapture(imageData, {
        age: Math.round(age),
        gender,
        confidence: Math.round(genderProbability * 100),
      });
    } else {
      completeCapture(imageData);
    }
  }, [completeCapture, isModelLoaded]);

  const handleCapture = () => {
    captureFromRefs(true);
  };

  // Auto-capture when VALID face is detected for 3 seconds
  useEffect(() => {
    if (faceCount === 1 && detectionData && isFaceValid && !isVerified) {
      if (countdown === null) {
        setCountdown(3);
      }
    } else {
      setCountdown(null);
    }
  }, [faceCount, detectionData, isFaceValid, isVerified]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      captureFromRefs(false);
    }
  }, [countdown, captureFromRefs]);

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded || isVerified) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      requestAnimationFrame(detectFaces);
      return;
    }

    const canvas = canvasRef.current;
    
    // Set canvas to match video size (circular container)
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
      setValidationStatus(validation.message);

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
      setValidationStatus("No face detected — center your face in the circle");
    } else {
      setDetectionData(null);
      detectionDataRef.current = null;
      setIsFaceValid(false);
      isFaceValidRef.current = false;
      setValidationStatus("Multiple faces detected — only one person");
    }

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (detections.length === 1 && isFaceValidRef.current) {
      // Draw detections with green border for valid face
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    
    // Draw face info
    resizedDetections.forEach(detection => {
      const { age, gender, genderProbability } = detection;
      const text = `${Math.round(age)} years, ${gender} (${Math.round(genderProbability * 100)}%)`;
      
      new faceapi.draw.DrawTextField(
        [text],
        detection.detection.box.bottomLeft
      ).draw(canvas);
    });
    }

    if (!isVerified) {
      requestAnimationFrame(detectFaces);
    }
  };

  const handleManualFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      logger.error("general", "Manual face upload: not an image file");
      return;
    }

    const reader = new FileReader();
    setIsManualUploadInProgress(true);

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        completeCapture(result);
      }
      setIsManualUploadInProgress(false);
    };

    reader.onerror = (err) => {
      logger.error("general", "Error reading manual face image:", err);
      setIsManualUploadInProgress(false);
    };

    reader.readAsDataURL(file);
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

  // Effect to stop camera when verification is complete
  useEffect(() => {
    if (isVerified) {
      // Ensure camera is stopped when verified
      const timer = setTimeout(() => {
        stopVideo();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isVerified]);

  // Debug effect for captured image
  useEffect(() => {
    if (capturedImage) {
      logger.debug('general', 'Captured image state updated, length:', capturedImage.length);
    }
  }, [capturedImage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-white text-lg">Loading face detection models...</div>
      </div>
    );
  }

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
            : isFaceValid && countdown !== null
            ? 'text-[#ffeb3b]'
            : isFaceValid 
            ? 'text-[#4CAF50]'
            : 'text-[#f44336]'
        }`}>
          {isVerified 
            ? '✓ Submitting verification...' 
            : countdown !== null 
            ? `📸 Capturing in ${countdown}...` 
            : validationStatus || 'Please position your face in the camera'}
        </div>
      </div>

      {(modelLoadError || cameraError) && (
        <div className="mb-4 w-full max-w-md rounded-lg border border-amber-500/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          {cameraError || modelLoadError}
        </div>
      )}

      {/* Circular Video and Canvas */}
      <div className="relative flex justify-center items-center mb-6 w-full px-3">
        <div className={`relative w-[min(280px,90vw)] sm:w-[320px] md:w-[350px] aspect-square rounded-full overflow-hidden border-4 transition-colors ${
          isVerified
            ? 'border-[#4CAF50] shadow-[0_0_30px_rgba(76,175,80,0.9)]'
            : isFaceValid && faceCount === 1 
            ? 'border-[#4CAF50] shadow-[0_0_30px_rgba(76,175,80,0.7)]' 
            : 'border-[#f44336] shadow-[0_0_30px_rgba(244,67,54,0.5)]'
        }`}>
          {!isVerified ? (
            <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute top-1/2 left-1/2 w-full h-full object-cover -translate-x-1/2 -translate-y-1/2"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />
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
          <li className={(isVerified || isFaceValid) ? "text-[#4CAF50]" : "text-[#f44336]"}>
            {(isVerified || isFaceValid) ? '✓' : '✗'} Good lighting & quality
          </li>
        </ul>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 w-full max-w-md">
        <div className="flex gap-3">
          {isVerified && (
            <button
              onClick={() => {
                setIsVerified(false);
                setCountdown(null);
                setCapturedImage(null);
                setDetectionData(null);
                setValidationStatus('');
                setIsFaceValid(false);
                isFaceValidRef.current = false;
                detectionDataRef.current = null;
                faceCountRef.current = 0;
                onRetake?.();
                startVideo();
              }}
              className="flex-1 px-6 py-3 text-white bg-[#ff9800] hover:bg-[#f57c00] rounded-lg transition-colors"
            >
              Retake Photo
            </button>
          )}
          
          {!isVerified && onClose && (
            <button
              onClick={() => {
                // Stop camera before closing
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
              onClick={handleCapture}
              disabled={!!cameraError}
              className="w-full px-6 py-3 text-sm font-medium text-white bg-[#1D8751] hover:bg-[#167a47] rounded-lg transition-colors disabled:opacity-50"
            >
              {isFaceValid && faceCount === 1
                ? "Capture photo now"
                : "Capture photo (use if auto-detect is slow)"}
            </button>
            <input
              ref={manualFileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={handleManualFileChange}
            />
            {/* Gallery upload disabled — camera capture only
            <button
              type="button"
              onClick={() => manualFileInputRef.current?.click()}
              disabled={isManualUploadInProgress}
              className="w-full px-6 py-3 text-sm text-white border border-[#35353E] hover:bg-[#1a1a1a] rounded-lg transition-colors disabled:opacity-50"
            >
              {isManualUploadInProgress ? "Uploading selfie…" : "Upload selfie from gallery"}
            </button>
            */}
          </>
        )}
      </div>

      {/* Status */}
      <div className="text-center mt-4 text-sm text-gray-400">
        Status: {isModelLoaded ? 'Ready' : 'Loading...'}
      </div>
    </div>
  );
};

export default FaceDetectionKYC;


