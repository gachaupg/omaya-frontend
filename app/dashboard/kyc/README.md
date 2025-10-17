# KYC Modal with Face Detection Integration

This KYC modal now includes AI-powered face detection using face-api.js.

## What Was Changed

### 1. **Imports**
Added the FaceDetectionKYC component:
```tsx
import { FaceDetectionKYC } from "@/features/kyc/components";
```

### 2. **State Management**
- Removed old camera-related states (cameraStream, isCapturing, captureProgress, etc.)
- Added `faceDetectionData` state to store face detection results
- Kept `faceImage` and `facePreview` for compatibility but now use face detection data

### 3. **Functions Removed**
- `startCamera()` - Replaced by FaceDetectionKYC component
- `stopCamera()` - Replaced by FaceDetectionKYC component  
- `captureFace()` - Replaced by face detection auto-capture

### 4. **New Functions**
- `handleFaceDetectionComplete()` - Handles face detection data from the component

### 5. **Step 3 Replacement**
The entire Step 3 (Face Verification) section has been replaced with:
- FaceDetectionKYC component for AI-powered face detection
- Real-time age and gender detection
- Automatic face capture with countdown
- Verification details display showing:
  - Face detection status
  - Estimated age
  - Detected gender
  - Confidence level

### 6. **Data Submission**
The verification submission now includes:
```typescript
{
  user_id: user.user_id,
  status: true,
  verification_method: 'manual_with_face_detection',
  face_data: {
    faceDetected: boolean,
    age: number,
    gender: string,
    confidence: number
  }
}
```

### 7. **Success Modal**
Updated to display face verification data including age, gender, and confidence.

## Features

### Step 1: Document Information
- Country selection
- Document type (Passport, National ID, Driver's License)
- Document number

### Step 2: Document Upload
- Upload clear photo of document
- 5MB file size limit
- Preview before submission

### Step 3: Face Detection (NEW)
- **Circular camera view** (350px)
- **Real-time face detection** using face-api.js
- **Age and gender estimation**
- **Auto-capture** with 3-second countdown
- **Manual capture** option
- **Requirements validation**:
  - One face detected ✓
  - Face clearly visible ✓
  - Good lighting ✓
  - Face captured successfully ✓
- **Retake capability**
- **Clean UI** with green theme

## User Flow

1. User clicks "Start Manual Verification"
2. Fills in document information (Step 1)
3. Uploads document photo (Step 2)
4. Completes face detection (Step 3):
   - Camera activates automatically
   - AI detects face in real-time
   - Auto-capture after 3 seconds (or manual capture)
   - Shows verification details
5. Submits all data for review
6. Success modal shows submitted data

## Technical Details

### Face Detection Models
Uses pre-loaded models from `/public/models/`:
- tiny_face_detector_model
- face_landmark_68_model  
- face_expression_model
- age_gender_model

### Browser Requirements
- Camera access permission required
- HTTPS or localhost required for camera access
- Modern browser with getUserMedia support

### Data Structure
```typescript
faceDetectionData: {
  faceDetected: boolean,
  age: number,           // Estimated age
  gender: string,        // 'male' or 'female'
  confidence: number     // 0-100%
}
```

## Benefits Over Previous Implementation

### Before:
- Simple camera capture with rotation guide
- No face detection or validation
- Manual capture only
- No age/gender data
- Basic video preview

### After:
- **AI-powered face detection**
- **Real-time face validation**
- **Auto-capture** when face detected
- **Age and gender estimation**
- **Confidence scoring**
- **Professional circular camera view**
- **Better user experience**
- **More verification data for compliance**

## Usage

The modal is automatically triggered by the Redux state:
```tsx
const { kycModalOpen } = useSelector((state: RootState) => state.auth);
```

To open the modal:
```tsx
dispatch(openKYCModal());
```

## Testing

1. Ensure camera permissions are granted
2. Test in different lighting conditions
3. Verify auto-capture works (3-second countdown)
4. Test manual capture button
5. Verify face detection data is captured correctly
6. Check submission includes all data

## Troubleshooting

### Camera not starting
- Check browser permissions
- Ensure HTTPS or localhost
- Try different browser

### Face not detected
- Improve lighting
- Move closer to camera
- Ensure face is centered
- Remove obstructions (glasses, mask)

### Models not loading
- Check `/public/models/` directory
- Verify all model files exist
- Check browser console for 404 errors

## Future Enhancements

- [ ] Liveness detection (blink, smile)
- [ ] Multiple face angle capture
- [ ] Document OCR integration
- [ ] Face matching with document photo
- [ ] Video recording option
- [ ] Quality score for captured images

## Support

For issues or questions:
- Check browser console for errors
- Verify model files are present
- Test camera permissions
- Review network requests

