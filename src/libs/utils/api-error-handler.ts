/**
 * API Error Handler Utility
 */

import { ApiError, ValidationErrors } from '@/libs/types';

export class ApiErrorHandler extends Error {
  public statusCode?: number;
  public errors?: ValidationErrors;

  constructor(message: string, statusCode?: number, errors?: ValidationErrors) {
    super(message);
    this.name = 'ApiErrorHandler';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function handleApiError(error: any): never {
  if (error instanceof ApiErrorHandler) {
    throw error;
  }

  // Handle Axios-style error response
  if (error.response) {
    const { status, data } = error.response;
    let message = data?.message || data?.error;
    const errors = data?.errors;

    if (!message && errors) {
       message = ''; 
    } else if (!message) {
       message = 'An error occurred';
    }

    throw new ApiErrorHandler(message, status, errors);
  }

  // Handle custom ApiClient error object { status, message, errors }
  if (error && typeof error === 'object' && 'status' in error && ('message' in error || 'error' in error)) {
      const message = error.message || error.error;
      throw new ApiErrorHandler(message, error.status, error.errors);
  }

  if (error instanceof Error) {
    throw new ApiErrorHandler(error.message);
  }

  if (typeof error === 'string') {
      throw new ApiErrorHandler(error);
  }

  throw new ApiErrorHandler('An unexpected error occurred');
}

export function parseApiError(response: any): ApiError | null {
  if (!response || response.success === true) {
    return null;
  }

  return {
    success: false,
    message: response.message || response.error || 'An error occurred',
    errors: response.errors,
  };
}

export function getErrorMessage(error: any): string {
  if (!error) return 'An unexpected error occurred';

  if (error instanceof ApiErrorHandler) {
    if (error.errors && Object.keys(error.errors).length > 0) {
        const messages = Object.values(error.errors).flat();
        if (messages.length > 0) {
            return messages[0] as string;
        }
    }
    return error.message || 'An unexpected error occurred';
  }

  // Handle custom ApiClient error object directly or generic object
  if (typeof error === 'object') {
      // Check if it has an 'errors' object (Laravel validation style)
      if (error.errors && typeof error.errors === 'object' && Object.keys(error.errors).length > 0) {
          const values = Object.values(error.errors);
          // If values are arrays (standard Laravel), take first string
          const firstError = values[0];
          if (Array.isArray(firstError) && firstError.length > 0) {
              return String(firstError[0]);
          }
          if (typeof firstError === 'string') {
              return firstError;
          }
      }

      if ('message' in error && error.message) {
          return String(error.message);
      }
      
      // Some backends/configs return 'error' instead of 'message'
      if ('error' in error && error.error) {
          return String(error.error);
      }
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

export function getValidationErrors(error: any): ValidationErrors | null {
  if (error instanceof ApiErrorHandler) {
    return error.errors || null;
  }
  
  // Handle custom ApiClient error object
  if (error && typeof error === 'object' && 'errors' in error) {
      return error.errors || null;
  }

  return null;
}
