// File: lib/types/error.ts
export interface StandardError {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: number;
    field?: string; // For form validation errors
    retryable: boolean;
  }
  
  export interface ApiErrorResponse {
    error: {
      code: string;
      message: string;
      details?: any;
    };
    status: number;
    timestamp: string;
  }
  
  export class ErrorHandler {
    static createStandardError(
      code: string,
      message: string,
      details?: any,
      field?: string,
      retryable: boolean = true
    ): StandardError {
      return {
        code,
        message,
        details,
        field,
        retryable,
        timestamp: Date.now()
      };
    }
  
    static fromApiError(error: any): StandardError {
      if (error.response?.data) {
        const apiError = error.response.data as ApiErrorResponse;
        return this.createStandardError(
          apiError.error.code || 'API_ERROR',
          apiError.error.message || 'An API error occurred',
          apiError.error.details,
          undefined,
          error.response.status >= 500
        );
      }
  
      if (error.code === 'NETWORK_ERROR') {
        return this.createStandardError(
          'NETWORK_ERROR',
          'Network connection failed. Please check your internet connection.',
          undefined,
          undefined,
          true
        );
      }
  
      return this.createStandardError(
        'UNKNOWN_ERROR',
        error.message || 'An unexpected error occurred',
        error,
        undefined,
        false
      );
    }
  }