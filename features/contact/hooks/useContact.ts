import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { 
  submitContactForm, 
  fetchContactSubmissions, 
  clearError, 
  clearSuccess, 
  resetContactState 
} from '../slices/contactSlice';
import type { ContactFormData } from '../types';

export const useContact = () => {
  const dispatch = useAppDispatch();
  const contactState = useAppSelector((state) => state.contact);

  const submitContact = useCallback(
    async (data: ContactFormData) => {
      try {
        await dispatch(submitContactForm(data)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const getContactSubmissions = useCallback(async () => {
    try {
      await dispatch(fetchContactSubmissions()).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }, [dispatch]);

  const clearContactError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearContactSuccess = useCallback(() => {
    dispatch(clearSuccess());
  }, [dispatch]);

  const resetContact = useCallback(() => {
    dispatch(resetContactState());
  }, [dispatch]);

  return {
    // State
    isLoading: contactState.isLoading,
    isSubmitting: contactState.isSubmitting,
    error: contactState.error,
    success: contactState.success,
    submissions: contactState.submissions,
    
    // Actions
    submitContact,
    getContactSubmissions,
    clearContactError,
    clearContactSuccess,
    resetContact,
  };
};








