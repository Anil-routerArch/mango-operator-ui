import { isAxiosError } from 'axios';
import { toaster } from '@/components/ui/toaster';

export interface OpenWiFiErrorResponse {
  ErrorCode?: number;
  ErrorDescription?: string;
  ErrorDetails?: string;
  errorDetails?: string;
  Details?: string;
  ErrorText?: string;
  error?: string;
  Error?: string;
  message?: string;
}

const stripErrorCodePrefix = (message: string): string =>
  message.replace(/^\s*\d+\s*:\s*/, '').trim();

/**
 * Standardized OpenWiFi & Mango error message extractor.
 * Gracefully parses backend responses from OWGW, OWPROV, and OWSEC.
 * Directly extracts and surfaces real error reasons (e.g., Access denied, Network error, Server error).
 */
export const getApiErrorMessage = (
  error: unknown,
  fallback = 'An unexpected error occurred'
): string => {
  if (!error) return fallback;

  if (isAxiosError<OpenWiFiErrorResponse>(error)) {
    // 1. Network / connectivity error (no response received from server)
    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network error')) {
      return 'Network error';
    }
    if (error.code === 'ECONNABORTED' || error.message?.toLowerCase().includes('timeout')) {
      return 'Request timed out';
    }

    const status = error.response?.status;
    const data = error.response?.data as OpenWiFiErrorResponse | string | undefined;

    let rawMessage = '';

    if (typeof data === 'string' && data.trim()) {
      rawMessage = data;
    } else if (data && typeof data === 'object') {
      const details = data.ErrorDetails || data.errorDetails || data.Details;
      const desc = data.ErrorDescription || data.ErrorText || data.error || data.Error || data.message;

      // Prefer details if it has real content not containing generic downstream wrappers
      if (details && !/downstream/i.test(details) && details.trim().length > 0) {
        rawMessage = details;
      } else if (desc && !/downstream/i.test(desc) && desc.trim().length > 0) {
        rawMessage = desc;
      } else {
        rawMessage = details || desc || '';
      }
    }

    const cleanMessage = stripErrorCodePrefix(rawMessage);
    const lowerMessage = cleanMessage.toLowerCase();

    const isGenericDownstream =
      /downstream\s+(owprov|owgw|owsec)\s+returned\s+status\s+\d+/i.test(cleanMessage) ||
      lowerMessage === 'downstream error';

    // If cleanMessage has a real, specific reason from the backend
    if (cleanMessage && !isGenericDownstream) {
      if (
        lowerMessage === 'forbidden' ||
        lowerMessage.includes('access denied') ||
        lowerMessage.includes('not authorized')
      ) {
        return 'Access denied';
      }
      if (lowerMessage === 'unauthorized' || lowerMessage === 'unauthorized.') {
        return 'Unauthorized';
      }
      if (lowerMessage === 'not found' || lowerMessage === 'not found.') {
        return 'Not found';
      }
      if (lowerMessage === 'internal server error' || lowerMessage === 'internal server error.') {
        return 'Server error';
      }
      if (lowerMessage === 'bad gateway' || lowerMessage === 'service unavailable') {
        return 'Server error';
      }

      // Domain-specific permissions mappings if encountered
      if (lowerMessage.includes('requester has no role on the target scope')) {
        return 'You can only assign access within a scope that is already assigned to you.';
      }
      if (lowerMessage.includes('requester does not have full permission')) {
        return 'You cannot assign full access because your own access in this scope is lower.';
      }
      if (lowerMessage.includes('requester does not have')) {
        return 'You cannot assign a policy with more access than you have in this scope.';
      }
      if (lowerMessage.includes('still in use')) {
        return 'This item is currently in use and cannot be removed.';
      }

      return cleanMessage;
    }

    // Determine reason by HTTP status code if no custom body
    if (status === 403) return 'Access denied';
    if (status === 401) return 'Unauthorized';
    if (status === 404) return 'Not found';
    if (status === 400) return 'Bad request';
    if (status === 409) return 'Conflict: Resource in use';
    if (status === 500) return 'Server error';
    if (status === 502 || status === 503 || status === 504) {
      return 'Server error';
    }

    if (error.message && !error.message.startsWith('Request failed with status code')) {
      return error.message;
    }

    return fallback;
  }

  if (error instanceof Error) {
    if (error.message.toLowerCase().includes('network error')) {
      return 'Network error';
    }
    return error.message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallback;
};

/**
 * Convenient alias for getApiErrorMessage to extract string errors for local state / banners / form alerts
 */
export const parseApiError = getApiErrorMessage;

/**
 * Standardized error notification handler:
 * Extracts the clean error message from backend services and displays a toast notification.
 * Returns the extracted message in case the caller also needs it.
 */
export const notifyApiError = (
  error: unknown,
  fallback = 'An unexpected error occurred',
  title = 'Error'
): string => {
  const message = getApiErrorMessage(error, fallback);
  toaster.error({
    title,
    description: message,
  });
  return message;
};
