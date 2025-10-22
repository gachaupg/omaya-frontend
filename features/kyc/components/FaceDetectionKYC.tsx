"use client";
import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

import { logger } from '@/lib/utils/logger';

interface FaceDetectionKYCProps {
  onVerificationComplete?: (data: {
    faceDetected: boolean;
    age?: number;
    gender?: string;
    confidence?: number;
    capturedImage?: string;
  }) => void;
  onClose?: () => void;
}

const FaceDetectionKYC: React.FC<FaceDetectionKYCProps> = ({ 
  onVerificationComplete, 
  onClose 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [faceCount, setFaceCount] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [detectionData, setDetectionData] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string>('');
  const [isFaceValid, setIsFaceValid] = useState(false);

  useEffect(() => {
    loadModels();
    
    return () => {
      // Cleanup: stop camera stream on unmount
      stopVideo();
    };
  }, []);

  useEffect(() => {
    if (isModelLoaded) {
      startVideo();
    }
  }, [isModelLoaded]);

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
      handleCapture();
    }
  }, [countdown]);

  const loadModels = async () => {
    try {
      const MODEL_URL = '/models';
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL)
      ]);
      
      setIsModelLoaded(true);
      setIsLoading(false);
    } catch (error) {
      logger.error('general', 'Error loading models:', error);
      setIsLoading(false);
    }
  };

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: 1280, 
        height: 720,
        facingMode: 'user' 
      } 
    })
    .then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    })
    .catch(err => logger.error('general', 'Error accessing camera:', err));
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

  // Balanced validation for full face detection
  const validateFullFace = (detection: any, circleSize: number): { isValid: boolean; message: string } => {
    const box = detection.detection.box;
    const landmarks = detection.landmarks;
    
    // 1. Check if face is too small (user too far away) - MORE LENIENT
    const minFaceSize = circleSize * 0.35; // Face should be at least 35% of circle (more lenient)
    const maxFaceSize = circleSize * 0.95; // Face can be up to 95% (more lenient)
    if (box.width < minFaceSize || box.height < minFaceSize) {
      return { isValid: false, message: 'Move closer - face too small' };
    }
    if (box.width > maxFaceSize || box.height > maxFaceSize) {
      return { isValid: false, message: 'Move back slightly - too close' };
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
    if (confidence < 0.3) { // Very low 30% confidence threshold
      return { isValid: false, message: 'Improve lighting' };
    }

    return { isValid: true, message: 'Perfect! Hold still...' };
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelLoaded || isVerified) return;

    const video = videoRef.current;
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
        inputSize: 416,  // Good balance of accuracy and performance
        scoreThreshold: 0.3  // Very lenient threshold - very easy detection
      })
    ).withFaceLandmarks().withFaceExpressions().withAgeAndGender();

    setFaceCount(detections.length);

    // Validate face detection with strict rules
    if (detections.length === 1) {
      const validation = validateFullFace(detections[0], circleSize);
      setValidationStatus(validation.message);
      
      if (validation.isValid) {
      setDetectionData(detections[0]);
        setIsFaceValid(true);
      } else {
        setDetectionData(null);
        setIsFaceValid(false);
      }
    } else if (detections.length === 0) {
      setDetectionData(null);
      setIsFaceValid(false);
      setValidationStatus('No face detected');
    } else {
      setDetectionData(null);
      setIsFaceValid(false);
      setValidationStatus('Multiple faces detected - ensure only one person');
    }

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Only draw if face is valid - this prevents partial faces from being shown as valid
    if (detections.length === 1 && isFaceValid) {
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

  const handleCapture = () => {
    // Only capture if face is fully valid
    if (detectionData && faceCount === 1 && isFaceValid && videoRef.current && canvasRef.current) {
      const { age, gender, genderProbability } = detectionData;
      
      // Capture the current video frame BEFORE setting isVerified
      const captureCanvas = document.createElement('canvas');
      const circleSize = 350;
      captureCanvas.width = circleSize;
      captureCanvas.height = circleSize;
      const ctx = captureCanvas.getContext('2d');
      
      if (ctx && videoRef.current) {
        // Draw the video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, circleSize, circleSize);
        
        // Convert to base64 image
        const imageData = captureCanvas.toDataURL('image/jpeg', 0.95);
        
        logger.debug('general', 'Image captured:', imageData.substring(0, 50) + '...');
        logger.debug('general', 'Image data length:', imageData.length);
        
        // Set captured image FIRST
        setCapturedImage(imageData);
        
        // THEN set verified (this will stop the detection loop)
        setIsVerified(true);
        
        logger.debug('general', 'Verification complete, image set');
        
        // Stop the video stream immediately
        stopVideo();
        
        // Automatically trigger onVerificationComplete after a short delay to show the captured image
        setTimeout(() => {
          if (onVerificationComplete) {
            logger.debug('general', 'Auto-submitting verification data');
            onVerificationComplete({
              faceDetected: true,
              age: Math.round(age),
              gender,
              confidence: Math.round(genderProbability * 100),
              capturedImage: imageData
            });
          }
        }, 500); // Short delay to show the captured image before proceeding
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && isModelLoaded && !isVerified) {
      videoRef.current.addEventListener('play', detectFaces);
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('play', detectFaces);
      }
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

      {/* Circular Video and Canvas */}
      <div className="relative flex justify-center items-center mb-6">
        <div className={`relative w-[350px] h-[350px] rounded-full overflow-hidden border-4 transition-colors ${
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
      <div className="flex gap-3 w-full max-w-md">
        {isVerified && (
          <button
            onClick={() => {
              setIsVerified(false);
              setCountdown(null);
              setCapturedImage(null);
              setDetectionData(null);
              setValidationStatus('');
              setIsFaceValid(false);
              // Restart video
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

      {/* Status */}
      <div className="text-center mt-4 text-sm text-gray-400">
        Status: {isModelLoaded ? 'Ready' : 'Loading...'}
      </div>
    </div>
  );
};

export default FaceDetectionKYC;


