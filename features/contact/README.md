# Contact Feature

This feature handles contact form submissions for the trading engine, allowing users to submit questions and receive support.

## Structure

```
features/contact/
├── components/
│   ├── ContactForm.tsx      # Reusable contact form component
│   ├── ContactPage.tsx      # Full contact page with file upload
│   └── index.ts             # Component exports
├── hooks/
│   └── useContact.ts        # React hook for contact operations
├── slices/
│   └── contactSlice.ts      # Redux slice for contact state management
├── api.ts                   # API functions for contact endpoints
├── types.ts                 # TypeScript type definitions
└── README.md               # This file
```

## API Endpoints

- `POST /trading_engine/contact/` - Submit a contact form
- `GET /trading_engine/contact/` - Get contact submissions (admin)

## Data Structure

### ContactFormData
```typescript
{
  email: string;      // User's email address
  question: string;   // User's question or issue description
}
```

### ContactSubmission
```typescript
{
  contact_id: string;    // Auto-generated UUID
  email: string;         // User's email address
  question: string;      // User's question
  submitted_at: string;  // Auto-generated timestamp
}
```

## Usage

### Basic Contact Form
```tsx
import { ContactForm } from '@/features/contact/components';

<ContactForm 
  onSuccess={() => console.log('Form submitted successfully')}
  onError={(error) => console.error('Form error:', error)}
/>
```

### Full Contact Page
```tsx
import { ContactPage } from '@/features/contact/components';

<ContactPage showFileUpload={true} />
```

### Using the Hook
```tsx
import { useContact } from '@/features/contact/hooks/useContact';

const { submitContact, isSubmitting, error, success } = useContact();

const handleSubmit = async (data) => {
  const result = await submitContact(data);
  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
};
```

## Features

- ✅ Form validation (email format, required fields)
- ✅ Loading states and error handling
- ✅ Success/error notifications
- ✅ Redux state management
- ✅ TypeScript support
- ✅ Optional file upload support
- ✅ Responsive design
- ✅ Dark mode support

## Integration

The contact feature is automatically integrated into the existing contact page at `/contactUs` and uses the trading engine API endpoint `/trading_engine/contact/` for form submissions.


