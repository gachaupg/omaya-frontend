# KYC Face Detection Integration

This module provides face detection capabilities for KYC verification using face-api.js.

## Components

### 1. FaceDetectionKYC
A standalone face detection component that can be used for KYC verification.

**Features:**
- Real-time face detection
- Age and gender estimation
- Auto-capture when face is detected
- Countdown timer for capture
- Manual capture option
- Face requirements validation

**Usage:**
```tsx
import { FaceDetectionKYC } from '@/features/kyc/components';

<FaceDetectionKYC
  onVerificationComplete={(data) => {
    console.log('Face data:', data);
    // Handle verification completion
  }}
  onClose={() => {
    // Handle close
  }}
/>
```

### 2. EnhancedKYCModal
An enhanced KYC modal that provides two verification methods:
1. Face Detection (Quick verification)
2. SumSub Document Verification (Full KYC)

**Usage:**
```tsx
import { EnhancedKYCModal } from '@/features/kyc/components';

// In your component
<EnhancedKYCModal />
```

## Integration Steps

### Option 1: Replace Existing KYC Modal

Replace the current `KYCVerificationModal` with `EnhancedKYCModal`:

```tsx
// In your layout or main component
import { EnhancedKYCModal } from '@/features/kyc/components';

// Instead of:
// import KYCVerificationModal from '@/features/auth/components/KYCVerificationModal';

// Use:
<EnhancedKYCModal />
```

### Option 2: Use Face Detection Standalone

If you want to use face detection in a specific page:

```tsx
import { FaceDetectionKYC } from '@/features/kyc/components';

const MyKYCPage = () => {
  const handleVerification = (data) => {
    // Send data to backend
    console.log('Face verified:', data);
  };

  return (
    <div>
      <FaceDetectionKYC 
        onVerificationComplete={handleVerification}
      />
    </div>
  );
};
```

## Requirements

### 1. Face Detection Models
The face-api.js models must be placed in the `public/models` directory. Required models:
- `tiny_face_detector_model`
- `face_landmark_68_model`
- `face_expression_model`
- `age_gender_model`

These models are already in your public/models directory.

### 2. Webpack Configuration
The Next.js config has been updated to handle face-api.js browser compatibility:

```typescript
// next.config.ts
webpack: (config, { isServer }) => {
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
  }
  return config;
}
```

### 3. Camera Permissions
Users must grant camera permissions for face detection to work.

## API Integration

Update your backend to handle face detection data:

```typescript
// Example payload structure
{
  user_id: string,
  status: boolean,
  verification_method: 'facedetection' | 'sumsub',
  face_data?: {
    faceDetected: boolean,
    age: number,
    gender: string,
    confidence: number
  }
}
```

## Features

### Face Detection KYC
- ✅ Circular camera view (350px)
- ✅ Real-time face detection
- ✅ Age and gender estimation
- ✅ Auto-capture with countdown
- ✅ Requirements validation
- ✅ Manual capture option
- ✅ Retake capability
- ✅ Clean, modern UI with green theme

### Enhanced KYC Modal
- ✅ Dual verification methods
- ✅ Method selection screen
- ✅ Back navigation
- ✅ Success modal with face data
- ✅ Integrated with Redux state
- ✅ Toast notifications
- ✅ Error handling

## Customization

### Change Circle Size
Edit the `circleSize` constant in `FaceDetectionKYC.tsx`:

```typescript
const circleSize = 350; // Change to your preferred size
```

### Change Colors
Update the Tailwind classes:
- Green theme: `#4CAF50` or `#1D8751`
- Blue theme: `#2196F3`
- Red theme: `#f44336`
- Yellow theme: `#ffeb3b`

### Auto-capture Countdown
Modify the countdown duration in the useEffect:

```typescript
if (countdown === null) {
  setCountdown(3); // Change to your preferred duration
}
```

## Troubleshooting

### Models Not Loading
- Ensure models are in `public/models/`
- Check browser console for 404 errors
- Verify Next.js is serving static files correctly

### Camera Not Working
- Check browser permissions
- Ensure HTTPS is used (required for camera access)
- Test in different browsers

### Face Detection Not Working
- Ensure good lighting
- Keep face within the circular frame
- Only one face should be visible
- Face should be clearly visible and not obstructed

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (may need HTTPS)
- Mobile browsers: ✅ Full support

