import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import TwoFAModal from './2fa';

// Mock store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        twoFAModalOpen: true,
        twoFAEmail: 'test@example.com',
        twoFAPassword: 'password123',
        loading: false,
        error: null,
        user: null,
        tokens: null,
        isAuthenticated: false,
        profile: null,
        kycModalOpen: false,
        ...initialState,
      },
    },
  });
};

// Mock the API client
jest.mock('../../../lib/apiClient', () => ({
  post: jest.fn(),
}));

describe('TwoFAModal', () => {
  it('renders when modal is open', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <TwoFAModal />
      </Provider>
    );

    expect(screen.getByText('Two-Factor Authentication')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter 6-digit code')).toBeInTheDocument();
  });

  it('does not render when modal is closed', () => {
    const store = createTestStore({ twoFAModalOpen: false });
    
    render(
      <Provider store={store}>
        <TwoFAModal />
      </Provider>
    );

    expect(screen.queryByText('Two-Factor Authentication')).not.toBeInTheDocument();
  });

  it('validates 2FA code input', async () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <TwoFAModal />
      </Provider>
    );

    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    const submitButton = screen.getByText('Verify');

    // Try to submit empty code
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter the 2FA code')).toBeInTheDocument();
    });

    // Enter invalid code (less than 6 digits)
    fireEvent.change(codeInput, { target: { value: '123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('2FA code must be at least 6 digits')).toBeInTheDocument();
    });
  });

  it('only allows numeric input', () => {
    const store = createTestStore();
    
    render(
      <Provider store={store}>
        <TwoFAModal />
      </Provider>
    );

    const codeInput = screen.getByPlaceholderText('Enter 6-digit code');
    
    // Try to enter non-numeric characters
    fireEvent.change(codeInput, { target: { value: 'abc123def' } });
    
    // Should only contain numbers
    expect(codeInput).toHaveValue('123');
  });

  it('shows loading state during verification', () => {
    const store = createTestStore({ loading: true });
    
    render(
      <Provider store={store}>
        <TwoFAModal />
      </Provider>
    );

    expect(screen.getByText('Verifying...')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });

  it('displays error messages', () => {
    const store = createTestStore({ error: 'Invalid 2FA code' });
    
    render(
      <Provider store={store}>
        <TwoFAModal />
      </Provider>
    );

    expect(screen.getByText('Invalid 2FA code')).toBeInTheDocument();
  });
});
