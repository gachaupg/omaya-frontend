"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        
    // Handle authentication errors
    if (this.isAuthError(error)) {
      this.handleAuthError();
    } else {
      // Handle other errors
      toast.error('An unexpected error occurred. Please try again.');
    }
  }

  private isAuthError(error: Error): boolean {
    const authErrorMessages = [
      '401',
      'unauthorized',
      'token',
      'authentication',
      'access denied',
      'invalid token',
      'token expired'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return authErrorMessages.some(msg => errorMessage.includes(msg));
  }

  private handleAuthError() {
    // Clear all auth data (but preserve p2p_act)
    if (typeof window !== 'undefined') {
      // Preserve p2p_act before clearing localStorage
      const p2pAct = localStorage.getItem("p2p_act");
      localStorage.clear();
      // Restore p2p_act after clearing
      if (p2pAct) {
        localStorage.setItem("p2p_act", p2pAct);
      }
      sessionStorage.clear();
    }
    
    // Show user-friendly message
    toast.error('Your session has expired. Please log in again.');
    
    // Redirect to login
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 1000);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#18181D]">
          <div className="max-w-md w-full bg-white dark:bg-[#23232B] shadow-lg rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {this.isAuthError(this.state.error!) 
                  ? 'Your session has expired. You will be redirected to the login page.'
                  : 'An unexpected error occurred. Please try again.'
                }
              </p>
              {!this.isAuthError(this.state.error!) && (
                <div className="mt-4">
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#1D8751] hover:bg-[#1a7a47] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1D8751]"
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

