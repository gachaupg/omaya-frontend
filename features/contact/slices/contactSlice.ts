import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactApi } from '../api';
import type { ContactFormData, ContactSubmission, ContactState } from '../types';

const initialState: ContactState = {
  isLoading: false,
  isSubmitting: false,
  error: null,
  success: false,
  submissions: [],
};

// Async thunk for submitting contact form
export const submitContactForm = createAsyncThunk(
  'contact/submitContactForm',
  async (data: ContactFormData, { rejectWithValue }) => {
    try {
      const response = await contactApi.submitContact(data);
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit contact form'
      );
    }
  }
);

// Async thunk for fetching contact submissions
export const fetchContactSubmissions = createAsyncThunk(
  'contact/fetchContactSubmissions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await contactApi.getContactSubmissions();
      return response;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch contact submissions'
      );
    }
  }
);

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    resetContactState: (state) => {
      state.isLoading = false;
      state.isSubmitting = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    // Submit contact form
    builder
      .addCase(submitContactForm.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
        state.success = false;
      })
      .addCase(submitContactForm.fulfilled, (state, action: PayloadAction<ContactSubmission>) => {
        state.isSubmitting = false;
        state.success = true;
        state.submissions.unshift(action.payload);
      })
      .addCase(submitContactForm.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // Fetch contact submissions
    builder
      .addCase(fetchContactSubmissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContactSubmissions.fulfilled, (state, action: PayloadAction<ContactSubmission[]>) => {
        state.isLoading = false;
        state.submissions = action.payload;
      })
      .addCase(fetchContactSubmissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSuccess, resetContactState } = contactSlice.actions;
export default contactSlice.reducer;








