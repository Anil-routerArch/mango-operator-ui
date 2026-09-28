import { isAxiosError } from 'axios';

export interface OpenWiFiErrorResponse {
  ErrorCode?: number;
  ErrorDescription?: string;
  error?: string;
}

const stripErrorCodePrefix = (message: string): string =>
  message.replace(/^\s*\d+\s*:\s*/, '').trim();

/**
 * Standardized OpenWiFi & Mango error message extractor
 */
export const getApiErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (!isAxiosError<OpenWiFiErrorResponse>(error)) {
    if (error instanceof Error) return error.message;
    return fallback;
  }

  const data = error.response?.data;
  const rawMessage = data?.ErrorDescription || data?.error || '';
  const cleanMessage = stripErrorCodePrefix(rawMessage);
  const lowerMessage = cleanMessage.toLowerCase();

  if (!cleanMessage) {
    if (error.response?.status === 401) return 'Session expired or unauthorized. Please sign in again.';
    if (error.response?.status === 403) return 'You do not have permission to perform this action.';
    if (error.response?.status === 404) return 'The requested resource was not found.';
    if (error.response?.status === 500) return 'Internal server error. Please try again later.';
    return error.message || fallback;
  }

  // OpenWiFi Phase 1 Role & Scope Permissions mapping
  if (lowerMessage.includes('access denied') || lowerMessage.includes('not authorized')) {
    return 'You do not have permission to do that.';
  }

  if (lowerMessage.includes('requester has no role on the target scope')) {
    return 'You can only assign access within a scope that is already assigned to you.';
  }

  if (lowerMessage.includes('requester does not have full permission')) {
    return 'You cannot assign full access because your own access in this scope is lower.';
  }

  if (lowerMessage.includes('requester does not have')) {
    return 'You cannot assign a policy with more access than you have in this scope.';
  }

  if (lowerMessage.includes('unknown management policy')) {
    return 'The selected management policy could not be found.';
  }

  if (lowerMessage.includes('entity must exist')) {
    return 'Please select a valid entity.';
  }

  if (lowerMessage.includes('venue must exist')) {
    return 'Please select a valid venue.';
  }

  if (lowerMessage.includes('missing user id')) {
    return 'Please select a valid user before saving.';
  }

  if (lowerMessage.includes('still in use')) {
    return 'This item is currently in use and cannot be removed.';
  }

  if (lowerMessage.includes('only root may assign the root user role')) {
    return 'Only a root user can assign the Root role.';
  }

  return cleanMessage;
};
