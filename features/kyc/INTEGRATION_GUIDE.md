# Quick Integration Guide

## Step 1: Update Your Layout or App Component

Replace the existing KYC modal with the enhanced version:

### Before:
```tsx
import KYCVerificationModal from '@/features/auth/components/KYCVerificationModal';

// In your component
<KYCVerificationModal />
```

### After:
```tsx
import { EnhancedKYCModal } from '@/features/kyc/components';

// In your component
<EnhancedKYCModal />
```

## Step 2: Update the Redux Slice (Optional)

If you need to track the verification method, update your auth slice:

```typescript
// features/auth/slices/authSlice.ts

// Add to the verifyKYCStatus thunk:
export const verifyKYCStatus = createAsyncThunk(
  'auth/verifyKYCStatus',
  async ({ 
    user_id, 
    status, 
    verification_method,  // Add this
    face_data            // Add this
  }: { 
    user_id: string; 
    status: boolean;
    verification_method?: string;
    face_data?: any;
  }) => {
    // Your API call
    const response = await apiClient.post('/kyc/verify', {
      user_id,
      status,
      verification_method,
      face_data
    });
    return response.data;
  }
);
```

## Step 3: Test the Integration

1. Open your app and trigger the KYC modal
2. You should see two verification options:
   - **Face Detection** (Quick verification with camera)
   - **Document Verification** (Full KYC with SumSub)

## Step 4: Verify Camera Access

Make sure your app is running on:
- `https://` (production)
- `http://localhost:3000` (development - allowed by browsers)

## Example: Using in a Dashboard Page

```tsx
"use client";
import { useState } from 'react';
import { FaceDetectionKYC } from '@/features/kyc/components';

export default function KYCPage() {
  const [verified, setVerified] = useState(false);
  const [faceData, setFaceData] = useState(null);

  const handleVerification = async (data) => {
    console.log('Face verification data:', data);
    setFaceData(data);
    
    // Send to your backend
    try {
      const response = await fetch('/api/kyc/verify-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'current-user-id',
          face_data: data
        })
      });
      
      if (response.ok) {
        setVerified(true);
      }
    } catch (error) {
      console.error('Verification error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          KYC Verification
        </h1>
        
        {!verified ? (
          <FaceDetectionKYC
            onVerificationComplete={handleVerification}
          />
        ) : (
          <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#1D8751]">
            <h2 className="text-xl font-semibold text-[#1D8751] mb-4">
              ✓ Verified Successfully
            </h2>
            <div className="text-gray-300">
              <p>Age: {faceData?.age} years</p>
              <p>Gender: {faceData?.gender}</p>
              <p>Confidence: {faceData?.confidence}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

## Customization Options

### 1. Change Verification Timeout
```tsx
// In FaceDetectionKYC.tsx, line ~45
setCountdown(5); // Change from 3 to 5 seconds
```

### 2. Disable Auto-Capture
Remove or comment out the auto-capture useEffect in `FaceDetectionKYC.tsx`:
```tsx
// Comment out lines 50-57 for manual capture only
```

### 3. Change Circle Size
```tsx
// In FaceDetectionKYC.tsx, line ~117
const circleSize = 400; // Change from 350 to 400
```

### 4. Custom Styling
Modify the Tailwind classes in the components to match your design system.

## API Endpoint Example

Create an API route to handle face verification:

```typescript
// app/api/kyc/verify-face/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { user_id, face_data } = await request.json();
    
    // Validate face data
    if (!face_data.faceDetected) {
      return NextResponse.json(
        { error: 'No face detected' },
        { status: 400 }
      );
    }
    
    // Store in database
    // await db.kyc.create({
    //   user_id,
    //   verification_method: 'face_detection',
    //   age: face_data.age,
    //   gender: face_data.gender,
    //   confidence: face_data.confidence,
    //   verified_at: new Date()
    // });
    
    return NextResponse.json({
      success: true,
      message: 'Face verification successful'
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
```

## Troubleshooting

### Issue: "Module not found: Can't resolve 'fs'"
**Solution:** Already fixed in `next.config.ts` with webpack fallbacks.

### Issue: "Failed to fetch models"
**Solution:** Ensure model files are in `public/models/` directory.

### Issue: Camera not starting
**Solution:** 
1. Check browser permissions
2. Use HTTPS or localhost
3. Try different browser

### Issue: No face detected
**Solution:**
1. Improve lighting
2. Move closer to camera
3. Ensure only one face visible
4. Remove sunglasses/mask

## Next Steps

1. ✅ Test face detection in development
2. ✅ Test on mobile devices
3. ✅ Implement backend API
4. ✅ Add error handling
5. ✅ Test in production (HTTPS required)
6. ✅ Add analytics tracking
7. ✅ Consider adding liveness detection

## Support

For issues or questions, refer to:
- [face-api.js documentation](https://github.com/justadudewhohacks/face-api.js)
- Project README
- Component source code comments

